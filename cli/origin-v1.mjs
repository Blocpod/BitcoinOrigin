#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { sealEvidenceReport, verifyEvidenceReport } from '../lib/evidence-v1.mjs';
import { createSignedCheckpoint, generateOperatorKeyPair, inclusionProof, verifyInclusion, verifySignedCheckpoint } from '../lib/transparency-v1.mjs';
import { validateAttestationManifest } from '../lib/build-policy-v1.mjs';
import { verifyLog } from '../lib/log.mjs';

const args = process.argv.slice(2);
const command = args.shift() || 'help';

function flag(name, fallback = null) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return !value || value.startsWith('--') ? true : value;
}

function positional() {
  return args.filter((value, index) => !value.startsWith('--') && (index === 0 || !args[index - 1].startsWith('--')));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
}

async function output(value, file = null) {
  const data = `${JSON.stringify(value, null, 2)}\n`;
  if (!file) return process.stdout.write(data);
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.writeFile(path.resolve(file), data);
  console.log(`Wrote ${path.resolve(file)}`);
}

function help() {
  console.log(`ORIGIN v1 evidence CLI\n\nCommands:\n  origin-v1 seal-report <input.json> [--out sealed.json]\n  origin-v1 verify-report <sealed.json>\n  origin-v1 keygen [--private private.pem] [--public public.pem]\n  origin-v1 checkpoint <log.json> <private.pem> [--operator name] [--out checkpoint.json]\n  origin-v1 verify-checkpoint <checkpoint.json> <public.pem>\n  origin-v1 proof <log.json> <index> [--out proof.json]\n  origin-v1 validate-proof <proof.json>\n  origin-v1 validate-build <manifest.json> [--attestation]\n`);
}

try {
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    case 'seal-report': {
      const [file] = positional();
      if (!file) throw new Error('seal-report requires an input file');
      await output(sealEvidenceReport(await readJson(file)), flag('out'));
      break;
    }
    case 'verify-report': {
      const [file] = positional();
      if (!file) throw new Error('verify-report requires a report file');
      const result = verifyEvidenceReport(await readJson(file));
      await output(result, flag('out'));
      if (!result.valid) process.exitCode = 1;
      break;
    }
    case 'keygen': {
      const keys = generateOperatorKeyPair();
      const privateFile = flag('private');
      const publicFile = flag('public');
      if (privateFile) await fs.writeFile(path.resolve(privateFile), keys.privateKeyPem, { mode: 0o600 });
      if (publicFile) await fs.writeFile(path.resolve(publicFile), keys.publicKeyPem);
      if (!privateFile && !publicFile) await output(keys);
      else console.log('Operator key pair written. Keep the private key offline.');
      break;
    }
    case 'checkpoint': {
      const [logFile, privateFile] = positional();
      if (!logFile || !privateFile) throw new Error('checkpoint requires a log and private key');
      const log = await readJson(logFile);
      const verified = verifyLog(log);
      const normalized = { ...verified, size: Array.isArray(log) ? log.length : log.entries?.length || 0, root: verified.merkleRoot || verified.root };
      const checkpoint = createSignedCheckpoint(normalized, await fs.readFile(path.resolve(privateFile), 'utf8'), flag('operator', 'origin-operator'));
      await output(checkpoint, flag('out'));
      break;
    }
    case 'verify-checkpoint': {
      const [checkpointFile, publicFile] = positional();
      if (!checkpointFile || !publicFile) throw new Error('verify-checkpoint requires a checkpoint and public key');
      const valid = verifySignedCheckpoint(await readJson(checkpointFile), await fs.readFile(path.resolve(publicFile), 'utf8'));
      await output({ valid });
      if (!valid) process.exitCode = 1;
      break;
    }
    case 'proof': {
      const [logFile, indexText] = positional();
      if (!logFile || indexText === undefined) throw new Error('proof requires a log and index');
      const log = await readJson(logFile);
      const entries = Array.isArray(log) ? log : log.entries;
      const proof = inclusionProof(entries.map((entry) => entry.entryHash), Number(indexText));
      await output({ ...proof, valid: verifyInclusion(proof) }, flag('out'));
      break;
    }
    case 'validate-proof': {
      const [file] = positional();
      if (!file) throw new Error('validate-proof requires a proof file');
      const valid = verifyInclusion(await readJson(file));
      await output({ valid });
      if (!valid) process.exitCode = 1;
      break;
    }
    case 'validate-build': {
      const [file] = positional();
      if (!file) throw new Error('validate-build requires a manifest');
      const result = validateAttestationManifest(await readJson(file), { attestation: args.includes('--attestation') });
      await output(result, flag('out'));
      if (!result.valid) process.exitCode = 1;
      break;
    }
    default:
      throw new Error(`unknown command: ${command}`);
  }
} catch (error) {
  console.error(`ORIGIN v1 error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
