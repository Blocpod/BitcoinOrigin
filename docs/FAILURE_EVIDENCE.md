# Build failure evidence

ORIGIN build failures are first-class evidence. The hardened runner raises a `BuildEvidenceError` containing a structured evidence object with:

- failure stage;
- normalized manifest digest;
- source and environment identifiers;
- network and resource policy;
- commands completed before failure;
- artifacts verified before failure;
- sanitized command, timeout, exit, stdout, and stderr details;
- timestamps and workspace-retention status.

This prevents rejected manifests, timeouts, build errors, and artifact-validation failures from disappearing as unstructured console output.
