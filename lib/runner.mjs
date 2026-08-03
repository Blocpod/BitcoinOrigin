import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))));
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

export async function runBuildManifest(manifest, options = {}) {
  if (!options.allowExec) throw new Error('Refusing to execute build commands without --allow-exec');
  const workRoot = await fs.mkdtemp(path.join(options.tempRoot ?? os.tmpdir(), 'origin-build-'));
  const sourceDir = path.join(workRoot, 'source');
  await run('git', ['clone', '--filter=blob:none', manifest.repository, sourceDir]);
  await run('git', ['checkout', '--detach', manifest.revision], { cwd: sourceDir });

  const buildCommands = manifest.buildCommands ?? [];
  for (const command of buildCommands) {
    if (manifest.containerImage) {
      const network = manifest.allowNetwork ? 'bridge' : 'none';
      await run('docker', [
        'run', '--rm', `--network=${network}`,
        '-v', `${sourceDir}:/workspace`, '-w', '/workspace',
        manifest.containerImage, 'sh', '-lc', command
      ]);
    } else {
      await run('sh', ['-lc', command], { cwd: sourceDir });
    }
  }

  const artifacts = [];
  for (const relativePath of manifest.artifacts ?? []) {
    const absolutePath = path.join(sourceDir, relativePath);
    const stat = await fs.stat(absolutePath);
    artifacts.push({ path: relativePath, bytes: stat.size, sha256: await fileHash(absolutePath) });
  }
  return { workRoot, sourceDir, artifacts, generatedAt: new Date().toISOString() };
}

export async function reproduceBuild(manifest, options = {}) {
  const runs = Math.max(2, Number(options.runs ?? 2));
  const results = [];
  for (let i = 0; i < runs; i += 1) results.push(await runBuildManifest(manifest, options));
  const paths = [...new Set(results.flatMap((runResult) => runResult.artifacts.map((artifact) => artifact.path)))];
  const comparison = paths.map((artifactPath) => {
    const hashes = results.map((runResult) => runResult.artifacts.find((artifact) => artifact.path === artifactPath)?.sha256 ?? null);
    return { artifactPath, reproducible: new Set(hashes).size === 1 && !hashes.includes(null), hashes };
  });
  return { runs: results, comparison, reproducible: comparison.every((item) => item.reproducible) };
}
