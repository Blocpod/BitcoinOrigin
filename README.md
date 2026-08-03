# ORIGIN

[![CI](https://github.com/Blocpod/BitcoinOrigin/actions/workflows/ci.yml/badge.svg)](https://github.com/Blocpod/BitcoinOrigin/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-f7931a.svg)](LICENSE) [![Status: Alpha](https://img.shields.io/badge/status-alpha-111111.svg)](ROADMAP.md)

**Bitcoin Protocol Observatory**  
**Evidence over authority.**

> [!IMPORTANT]
> ORIGIN is a functional **v0.1 alpha**. Included implementation results are demonstration fixtures, not live audits. Defensible public reports still require pinned releases, synchronized nodes, isolated builds, signed evidence, and independent replication.

ORIGIN is an open-source, local-first system for examining Bitcoin-family implementations without appointing a founder, developer group, company, government, or website as the final authority.

It keeps three questions separate:

1. What did the founding document claim?
2. What did historical software and the public record demonstrably do?
3. What does a current implementation do now?

ORIGIN publishes inputs, commands, outputs, uncertainty, and content hashes. It does **not** declare a chain to be “the real Bitcoin,” issue a token, expose private identities, or add a seizure mechanism to any protocol.

## Current capabilities

- Responsive public observatory and generated single-file HTML
- Dependency-free Node.js CLI and local API
- Bitcoin genesis transaction, TXID, Merkle root, header, target, and proof-of-work verification
- Canonical report hashing and tamper detection
- Portable append-only hash chain and bundle Merkle commitment
- secp256k1 key-control claim verification
- Local JSON-RPC node probing and fingerprint comparison
- Configurable source control-surface scanning
- Opt-in reproducible-build runner
- Fixture adapters for Bitcoin Core, Bitcoin Knots, btcd, Bitcoin SV Node, and Bitcoin Cash Node
- Schemas, OpenAPI, Docker, tests, CI, governance, and evidence policy

## Status

ORIGIN is ready for open-source development and local evaluation. It is **not** yet a completed protocol-conformance authority or production transparency network.

See [ROADMAP.md](ROADMAP.md), [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md), and [docs/EVIDENCE_POLICY.md](docs/EVIDENCE_POLICY.md).

## Quick start

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Blocpod/BitcoinOrigin.git
cd BitcoinOrigin
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

`npm run build` also generates `origin-single.html`, a portable standalone version of the observatory.

## CLI

```bash
node cli/origin.mjs help
node cli/origin.mjs genesis
node cli/origin.mjs run-vectors data/vectors.json
node cli/origin.mjs verify-report data/reports/origin-bitcoin-core-fixture.json
node cli/origin.mjs verify-log data/log/origin-log.json
node cli/origin.mjs scan-source ./path/to/source --policy config/policies/default.json
node cli/origin.mjs probe config/nodes.example.json --out .tmp/probes
node cli/origin.mjs compare-probes .tmp/probes/node-a.json .tmp/probes/node-b.json
node cli/origin.mjs claim-challenge --claimant 1Example --statement "I attest to control of this key."
```

Build commands never run unless `--allow-exec` is supplied:

```bash
node cli/origin.mjs reproduce config/builds/bitcoin-core.example.json --allow-exec --runs 2
```

The included build manifest is an example, not an attestation. Pin the source revision, container digest, dependencies, toolchain, and artifacts first.

## Evidence statuses

- `pass`: supplied evidence satisfied the exact check
- `fail`: supplied evidence contradicted the exact check
- `warn`: evidence exists but requires interpretation or review
- `unknown`: required evidence was absent or not run

Unknown is never silently converted into support, opposition, or a score penalty.

## Fixture boundary

Fixtures prove that ORIGIN's report pipeline, hashing, interface, vectors, and local log work. They do not prove that a current release conforms to any broader interpretation of Bitcoin.

A defensible implementation report requires a live local probe, pinned source and artifacts, release-signature verification under an explicit signer policy, isolated repeat builds, implementation-specific vectors, contextual review, and independent reproduction.

## Architecture

```text
cli/          command-line interface
config/       implementation, policy, node, and build manifests
data/         charter claims and vectors; generated reports and log
lib/          cryptography, report, probe, scan, log, and build engines
schemas/      machine-readable report, claim, and build formats
server/       dependency-free local HTTP/API server
tests/        Node test suite
web/          responsive observatory interface
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/METHODOLOGY.md](docs/METHODOLOGY.md) before extending the evidence model.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Evidence proposals follow [docs/EVIDENCE_POLICY.md](docs/EVIDENCE_POLICY.md), governance changes follow [GOVERNANCE.md](GOVERNANCE.md), and vulnerabilities must be reported privately under [SECURITY.md](SECURITY.md).

ORIGIN welcomes adversarial review from every Bitcoin ecosystem. Approval of a contribution means it meets the published process, not that maintainers endorse a chain, claimant, company, or political position.

## License

MIT. See [LICENSE](LICENSE).
