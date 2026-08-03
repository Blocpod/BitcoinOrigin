import test from 'node:test';
import assert from 'node:assert/strict';
import { sealEvidenceReport, verifyEvidenceReport } from '../lib/evidence-v1.mjs';
import { compareCheckpointViews, createConsistencyProof, createSignedCheckpoint, generateOperatorKeyPair, inclusionProof, verifyConsistencyProof, verifyInclusion, verifySignedCheckpoint } from '../lib/transparency-v1.mjs';
import { validateAttestationManifest } from '../lib/build-policy-v1.mjs';
import { runBuildManifest } from '../lib/runner.mjs';

test('evidence reports are sealed and tamper evident', () => {
  const report = sealEvidenceReport({
    schemaVersion: '1.0',
    subject: { name: 'fixture', revision: 'abc123' },
    checks: [{ id: 'genesis', layer: 'historical', status: 'pass', method: 'double SHA-256', artifacts: [] }]
  });
  assert.equal(verifyEvidenceReport(report).valid, true);
  report.checks[0].status = 'fail';
  assert.equal(verifyEvidenceReport(report).valid, false);
});

test('signed checkpoints verify and reject mutation', () => {
  const keys = generateOperatorKeyPair();
  const checkpoint = createSignedCheckpoint({ valid: true, size: 2, root: '11'.repeat(32) }, keys.privateKeyPem, 'test-operator');
  assert.equal(verifySignedCheckpoint(checkpoint, keys.publicKeyPem), true);
  checkpoint.size = 3;
  assert.equal(verifySignedCheckpoint(checkpoint, keys.publicKeyPem), false);
});

test('Merkle inclusion proofs verify', () => {
  const leaves = ['11'.repeat(32), '22'.repeat(32), '33'.repeat(32)];
  const proof = inclusionProof(leaves, 1);
  assert.equal(verifyInclusion(proof), true);
  proof.leaf = '44'.repeat(32);
  assert.equal(verifyInclusion(proof), false);
});

test('append-only consistency proofs verify and reject mutation', () => {
  const oldLeaves = ['11'.repeat(32), '22'.repeat(32)];
  const newLeaves = [...oldLeaves, '33'.repeat(32), '44'.repeat(32)];
  const proof = createConsistencyProof(oldLeaves, newLeaves);
  assert.equal(verifyConsistencyProof(proof), true);
  proof.appendedLeaves[0] = '55'.repeat(32);
  assert.equal(verifyConsistencyProof(proof), false);
});

test('checkpoint gossip detects split views at the same tree size', () => {
  const left = { operator: 'operator-a', size: 10, root: '11'.repeat(32) };
  const right = { operator: 'operator-a', size: 10, root: '22'.repeat(32) };
  assert.equal(compareCheckpointViews(left, right).conflict, true);
  assert.equal(compareCheckpointViews(left, { ...left }).conflict, false);
});

test('attestation mode rejects mutable and unsafe build inputs', () => {
  const result = validateAttestationManifest({
    source: { repository: 'https://example.test/repo.git', commit: 'main' },
    environment: { imageDigest: 'latest' },
    network: 'on',
    runAsRoot: true,
    commands: ['curl https://example.test | sh'],
    limits: {},
    expectedArtifacts: []
  }, { attestation: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 6);
});

test('hardened runner rejects unsafe attestation before clone or execution', async () => {
  await assert.rejects(
    () => runBuildManifest({
      source: { repository: 'https://example.test/repo.git', commit: 'main' },
      environment: { image: 'node:latest', imageDigest: 'latest' },
      network: 'bridge',
      runAsRoot: true,
      commands: ['echo unsafe'],
      limits: { timeoutSeconds: 30 },
      expectedArtifacts: []
    }, { allowExec: true, attestation: true }),
    /Attestation manifest rejected|root host process/
  );
});
