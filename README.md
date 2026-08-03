# ORIGIN

[![CI](https://github.com/Blocpod/BitcoinOrigin/actions/workflows/ci.yml/badge.svg)](https://github.com/Blocpod/BitcoinOrigin/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-f7931a.svg)](LICENSE) [![Status: Release Candidate](https://img.shields.io/badge/status-v1%20RC-f7931a.svg)](docs/FINISH_CRITERIA.md)

**Bitcoin Protocol Observatory**  
**Evidence over authority.**

> [!IMPORTANT]
> ORIGIN is a **v1 release candidate** for public review. The verification platform is feature-complete against its published finish criteria. Bundled implementation results remain demonstration fixtures, not live audits.

ORIGIN is an open-source, local-first system for examining Bitcoin-family implementations without appointing a founder, developer group, company, government, miner, or website as the final authority.

It keeps three questions separate:

1. What did the founding document claim?
2. What did historical software and the public record demonstrably do?
3. What does a specific implementation revision do now?

ORIGIN publishes inputs, methods, outputs, uncertainty, content hashes, signed checkpoints, and inclusion proofs. It does **not** declare a chain to be “the real Bitcoin,” issue a token, expose private identities, or add a seizure mechanism to any protocol.

## v1 capabilities

- Responsive observatory and portable single-file HTML
- Dependency-free Node.js CLI and local API
- Bitcoin genesis transaction, Merkle root, header, target, and proof-of-work verification
- Canonical report hashing and tamper detection
- Versioned evidence-report validation and JSON schema
- Append-only log verification and bundle Merkle commitments
- Independently verifiable Merkle inclusion proofs
- Ed25519-signed operator checkpoints
- secp256k1 key-control claim verification
- Local JSON-RPC node probing and fingerprint comparison
- Configurable source control-surface scanning
- Opt-in build and reproducibility tooling
- Attestation-mode validation that rejects mutable or unsafe build inputs
- Fixture adapters for Bitcoin Core, Bitcoin Knots, btcd, Bitcoin SV Node, and Bitcoin Cash Node
- OpenAPI, Docker, tests, CI, governance, evidence policy, accessibility policy, and operator guidance

## What “finished” means

ORIGIN can be finished as a verification platform. It cannot be permanently finished as an audit of changing software.

A public report may be marked `replicated` only when it names exact source and artifact revisions, records all hashes and environments, keeps consensus and policy layers separate, publishes a signed checkpoint and inclusion proof, and is independently reproduced by another operator.

Read [docs/FINISH_CRITERIA.md](docs/FINISH_CRITERIA.md) and [docs/OPERATOR_GUIDE.md](docs/OPERATOR_GUIDE.md).

## Quick start

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Blocpod/BitcoinOrigin.git
cd BitcoinOrigin
npm run ci
npm start
```

Open `http://127.0.0.1:8787`.

`npm run build` also generates `origin-single.html`, which opens directly through `file://` without a loader or network dependency.

## Existing observatory CLI

```bash
node cli/origin.mjs help
node cli/origin.mjs genesis
node cli/origin.mjs run-vectors data/vectors.json
node cli/origin.mjs verify-report data/reports/origin-bitcoin-core-fixture.json
node cli/origin.mjs verify-log data/log/origin-log.json
node cli/origin.mjs scan-source ./path/to/source --policy config/policies/default.json
node cli/origin.mjs probe config/nodes.example.json --out .tmp/probes
node cli/origin.mjs compare-probes .tmp/probes/node-a.json .tmp/probes/node-b.json
```

## v1 evidence and transparency CLI

```bash
node cli/origin-v1.mjs seal-report report.json --out sealed-report.json
node cli/origin-v1.mjs verify-report sealed-report.json
node cli/origin-v1.mjs keygen --private operator-private.pem --public operator-public.pem
node cli/origin-v1.mjs checkpoint log.json operator-private.pem --operator example --out checkpoint.json
node cli/origin-v1.mjs verify-checkpoint checkpoint.json operator-public.pem
node cli/origin-v1.mjs proof log.json 0 --out inclusion-proof.json
node cli/origin-v1.mjs validate-proof inclusion-proof.json
node cli/origin-v1.mjs validate-build build.json --attestation
```

## Evidence statuses

- `pass`: supplied evidence satisfied the exact check
- `fail`: supplied evidence contradicted the exact check
- `warn`: evidence exists but requires interpretation or review
- `unknown`: required evidence was absent or not run

Unknown is never silently converted into support, opposition, or a score penalty.

## Fixture boundary

Fixtures prove that ORIGIN's report pipeline, hashing, interface, vectors, and local log work. They do not prove that a current release conforms to any broader interpretation of Bitcoin.

A defensible implementation report requires a locally controlled synchronized node, pinned source and artifacts, release-signature verification under an explicit signer policy, isolated repeat builds, implementation-specific vectors, contextual review, signed operator evidence, and independent reproduction.

## Architecture

```text
cli/          observatory and v1 evidence command-line interfaces
config/       implementation, policy, node, and build manifests
data/         charter claims, vectors, generated reports, and logs
lib/          cryptography, reports, probes, scans, logs, builds, and transparency proofs
schemas/      machine-readable evidence and provenance formats
server/       dependency-free local HTTP/API server
tests/        Node test suite
web/          accessible responsive observatory interface
```

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Evidence proposals follow [docs/EVIDENCE_POLICY.md](docs/EVIDENCE_POLICY.md), governance changes follow [GOVERNANCE.md](GOVERNANCE.md), and vulnerabilities must be reported privately under [SECURITY.md](SECURITY.md).

ORIGIN welcomes adversarial review from every Bitcoin ecosystem. Approval of a contribution means it meets the published process, not that maintainers endorse a chain, claimant, company, or political position.

## License

MIT. See [LICENSE](LICENSE).
