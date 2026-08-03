# ORIGIN

**Bitcoin Protocol Observatory**  
**Evidence over authority.**

ORIGIN is an open-source, local-first system for examining Bitcoin-family implementations without appointing a founder, developer group, company, government, or website as the final authority.

It keeps three questions separate:

1. What did the founding document claim?
2. What did historical software and the public record demonstrably do?
3. What does a current implementation do now?

ORIGIN publishes the inputs, commands, outputs, uncertainty, and content hashes behind every report. It does **not** declare a chain to be “the real Bitcoin,” issue a token, expose private identities, or add a seizure mechanism to any protocol.

## Included

- Award-level responsive public dashboard with no third-party frontend dependencies
- Standalone single-file website: `origin-single.html`
- Node.js CLI with no npm dependencies
- Browser and CLI genesis evidence verification
- Canonical JSON report hashing and tamper detection
- Append-only hash-chained transparency log plus bundle Merkle root
- secp256k1 key-control claim verification using Node’s native cryptography
- JSON-RPC probes for locally controlled Bitcoin-family nodes
- Cross-node fingerprint comparison
- Configurable source-code control-surface scanner
- Opt-in isolated build and reproducibility runner
- Fixture reports for Bitcoin Core, Bitcoin Knots, btcd, Bitcoin SV Node, and Bitcoin Cash Node
- Methodology, architecture, threat model, security policy, tests, Docker, and CI

## Run it

Requires Node.js 22 or newer.

```bash
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

The website also works as a standalone file:

```text
origin-single.html
```

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

Build commands are never run unless `--allow-exec` is supplied:

```bash
node cli/origin.mjs reproduce config/builds/bitcoin-core.example.json --allow-exec --runs 2
```

Pin the repository revision, container image digest, dependencies, SDK inputs, and expected artifacts before treating a build result as an attestation.

## Evidence model

A check has one of four statuses:

- `pass`: the published evidence satisfied the stated check
- `fail`: the published evidence did not satisfy the stated check
- `warn`: evidence exists but requires interpretation or review
- `unknown`: required evidence was not supplied or was not run

Unknown is never silently converted into support, opposition, or a score penalty.

## Fixture warning

The included implementation reports are **demonstration fixtures**. They prove that the report pipeline, hashing, dashboard, local vectors, and transparency log work. They are not live audits of current releases.

To produce a defensible implementation report, run:

- a live local RPC probe;
- a source checkout pinned to a commit;
- release-signature verification under an explicit signer policy;
- at least two isolated builds with pinned environments;
- implementation-specific consensus and policy vectors;
- contextual review of all scanner signals.

## Research basis

The design draws from:

- Bitcoin white paper: https://bitcoin.org/bitcoin.pdf
- Bitcoin developer reference warning that documentation is not a complete consensus specification: https://developer.bitcoin.org/reference/intro.html
- Bitcoin Improvement Proposal process: https://github.com/bitcoin/bips
- Bitcoin Core Guix reproducible-build tooling: https://github.com/bitcoin/bitcoin/tree/master/contrib/guix
- Sigstore Rekor transparency-log architecture: https://docs.sigstore.dev/logging/overview/
- in-toto attestations: https://github.com/in-toto/attestation
- SLSA provenance: https://slsa.dev/spec/v1/provenance
- The Update Framework: https://theupdateframework.github.io/specification/latest/

ORIGIN does not inherit authority from any of these sources. It borrows well-understood transparency, provenance, signing, and reproducibility patterns.

## Project structure

```text
cli/          command-line interface
config/       implementation, policy, node, and build manifests
data/         charter claims, vectors, reports, and transparency log
docs/         architecture, methodology, threat model, and adapter guide
fixtures/     safe demonstration inputs
lib/          cryptography, report, probe, scan, log, and build engines
scripts/      demo generation and single-file export
server/       dependency-free local HTTP/API server
tests/        Node test suite
web/          responsive observatory interface
```

## Neutrality rule

ORIGIN can prove that a report is internally consistent and reproducible. It cannot force communities to agree on philosophy, legitimacy, or naming. The project is designed to make disagreements inspectable rather than to conceal them behind a single score.

## License

MIT. See `LICENSE`.
