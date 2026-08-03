# ORIGIN finish criteria

ORIGIN can be complete as a verification platform. It cannot be permanently complete as an audit of changing software.

## Platform completion

A release is considered feature-complete when all of the following are present and passing:

1. Deterministic Bitcoin genesis verification.
2. Versioned evidence-report validation.
3. Canonical report sealing and tamper detection.
4. Append-only log verification.
5. Merkle roots and independently verifiable inclusion proofs.
6. Signed operator checkpoints.
7. Attestation-manifest validation that rejects mutable revisions, unpinned environments, network-enabled builds, root execution, missing limits, and missing artifacts.
8. Dependency-free CLI and local API.
9. Accessible responsive website that works through `file://` without a loader or network dependency.
10. Automated tests and CI on supported Node versions.
11. Published methodology, security, governance, and operator guidance.

## Live report completion

A report may be marked `replicated` only when it names an exact source revision and release artifacts, includes hashes for every input and output, records the build and test environment, separates consensus from policy layers, includes a signed operator checkpoint and inclusion proof, and has been independently reproduced by at least one second operator.

A report without these requirements remains a fixture, local observation, or unreplicated report. ORIGIN must never convert missing evidence into a pass or fail.

## Release language

`Feature-complete` describes the software platform. It does not mean that every Bitcoin implementation has been audited or that ORIGIN has authority to decide which chain is Bitcoin.
