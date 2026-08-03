# ORIGIN operator guide

## 1. Pin the subject

Record the repository, exact 40-character commit SHA, release tag, release artifact hashes, signer policy, and any submodule revisions. Mutable branches such as `main` or `master` are not acceptable for a public attestation.

## 2. Isolate the build

Use a disposable non-root environment identified by an immutable image digest. Disable networking during the build. Apply CPU, memory, disk, and time limits. Archive the toolchain and dependency inputs needed to reproduce the build.

Validate the manifest before execution:

```bash
node cli/origin-v1.mjs validate-build build.json --attestation
```

## 3. Separate evidence layers

Consensus, relay policy, mining policy, wallet behavior, custody behavior, build provenance, governance, historical evidence, and founding-document interpretation are different evidence layers. Never merge them into one legitimacy score.

## 4. Seal the report

A v1 report must include an exact subject revision, explicit methods, status values, and artifact references.

```bash
node cli/origin-v1.mjs seal-report report.json --out sealed-report.json
node cli/origin-v1.mjs verify-report sealed-report.json
```

## 5. Publish transparent commitments

Append the report content hash to the operator log using the existing ORIGIN log tooling. Generate an operator key pair and signed checkpoint:

```bash
node cli/origin-v1.mjs keygen --private operator-private.pem --public operator-public.pem
node cli/origin-v1.mjs checkpoint log.json operator-private.pem --operator example-operator --out checkpoint.json
node cli/origin-v1.mjs verify-checkpoint checkpoint.json operator-public.pem
node cli/origin-v1.mjs proof log.json 0 --out inclusion-proof.json
node cli/origin-v1.mjs validate-proof inclusion-proof.json
```

Keep the private key offline. Publish the public key, checkpoint, log snapshot, inclusion proof, report, and all referenced artifacts.

## 6. Independent replication

A second operator should reproduce the report from the same public inputs without receiving the first operator’s private workspace. Material disagreements remain visible and must not be averaged away.

## Trust boundary

A signed checkpoint proves that an operator committed to a particular log root at a particular time. It does not prove the underlying factual claim by itself. Confidence comes from transparent inputs, reproducible methods, and independent replication.
