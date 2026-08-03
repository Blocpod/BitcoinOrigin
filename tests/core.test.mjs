import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { canonicalize, digestObject } from '../lib/canonical.mjs';
import { GENESIS, parseTransaction, runGenesisProof, targetHex } from '../lib/bitcoin.mjs';
import { finalizeReport, verifyReport } from '../lib/report.mjs';
import { createLogEntry, verifyLog } from '../lib/log.mjs';
import { publicKeyToP2pkhAddress, verifyProvenanceClaim } from '../lib/provenance.mjs';
import { scanSource } from '../lib/scanner.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function base64UrlToBuffer(value) {
  return Buffer.from(value.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
}

test('canonical JSON sorts keys recursively', () => {
  assert.equal(canonicalize({ z: 1, a: { y: 2, b: 3 } }), '{"a":{"b":3,"y":2},"z":1}');
  assert.equal(digestObject({ a: 1 }), digestObject({ a: 1 }));
});

test('genesis proof recomputes historical evidence', () => {
  const proof = runGenesisProof();
  assert.equal(proof.headerHashPass, true);
  assert.equal(proof.merkleRootPass, true);
  assert.equal(proof.transactionShapePass, true);
  assert.equal(proof.proofOfWorkPass, true);
  assert.equal(proof.headerHash, GENESIS.displayHash);
  assert.equal(targetHex(GENESIS.bits), '00000000ffff0000000000000000000000000000000000000000000000000000');
});

test('transaction parser reads genesis coinbase', () => {
  const tx = parseTransaction(GENESIS.transactionHex);
  assert.equal(tx.version, 1);
  assert.equal(tx.inputCount, 1);
  assert.equal(tx.outputCount, 1);
  assert.equal(tx.outputs[0].valueSatoshis, '5000000000');
  assert.equal(tx.lockTime, 0);
});

test('report hash detects tampering', () => {
  const report = finalizeReport({ id: 'r1', checks: [{ id: 'a', status: 'pass' }] });
  assert.equal(verifyReport(report).valid, true);
  report.checks[0].status = 'fail';
  assert.equal(verifyReport(report).valid, false);
});

test('append-only log verifies chain and detects mutation', () => {
  const first = createLogEntry({ index: 0, type: 'test', subject: 'a', payload: { value: 1 } });
  const second = createLogEntry({ index: 1, type: 'test', subject: 'b', payload: { value: 2 }, previousHash: first.entryHash });
  assert.equal(verifyLog([first, second]).valid, true);
  second.payload.value = 3;
  assert.equal(verifyLog([first, second]).valid, false);
});

test('provenance claim verifies secp256k1 key control and address', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
  const jwk = publicKey.export({ format: 'jwk' });
  const publicKeyHex = Buffer.concat([Buffer.from([0x04]), base64UrlToBuffer(jwk.x), base64UrlToBuffer(jwk.y)]).toString('hex');
  const message = 'ORIGIN PROVENANCE CLAIM v1\nclaim-type:test';
  const signatureDerBase64 = sign('sha256', Buffer.from(message), privateKey).toString('base64');
  const address = publicKeyToP2pkhAddress(publicKeyHex);
  const result = verifyProvenanceClaim({ publicKeyHex, signatureDerBase64, message, address });
  assert.equal(result.valid, true);
  assert.equal(result.addressValid, true);
  assert.equal(result.signatureValid, true);
});

test('source scanner returns contextual signals without issuing verdicts', async () => {
  const policy = JSON.parse(await fs.readFile(path.resolve('config/policies/default.json'), 'utf8'));
  const report = await scanSource(path.resolve('fixtures/source-sample'), policy);
  assert.ok(report.findings.some((finding) => finding.ruleId === 'history-override-language'));
  assert.ok(report.findings.some((finding) => finding.ruleId === 'trusted-state-language'));
  assert.match(report.disclaimer, /not conclusions/i);
});
