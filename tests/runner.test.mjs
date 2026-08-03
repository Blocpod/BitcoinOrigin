import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reproduceBuild, runBuildManifest } from '../lib/runner.mjs';

function command(name, args, cwd) {
  const result = spawnSync(name, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

async function fixtureRepository() {
  const directory = await mkdtemp(path.join(tmpdir(), 'origin-runner-source-'));
  command('git', ['init', '-q'], directory);
  command('git', ['config', 'user.name', 'ORIGIN Tests'], directory);
  command('git', ['config', 'user.email', 'origin-tests@example.invalid'], directory);
  await writeFile(path.join(directory, 'README.md'), 'runner fixture\n');
  command('git', ['add', 'README.md'], directory);
  command('git', ['commit', '-q', '-m', 'fixture'], directory);
  const commit = command('git', ['rev-parse', 'HEAD'], directory);
  return { directory, commit };
}

function manifest(repository, commit, buildCommand, artifacts = ['artifact.txt'], timeoutSeconds = 10) {
  return {
    source: { repository, commit },
    commands: [buildCommand],
    expectedArtifacts: artifacts,
    network: 'none',
    runAsRoot: false,
    limits: { timeoutSeconds }
  };
}

test('runner produces a hashed artifact from a pinned local commit', async () => {
  const source = await fixtureRepository();
  const result = await runBuildManifest(
    manifest(source.directory, source.commit, 'printf stable > artifact.txt'),
    { allowExec: true }
  );
  assert.equal(result.source.commit, source.commit);
  assert.equal(result.artifacts.length, 1);
  assert.match(result.artifacts[0].sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.workspaceRetained, false);
});

test('repeat-build comparison detects nondeterministic artifacts', async () => {
  const source = await fixtureRepository();
  const node = JSON.stringify(process.execPath);
  const result = await reproduceBuild(
    manifest(source.directory, source.commit, `${node} -e "require('node:fs').writeFileSync('artifact.txt', Math.random().toString())"`),
    { allowExec: true, runs: 2 }
  );
  assert.equal(result.reproducible, false);
  assert.equal(result.comparison[0].reproducible, false);
});

test('runner terminates commands that exceed the manifest timeout', async () => {
  const source = await fixtureRepository();
  await assert.rejects(
    () => runBuildManifest(
      manifest(source.directory, source.commit, 'sleep 2', ['artifact.txt'], 0.1),
      { allowExec: true }
    ),
    /exited with|SIGTERM|SIGKILL/
  );
});

test('runner rejects artifact paths outside the disposable workspace', async () => {
  const source = await fixtureRepository();
  await assert.rejects(
    () => runBuildManifest(
      manifest(source.directory, source.commit, 'printf escaped > ../escape.txt', ['../escape.txt']),
      { allowExec: true }
    ),
    /escapes workspace/
  );
});
