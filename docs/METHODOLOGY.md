# Methodology

## Core rule

ORIGIN reports evidence, provenance, divergence, and uncertainty. It does not award the Bitcoin name.

## Evidence layers

### Founding claims

Statements are sourced to the founding document and classified by what kind of evidence could test them. A statement is not automatically a consensus rule.

### Historical behavior

Historical behavior is reconstructed from public block and transaction data, early source versions, binaries, release material, archived messages, and known network events. Conflicting sources remain separate.

### Current behavior

Current behavior is measured from pinned source revisions, signed artifacts, isolated builds, live local nodes, deterministic vectors, and captured RPC responses.

Reports identify whether evidence is live, fixture, imported, independently reproduced, self-attested, or unavailable.

## Status policy

`pass` means only that evidence satisfied the exact stated check. `fail` means it did not. `warn` means evidence requires review. `unknown` means evidence was absent or not run. Unknown must never become a hidden numerical penalty.

## Claims of identity or authorship

A legal name is not required for software accountability. A persistent public key can establish continuity. Control of a historically attributable key supports only the narrowly defined claim and does not automatically establish legal identity or every broader historical assertion.

## Rule changes

A production report should record proposal text, source revision, available signatures, activation mechanism, default behavior, opt-in or opt-out path, affected layers, adoption evidence, rollback behavior, and compatibility consequences.

## Control-surface analysis

ORIGIN separates protocol powers, implementation-local controls, mining policy, wallet behavior, custodial controls, institutional chokepoints, and legal enforcement.

A local RPC command is not automatically a protocol seizure mechanism. A protocol without a seizure key is not automatically immune from ecosystem coercion.

## Reproducibility

Every published check should contain enough information for another operator to rerun it. Strong reports pin all transitive build inputs and publish hashes of outputs and evidence files.
