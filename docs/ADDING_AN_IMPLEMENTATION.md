# Adding an Implementation

1. Add a subject file under `config/implementations/`.
2. Add a safe fixture under `fixtures/rpc/` using the same `id`.
3. Add implementation-specific vectors to `data/vectors.json` or a separate vector file.
4. Define a pinned build manifest under `config/builds/`.
5. Run live probes against a node you control.
6. Scan a pinned source checkout and review every match in context.
7. Verify release signatures under a written signer policy.
8. Run at least two isolated builds.
9. Generate a report that distinguishes live, imported, fixture, and unknown evidence.
10. Publish the report hash and transparency-log entry.

Do not copy a project’s marketing claims into an ORIGIN verdict. Record the claim as a claim and attach measurable evidence separately.
