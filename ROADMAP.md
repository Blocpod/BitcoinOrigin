# ORIGIN Roadmap

## Completed: engineering foundation

- Complete source tree, MIT license, governance, security policy, contribution process, and CI
- Accessible responsive observatory and offline standalone HTML
- Deterministic Bitcoin genesis verification
- Versioned evidence reports, canonical content hashes, and tamper detection
- Local node probing, cross-implementation fingerprints, source scanning, and fixture vectors
- Append-only log verification and bundle Merkle commitments
- Merkle inclusion proofs and append-only consistency proofs
- Ed25519-signed operator checkpoints and split-view comparison
- Attestation-manifest validation for pinned revisions and environments
- Hardened non-root, network-disabled container build mode
- Repeat-build artifact comparison
- Verified release workflow with checksums and GitHub artifact provenance
- Operator guide, finish criteria, evidence policy, threat model, and accessibility standard

## Current: v1 release candidate validation

The software platform is feature-complete against [docs/FINISH_CRITERIA.md](docs/FINISH_CRITERIA.md). The remaining gates are public validation rather than missing core architecture:

- independent security and methodology review;
- manual accessibility testing on iPadOS Safari, Android Chrome, keyboard-only navigation, 200% zoom, reduced motion, and screen readers;
- at least two independent operators running the same public evidence pack;
- first reports built from pinned releases, synchronized nodes, isolated builds, signed checkpoints, and independent replication;
- stable public-key rotation and revocation policy for operators;
- public checkpoint mirrors or external commitment channels.

No fixture may be relabeled as a live audit to satisfy these gates.

## v1.1: interoperability and deeper evidence packs

- BIP-322 generic signed-message verification and relevant legacy-message compatibility
- Challenge expiration, domain separation, nonces, and replay protection
- Expanded transaction, script, block, difficulty, reorganization, Merkle, and SPV vectors
- Implementation-specific adapters for unsupported RPC or internal test interfaces
- SBOM generation and upstream release-signature policy packs
- Compact consistency proofs for large public logs

## v2: distributed public observatory

- Multiple independently governed log operators and monitors
- Automated checkpoint gossip and mirror discovery
- External commitment adapters
- Public replicated reports for supported implementation revisions
- Long-term maintainer rotation and cross-ecosystem review council

A software milestone can be complete. A report remains valid only for the exact revision, artifacts, methods, and evidence it names.
