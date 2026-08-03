# Threat Model

## Assets

- integrity of evidence bundles;
- attribution of signed claims;
- confidentiality of local node credentials and operator private keys;
- reproducibility of build results;
- append-only history of observations;
- neutrality of the report format;
- consistency of public transparency views.

## Threats and mitigations

### Malicious subject software

A node or build may return environment-dependent results, detect the observer, fetch mutable dependencies, or alter behavior by time or network state. Use pinned inputs, network isolation, repeated runs, raw evidence retention, multiple operators, and differential tests.

### Malicious operator

An operator can omit evidence, select favorable tests, or publish fabricated fixtures. Use explicit mode labels, reproducible commands, content hashes, signed checkpoints, inclusion proofs, append-only consistency proofs, independent runs, and public vectors.

A signed checkpoint proves that a named operator committed to a particular tree root and size. It does not prove that every underlying claim is true. Claims remain dependent on reproducible evidence and independent replication.

### Operator-key compromise

A stolen operator key can create valid signatures. Operators should keep private keys offline, publish public-key fingerprints, define validity periods, support rotation and revocation, and preserve historical checkpoints. A key-control proof does not establish legal identity or authorship.

### Compromised subject release key

A valid subject-software signature is not proof that a signer remains trustworthy. Signer policies should support rotation, revocation, threshold approval, historical validity windows, and multiple attestations.

### Transparency-log equivocation

A log operator could show different histories to different readers.

ORIGIN v1 mitigates this with:

- signed checkpoints containing operator, tree size, root, and timestamp;
- independently verifiable entry inclusion proofs;
- append-only consistency proofs between snapshots;
- same-size checkpoint comparison that detects conflicting roots;
- portable log snapshots that monitors can mirror and compare.

Public deployments should distribute checkpoints through multiple independent channels. Two readers who receive same-operator checkpoints with the same tree size but different roots have cryptographic evidence of a split view. Checkpoints of different sizes require a valid consistency proof before the newer view is accepted as an append-only extension.

### Rollback and omission

A valid older checkpoint can be replayed, and an operator can omit unpublished evidence. Consumers should retain the newest accepted checkpoint per operator, reject size rollback, require consistency proofs for growth, compare checkpoints with other monitors, and treat absence from a log as absence of evidence rather than proof of nonexistence.

### Build-manifest escape

A build manifest may attempt to use mutable revisions, unpinned images, networking, root execution, missing resource limits, or network-capable commands. Attestation mode rejects those inputs before execution. Operators must still execute untrusted builds in disposable, non-root, resource-limited sandboxes because validation is not a complete operating-system sandbox.

### Source-scanner false positives

Lexical scanning can misclassify comments, tests, local tools, or defensive code. Scanner output is always a signal requiring contextual review.

### SSRF and credential leakage

An internet-facing arbitrary RPC proxy could access internal networks or leak credentials. The included server exposes no arbitrary RPC proxy; probes run through the local CLI against operator-controlled configuration.

### Arbitrary command execution

Build manifests contain shell commands. ORIGIN refuses execution without `--allow-exec`. Production operators should use disposable hosts, rootless containers or VMs, immutable images, resource limits, and network isolation.

### Identity overclaim

A valid key signature proves control at a time, not complete identity, authorship, historical continuity, or legal status. Reports and interfaces must preserve those distinctions.

## Non-goals

ORIGIN does not prevent governments, companies, maintainers, miners, exchanges, courts, or communities from exercising power. It makes technical claims, software behavior, provenance, and control surfaces easier to inspect.
