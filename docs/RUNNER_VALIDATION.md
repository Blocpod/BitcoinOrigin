# Reproducible-build runner validation

This snapshot adds integration tests for:

- a successful build from an exact local Git commit;
- artifact SHA-256 generation;
- repeated-run nondeterminism detection;
- command timeout termination;
- artifact path traversal rejection;
- malformed and unsafe attestation-manifest rejection.

The pull-request CI matrix runs these tests on Node.js 22 and 24.
