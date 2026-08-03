# ORIGIN Architecture

## Design objective

ORIGIN makes technical claims testable without turning the test operator into a protocol oracle. Each layer emits inspectable JSON that can be hashed, signed, mirrored, and independently reproduced.

## Components

### Evidence vectors

`data/vectors.json` contains deterministic checks. Vectors identify their layer, category, inputs, expected behavior, source references, and reproduction command.

### Node probes

`lib/rpc.mjs` queries locally controlled nodes and normalizes runtime fingerprints. Credentials remain local. The web server intentionally exposes no arbitrary RPC proxy.

### Source scanner

`lib/scanner.mjs` searches pinned source trees for review signals. Matches are never verdicts. Every finding retains the file, line, excerpt, rule, and interpretation guidance.

### Reproducibility runner

`lib/runner.mjs` checks out a declared revision, runs explicit build commands, hashes artifacts, and compares repeat builds. Execution is disabled unless `--allow-exec` is present.

Production manifests must pin source commits, container digests, toolchains, dependency archives, environment variables, and artifact paths.

### Provenance claims

`lib/provenance.mjs` verifies a secp256k1 signature and its derived P2PKH address. This proves control of a key at signing time. It does not by itself prove legal identity, complete authorship, or historical continuity.

### Reports

Reports contain subject metadata, evidence mode, checks, raw observations, reproduction commands, status summary, and a canonical content hash. Coverage reports how much was measured, not how “Bitcoin-like” an implementation is.

### Transparency record

The alpha log is a portable hash chain with a bundle Merkle commitment. A production transparency network additionally requires signed checkpoints, inclusion and consistency proofs, mirrors, independent monitors, and split-view detection.

### Interface

The dashboard is a presentation layer. The CLI, JSON formats, and verification libraries remain usable without it. `npm run build` generates a portable `origin-single.html`.

## Trust boundaries

ORIGIN distinguishes:

- subject evidence: what software or an artifact did;
- operator evidence: the environment and commands used to observe it;
- bundle integrity: whether a report changed after generation;
- interpretation: the conclusion a reviewer draws.

A valid content hash proves integrity of a report, not truthfulness of an untrusted input. Public claims require independent reproduction.
