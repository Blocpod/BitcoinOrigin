#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runGenesisProof } from '../lib/bitcoin.mjs';
import { runVectors } from '../lib/vectors.mjs';
import { compareReports, verifyReport } from '../lib/report.mjs';
import { buildClaimChallenge, verifyProvenanceClaim } from '../lib/provenance.mjs';
import { createLogEntry, verifyLog } from '../lib/log.mjs';
import { scanSource } from '../lib/scanner.mjs';
import { compareProbes, probeNode } from '../lib/rpc.mjs';
import { reproduceBuild, runBuildManifest } from '../lib/runner.mjs';

const args = process.argv.slice(2);
const command = args.shift() ?? 'help';

function flag(name, fallback = null) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const next = args[index + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

function positional() {
  return args.filter((arg, index) => !arg.startsWith('--') && (index === 0 || !args[index - 1].startsWith('--')));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
}

async function writeResult(result, out) {
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (out) {
    await fs.mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await fs.writeFile(path.resolve(out), json);
    console.log(`Wrote ${path.resolve(out)}`);
  } else {
    process.stdout.write(json);
  }
}

function help() {
  console.log(`ORIGIN — Bitcoin Protocol Observatory\n\nUsage:\n  origin genesis\n  origin run-vectors [file] [--out file]\n  origin verify-report <file>\n  origin compare <report...> [--out file]\n  origin verify-log <file>\n  origin append-log <log.json> <entry.json> [--out file]\n  origin claim-challenge --claim-type authorship --claimant <address> --statement <text>\n  origin verify-claim <claim.json>\n  origin scan-source <directory> [--policy file] [--out file]\n  origin probe <nodes.json> [--out directory]\n  origin compare-probes <probe...> [--out file]\n  origin build <manifest.json> --allow-exec [--out file]\n  origin reproduce <manifest.json> --allow-exec [--runs 2] [--out file]\n\nSafety:\n  Build commands never execute unless --allow-exec is explicitly present.\n  Source-scan matches are review signals, not conclusions.\n`);
}

try {
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    case 'genesis':
      await writeResult(runGenesisProof(), flag('out'));
      break;
    case 'run-vectors': {
      const [file = 'data/vectors.json'] = positional();
      await writeResult(runVectors(await readJson(file)), flag('out'));
      break;
    }
    case 'verify-report': {
      const [file] = positional();
      if (!file) throw new Error('verify-report requires a file');
      const result = verifyReport(await readJson(file));
      await writeResult(result, flag('out'));
      if (!result.valid) process.exitCode = 1;
      break;
    }
    case 'compare': {
      const files = positional();
      if (files.length < 2) throw new Error('compare requires at least two report files');
      await writeResult(compareReports(await Promise.all(files.map(readJson))), flag('out'));
      break;
    }
    case 'verify-log': {
      const [file] = positional();
      if (!file) throw new Error('verify-log requires a file');
      const result = verifyLog(await readJson(file));
      await writeResult(result, flag('out'));
      if (!result.valid) process.exitCode = 1;
      break;
    }
    case 'append-log': {
      const [logFile, entryFile] = positional();
      if (!logFile || !entryFile) throw new Error('append-log requires a log file and an entry payload file');
      const entries = await readJson(logFile);
      const payload = await readJson(entryFile);
      const entry = createLogEntry({
        index: entries.length,
        type: payload.type,
        subject: payload.subject,
        payload: payload.payload,
        previousHash: entries.at(-1)?.entryHash ?? null
      });
      entries.push(entry);
      await writeResult(entries, flag('out') || logFile);
      break;
    }
    case 'claim-challenge': {
      const challenge = buildClaimChallenge({
        claimType: flag('claim-type', 'authorship'),
        claimant: flag('claimant', 'unknown'),
        nonce: flag('nonce', crypto.randomUUID()),
        issuedAt: new Date().toISOString(),
        statement: flag('statement', 'I attest to control of this key for the stated claim.')
      });
      console.log(challenge);
      break;
    }
    case 'verify-claim': {
      const [file] = positional();
      if (!file) throw new Error('verify-claim requires a claim file');
      const result = verifyProvenanceClaim(await readJson(file));
      await writeResult(result, flag('out'));
      if (!result.valid) process.exitCode = 1;
      break;
    }
    case 'scan-source': {
      const [directory] = positional();
      if (!directory) throw new Error('scan-source requires a source directory');
      const policy = await readJson(flag('policy', 'config/policies/default.json'));
      await writeResult(await scanSource(directory, policy), flag('out'));
      break;
    }
    case 'probe': {
      const [file] = positional();
      if (!file) throw new Error('probe requires a node config file');
      const config = await readJson(file);
      const probes = [];
      for (const node of config.nodes ?? []) probes.push(await probeNode(node));
      const out = flag('out');
      if (out) {
        await fs.mkdir(path.resolve(out), { recursive: true });
        for (const probe of probes) {
          const safe = probe.config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          await fs.writeFile(path.join(path.resolve(out), `${safe}.json`), `${JSON.stringify(probe, null, 2)}\n`);
        }
        console.log(`Wrote ${probes.length} probe files to ${path.resolve(out)}`);
      } else await writeResult(probes);
      break;
    }
    case 'compare-probes': {
      const files = positional();
      if (files.length < 2) throw new Error('compare-probes requires at least two probe files');
      await writeResult(compareProbes(await Promise.all(files.map(readJson))), flag('out'));
      break;
    }
    case 'build': {
      const [file] = positional();
      if (!file) throw new Error('build requires a manifest');
      const result = await runBuildManifest(await readJson(file), { allowExec: args.includes('--allow-exec') });
      await writeResult(result, flag('out'));
      break;
    }
    case 'reproduce': {
      const [file] = positional();
      if (!file) throw new Error('reproduce requires a manifest');
      const result = await reproduceBuild(await readJson(file), {
        allowExec: args.includes('--allow-exec'),
        runs: Number(flag('runs', 2))
      });
      await writeResult(result, flag('out'));
      if (!result.reproducible) process.exitCode = 1;
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`ORIGIN error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
