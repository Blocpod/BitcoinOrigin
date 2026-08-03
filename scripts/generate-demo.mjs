import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVectors } from '../lib/vectors.mjs';
import { finalizeReport } from '../lib/report.mjs';
import { createLogEntry, merkleRootHex } from '../lib/log.mjs';
import { digestObject } from '../lib/canonical.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relative) => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
const implementationDir = path.join(root, 'config/implementations');
const implementationFiles = (await fs.readdir(implementationDir)).filter((name) => name.endsWith('.json')).sort();
const implementations = await Promise.all(implementationFiles.map((name) => readJson(`config/implementations/${name}`)));
const vectors = await readJson('data/vectors.json');
const vectorChecks = runVectors(vectors);
const charter = await readJson('data/charter/whitepaper-claims.json');

const reports = [];
for (const subject of implementations) {
  const fixture = await readJson(`fixtures/rpc/${subject.id}.json`);
  const checks = [
    ...charter.claims.map((claim) => ({
      id: `charter.${claim.id}`,
      layer: 'founding-claims',
      category: claim.testability,
      title: claim.label,
      description: claim.statement,
      status: 'unknown',
      evidence: {
        classification: claim.testability,
        reason: claim.testability === 'behavioral'
          ? 'Mapped to executable tests elsewhere in the report; this claim record itself is not a verdict.'
          : 'Requires architecture, economic, or governance evidence beyond a single consensus vector.'
      },
      sourceRefs: [charter.document.source]
    })),
    ...vectorChecks,
    {
      id: 'current.rpc.genesis-hash',
      layer: 'current-behavior',
      category: 'rpc-observation',
      title: 'RPC genesis identity',
      description: 'The configured fixture reports the shared historical genesis block hash.',
      status: fixture.fingerprint.genesisHash === '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f' ? 'pass' : 'fail',
      evidence: { mode: 'fixture', value: fixture.fingerprint.genesisHash },
      reproducibleCommand: `node cli/origin.mjs probe config/nodes.example.json`
    },
    {
      id: 'current.rpc.live-tip',
      layer: 'current-behavior',
      category: 'rpc-observation',
      title: 'Live chain-tip observation',
      description: 'Connect a locally controlled node to observe its current chain tip and runtime fingerprint.',
      status: 'unknown',
      evidence: { reason: 'Not run in the distributable fixture. Credentials and a live node are intentionally required.' },
      reproducibleCommand: 'node cli/origin.mjs probe config/nodes.example.json'
    },
    {
      id: 'provenance.release-signature',
      layer: 'software-provenance',
      category: 'signature',
      title: 'Release signature verification',
      description: 'Verifies that a release artifact is attributable to a declared signing key.',
      status: 'unknown',
      evidence: { reason: 'A pinned release artifact and signer policy have not been supplied to the fixture.' }
    },
    {
      id: 'provenance.reproducible-build',
      layer: 'software-provenance',
      category: 'build',
      title: 'Independent reproducible build',
      description: 'Builds a pinned revision twice in isolated environments and compares artifact hashes.',
      status: 'unknown',
      evidence: { reason: 'Build execution is opt-in and disabled in fixture mode.' },
      reproducibleCommand: 'node cli/origin.mjs reproduce config/builds/bitcoin-core.example.json --allow-exec --runs 2'
    },
    {
      id: 'control.source-signals',
      layer: 'control-surface',
      category: 'source-review',
      title: 'Privileged control signal review',
      description: 'Scans source for review signals related to overrides, freezing, trusted state, and remote policy.',
      status: 'unknown',
      evidence: { reason: 'No source checkout was scanned in fixture mode. Lexical matches never constitute a verdict.' },
      reproducibleCommand: 'node cli/origin.mjs scan-source ./path/to/source --policy config/policies/default.json'
    }
  ];

  const report = finalizeReport({
    schemaVersion: '1.0',
    id: `origin-${subject.id}-fixture`,
    generatedAt: new Date().toISOString(),
    mode: 'fixture',
    subject,
    methodology: {
      evidenceLayers: ['founding-claims', 'historical-behavior', 'current-behavior', 'software-provenance', 'control-surface'],
      neutralityRule: 'ORIGIN reports evidence and uncertainty. It does not declare an implementation to be the one true Bitcoin.'
    },
    fingerprint: fixture.fingerprint,
    checks
  });
  reports.push(report);
  await fs.writeFile(path.join(root, `data/reports/${report.id}.json`), `${JSON.stringify(report, null, 2)}\n`);
}

const comparisonDigest = digestObject(reports.map((report) => ({ id: report.id, hash: report.contentHash })));
let previousHash = null;
const logEntries = reports.map((report, index) => {
  const entry = createLogEntry({
    index,
    type: 'report-published',
    subject: report.subject.id,
    payload: { reportId: report.id, contentHash: report.contentHash, mode: report.mode },
    previousHash
  });
  previousHash = entry.entryHash;
  return entry;
});
const bundle = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  brand: {
    name: 'ORIGIN',
    descriptor: 'Bitcoin Protocol Observatory',
    tagline: 'Evidence over authority.'
  },
  notice: 'The included implementation reports are local demonstration fixtures. Run live probes, pinned builds, and source audits before drawing conclusions.',
  comparisonDigest,
  log: {
    entries: logEntries,
    merkleRoot: merkleRootHex(logEntries.map((entry) => entry.entryHash))
  },
  reports
};

await fs.writeFile(path.join(root, 'data/reports/origin-demo.json'), `${JSON.stringify(bundle, null, 2)}\n`);
await fs.writeFile(path.join(root, 'data/log/origin-log.json'), `${JSON.stringify(logEntries, null, 2)}\n`);
await fs.writeFile(path.join(root, 'web/data/reports.json'), `${JSON.stringify(bundle, null, 2)}\n`);
console.log(`Generated ${reports.length} fixture reports and transparency log.`);
