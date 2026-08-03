# Threat Model

## Assets

- integrity of evidence bundles;
- attribution of signed claims;
- confidentiality of local node credentials;
- reproducibility of build results;
- append-only history of observations;
- neutrality of the report format.

## Threats and mitigations

### Malicious subject software

A node or build may return environment-dependent results, detect the observer, fetch mutable dependencies, or alter behavior by time or network state. Use pinned inputs, network isolation, repeated runs, raw evidence retention, multiple operators, and differential tests.

### Malicious operator

An operator can omit evidence, select favorable tests, or publish fabricated fixtures. Use explicit mode labels, reproducible commands, content hashes, signed attestations, independent runs, and public vectors.

### Compromised release key

A valid signature is not proof that a signer remains trustworthy. Policies should support rotation, revocation, threshold approval, historical validity windows, and multiple attestations.

### Transparency-log equivocation

A centralized log could show different histories to different readers. Public deployments need inclusion and consistency proofs, independent monitors, mirrored checkpoints, and gossip.

### Source-scanner false positives

Lexical scanning can misclassify comments, tests, local tools, or defensive code. Scanner output is always a signal requiring contextual review.

### SSRF and credential leakage

An internet-facing arbitrary RPC proxy could access internal networks or leak credentials. The included server exposes no RPC proxy; probes run through the local CLI.

### Arbitrary command execution

Build manifests contain shell commands. ORIGIN refuses execution without `--allow-exec`. Production operators should use disposable hosts, rootless containers or VMs, pinned images, resource limits, and network isolation.

### Identity overclaim

A valid key signature proves control at a time, not complete identity or authorship.

## Non-goals

ORIGIN does not prevent governments, companies, maintainers, miners, exchanges, or communities from exercising power. It makes technical claims and control surfaces easier to inspect.
