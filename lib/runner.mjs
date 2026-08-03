import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { digestObject } from './canonical.mjs';
import { validateAttestationManifest } from './build-policy-v1.mjs';

function run(command, args, options = {}) {
  const timeoutMs = Math.max(1, Number(options.timeoutMs ?? 15 * 60 * 1000));
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      ...options,
      timeoutMs: undefined,
      capture: undefined
    });
    let stdout = '';
    let stderr = '';
    if (options.capture) {
      child.stdout?.on('data', (chunk) => { stdout += chunk; });
      child.stderr?.on('data', (chunk) => { stderr += chunk; });
    }
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
    }, timeoutMs);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with ${code ?? signal}${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}

async function fileHash(file) {
  const hash = createHash('sha256');
  const handle = await fs.open(file, 'r');
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

function normalizeManifest(manifest) {
  const containerImage = manifest.environment?.image ?? manifest.containerImage ?? null;
  const digestMatch = containerImage?.match(/@(sha256:[0-9a-f]{64})$/i);
  return {
    source: {
      repository: manifest.source?.repository ?? manifest.repository,
      commit: manifest.source?.commit ?? manifest.revision
    },
    environment: {
      image: containerImage,
      imageDigest: manifest.environment?.imageDigest ?? digestMatch?.[1] ?? null
    },
    commands: manifest.commands ?? manifest.buildCommands ?? [],
    expectedArtifacts: manifest.expectedArtifacts ?? manifest.artifacts ?? [],
    network: manifest.network ?? (manifest.allowNetwork ? 'bridge' : 'none'),
    runAsRoot: manifest.runAsRoot ?? true,
    limits: {
      timeoutSeconds: Number(manifest.limits?.timeoutSeconds ?? manifest.timeoutSeconds ?? 900),
      memory: manifest.limits?.memory ?? '2g',
      cpus: String(manifest.limits?.cpus ?? '2'),
      pids: Number(manifest.limits?.pids ?? 256)
    }
  };
}

function assertSafeArtifactPath(sourceDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) throw new Error('artifact path must be a non-empty string');
  const absolute = path.resolve(sourceDir, relativePath);
  const prefix = `${path.resolve(sourceDir)}${path.sep}`;
  if (!absolute.startsWith(prefix)) throw new Error(`artifact path escapes workspace: ${relativePath}`);
  return absolute;
}

async function verifyCheckedOutCommit(sourceDir, expectedCommit) {
  const { stdout } = await run('git', ['rev-parse', 'HEAD'], { cwd: sourceDir, capture: true, timeoutMs: 30_000 });
  const actual = stdout.trim();
  if (actual.toLowerCase() !== expectedCommit.toLowerCase()) throw new Error(`checked-out commit mismatch: expected ${expectedCommit}, got ${actual}`);
  return actual;
}

async function commitEpoch(sourceDir) {
  const { stdout } = await run('git', ['show', '-s', '--format=%ct', 'HEAD'], { cwd: sourceDir, capture: true, timeoutMs: 30_000 });
  if (!/^\d+$/.test(stdout.trim())) throw new Error('unable to determine commit timestamp');
  return stdout.trim();
}

function hardenedDockerArgs(manifest, sourceDir, command, sourceDateEpoch) {
  const limits = manifest.limits;
  const uid = process.getuid?.();
  const gid = process.getgid?.();
  if (!Number.isInteger(uid) || !Number.isInteger(gid) || uid === 0) throw new Error('attestation mode must be run by a non-root host user');
  return [
    'run', '--rm',
    '--network=none',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    `--pids-limit=${limits.pids}`,
    `--memory=${limits.memory}`,
    `--cpus=${limits.cpus}`,
    `--user=${uid}:${gid}`,
    '--tmpfs=/tmp:rw,noexec,nosuid,size=512m',
    '-e', 'HOME=/tmp',
    '-e', `SOURCE_DATE_EPOCH=${sourceDateEpoch}`,
    '-v', `${sourceDir}:/workspace:rw`,
    '-w', '/workspace',
    manifest.environment.image,
    'sh', '-lc', command
  ];
}

export async function runBuildManifest(rawManifest, options = {}) {
  if (!options.allowExec) throw new Error('Refusing to execute build commands without --allow-exec');
  const manifest = normalizeManifest(rawManifest);
  const attestation = Boolean(options.attestation);
  if (attestation) {
    const validation = validateAttestationManifest(manifest, { attestation: true });
    if (!validation.valid) throw new Error(`Attestation manifest rejected: ${validation.errors.join('; ')}`);
    if (!manifest.environment.image?.includes('@sha256:')) throw new Error('attestation mode requires an image reference pinned by digest');
    if (process.getuid?.() === 0) throw new Error('attestation mode refuses to run from a root host process');
  }

  const workRoot = await fs.mkdtemp(path.join(options.tempRoot ?? os.tmpdir(), 'origin-build-'));
  const sourceDir = path.join(workRoot, 'source');
  const startedAt = new Date().toISOString();
  let completed = false;

  try {
    await run('git', ['clone', '--no-tags', '--filter=blob:none', manifest.source.repository, sourceDir], { timeoutMs: 5 * 60 * 1000 });
    await run('git', ['checkout', '--detach', manifest.source.commit], { cwd: sourceDir, timeoutMs: 60_000 });
    const checkedOutCommit = await verifyCheckedOutCommit(sourceDir, manifest.source.commit);
    const sourceDateEpoch = await commitEpoch(sourceDir);

    for (const command of manifest.commands) {
      const timeoutMs = manifest.limits.timeoutSeconds * 1000;
      if (manifest.environment.image) {
        const dockerArgs = attestation
          ? hardenedDockerArgs(manifest, sourceDir, command, sourceDateEpoch)
          : ['run', '--rm', `--network=${manifest.network}`, '-v', `${sourceDir}:/workspace`, '-w', '/workspace', manifest.environment.image, 'sh', '-lc', command];
        await run('docker', dockerArgs, { timeoutMs });
      } else {
        if (attestation) throw new Error('attestation mode forbids host-shell builds');
        await run('sh', ['-lc', command], { cwd: sourceDir, timeoutMs });
      }
    }

    const artifacts = [];
    for (const relativePath of manifest.expectedArtifacts) {
      const absolutePath = assertSafeArtifactPath(sourceDir, relativePath);
      const realPath = await fs.realpath(absolutePath);
      const workspacePrefix = `${await fs.realpath(sourceDir)}${path.sep}`;
      if (!realPath.startsWith(workspacePrefix)) throw new Error(`artifact resolves outside workspace: ${relativePath}`);
      const stat = await fs.stat(realPath);
      if (!stat.isFile()) throw new Error(`artifact is not a regular file: ${relativePath}`);
      artifacts.push({ path: relativePath, bytes: stat.size, sha256: await fileHash(realPath) });
    }

    completed = true;
    return {
      schemaVersion: '1.0',
      attestationMode: attestation,
      manifestDigest: digestObject(manifest),
      source: { repository: manifest.source.repository, commit: checkedOutCommit },
      sourceDateEpoch,
      environment: manifest.environment,
      network: manifest.network,
      limits: manifest.limits,
      artifacts,
      startedAt,
      completedAt: new Date().toISOString(),
      workspaceRetained: Boolean(options.keepWorkDir),
      workRoot: options.keepWorkDir ? workRoot : null
    };
  } finally {
    if (!options.keepWorkDir) await fs.rm(workRoot, { recursive: true, force: true });
    else if (!completed) console.error(`Build failed; workspace retained at ${workRoot}`);
  }
}

export async function reproduceBuild(manifest, options = {}) {
  const runs = Math.max(2, Number(options.runs ?? 2));
  const results = [];
  for (let index = 0; index < runs; index += 1) results.push(await runBuildManifest(manifest, options));
  const paths = [...new Set(results.flatMap((runResult) => runResult.artifacts.map((artifact) => artifact.path)))];
  const comparison = paths.map((artifactPath) => {
    const hashes = results.map((runResult) => runResult.artifacts.find((artifact) => artifact.path === artifactPath)?.sha256 ?? null);
    return { artifactPath, reproducible: new Set(hashes).size === 1 && !hashes.includes(null), hashes };
  });
  return {
    schemaVersion: '1.0',
    runs: results,
    comparison,
    reproducible: comparison.length > 0 && comparison.every((item) => item.reproducible)
  };
}
