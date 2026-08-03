# Implementation Status

**Current release:** `v0.1.0-alpha.1`  
**Classification:** Functional prototype with fixture evidence only.

## Working in this release

- Responsive dashboard and generated standalone HTML
- Local HTTP server and documented API
- Canonical report hashing
- Genesis transaction, TXID, Merkle root, header hash, target, and proof-of-work checks
- Portable append-only report log and bundle Merkle commitment
- secp256k1 key-control and P2PKH address verification
- Local JSON-RPC node probing and normalized fingerprints
- Cross-probe comparison
- Configurable source signal scanning
- Opt-in source checkout, build, artifact hashing, and repeat-build comparison
- JSON schemas, OpenAPI description, tests, Docker, Compose, and CI
- Five implementation fixtures

## Deliberately not fabricated

This release does not claim completed live audits. Those require synchronized nodes, pinned releases, verified maintainer keys, isolated build environments, implementation-specific vectors, and independent operators reproducing observations.

## Production deployment path

Publish implementation-specific vector packs, pin all build inputs, attach local node runners, configure signer policies, operate independent build workers, deploy a public verifiable log with monitors, and add multiple independent maintainers.
