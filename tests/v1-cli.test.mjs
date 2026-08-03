import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(args, cwd) {
  const result = spawnSync(process.execPath, ['cli/origin-v1.mjs', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

test('v1 CLI seals, verifies, checkpoints, and proves inclusion', async () => {
  const root = process.cwd();
  const dir = await mkdtemp(path.join(tmpdir(), 'origin-v1-'));
  const report = path.join(dir, 'report.json');
  const sealed = path.join(dir, 'sealed.json');
  const privateKey = path.join(dir, 'operator-private.pem');
  const publicKey = path.join(dir, 'operator-public.pem');
  const checkpoint = path.join(dir, 'checkpoint.json');
  const proof = path.join(dir, 'proof.json');
  const log = path.join(dir, 'log.json');

  await writeFile(report, JSON.stringify({
    schemaVersion: '1.0',
    subject: { name: 'CLI fixture', revision: '0123456789abcdef0123456789abcdef01234567' },
    checks: [{ id: 'fixture', layer: 'historical', status: 'pass', method: 'deterministic fixture', artifacts: [] }]
  }));

  run(['seal-report', report, '--out', sealed], root);
  const sealedReport = JSON.parse(await readFile(sealed, 'utf8'));
  run(['verify-report', sealed], root);

  const entryBody = { index: 0, timestamp: '2026-08-03T00:00:00.000Z', type: 'report', subject: 'CLI fixture', payload: { contentHash: sealedReport.contentHash }, previousHash: null };
  const canonical = await import('../lib/canonical.mjs');
  const entry = { ...entryBody, entryHash: canonical.digestObject(entryBody) };
  await writeFile(log, JSON.stringify([entry]));

  run(['keygen', '--private', privateKey, '--public', publicKey], root);
  run(['checkpoint', log, privateKey, '--operator', 'cli-test', '--out', checkpoint], root);
  run(['verify-checkpoint', checkpoint, publicKey], root);
  run(['proof', log, '0', '--out', proof], root);
  run(['validate-proof', proof], root);
});
