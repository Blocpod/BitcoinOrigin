# ORIGIN Governance

## Purpose

ORIGIN is a neutral evidence system. Governance exists to protect reproducibility, transparent interpretation, and the separation of technical observation from social authority.

## Roles

### Contributors

Anyone submitting code, documentation, vectors, evidence, or review.

### Reviewers

Contributors with demonstrated expertise who can provide technical review. Reviewer status grants no authority to define Bitcoin.

### Maintainers

Maintainers merge changes, manage releases, and enforce project policy. Maintainers do not decide which chain is “Bitcoin” and may not present project outputs as such.

The initial maintainer is the `Blocpod` repository owner. Additional maintainers should be added only after sustained, high-quality contribution and public review.

## Decision process

Routine changes require passing CI, at least one maintainer approval, and no unresolved security or evidence-provenance objection.

High-impact changes require a public proposal and a minimum seven-day review window. These include report scoring, evidence admission rules, cryptographic formats, transparency-log semantics, consensus-test interpretation, removal of supported implementations, and changes that could materially favor one ecosystem.

High-impact changes should receive review from at least two people with different implementation backgrounds whenever practical.

## Evidence neutrality

ORIGIN reports observable behavior and provenance. It must not:

- appoint a founder, maintainer, company, court, miner, or community as protocol oracle;
- collapse consensus rules and local policy into one score;
- label an implementation fraudulent or legitimate from technical evidence alone;
- treat popularity, market price, hash rate, or brand recognition as proof of protocol identity;
- hide dissenting interpretations when evidence supports multiple readings.

## Conflicts of interest

Reviewers and maintainers must disclose material financial, employment, litigation, or governance relationships relevant to a disputed contribution.

## Appeals

A rejected evidence or methodology proposal may be appealed in a new issue containing the original decision, disputed evidence, exact policy or technical point, and a reproducible counterexample.

## Security authority

Maintainers may privately coordinate and rapidly patch an active vulnerability. Security fixes that alter methodology or evidence semantics must receive retrospective public review after disclosure is safe.

## Amendments

Changes to this document are high-impact changes and follow the public proposal process above.
