# Evidence Policy

## Objective

ORIGIN accepts evidence that another operator can inspect and, where technically possible, reproduce.

## Evidence classes

### Founding claims

Statements explicitly present in founding documents. These are claims and design descriptions, not executable consensus specifications by themselves.

### Historical behavior

Observable behavior from pinned historical source, binaries, blocks, transactions, messages, or archived operator records.

### Current implementation behavior

Results produced by a named implementation at an exact revision under a documented environment.

### Institutional behavior

Actions by exchanges, custodians, courts, companies, mining pools, or other organizations. Institutional behavior must not be reported as protocol behavior.

## Required metadata

Every non-fixture report should include subject and revision, artifact hashes, acquisition source and time, commands and configuration, environment, operator identity or persistent signing key, vector version, raw output or evidence-bundle hash, and interpretation boundaries.

## Status meanings

- `pass`: supplied evidence satisfied the stated check.
- `fail`: supplied evidence contradicted the stated check.
- `warn`: evidence exists but interpretation or review is required.
- `unknown`: required evidence was absent, unavailable, or not run.

A status applies only to the exact check. It must not be generalized into protocol identity, legitimacy, intent, or morality.

## Fixtures

Fixtures must include `fixture` in the filename or report metadata and be visibly labeled in the interface. Fixtures test ORIGIN, not the subject implementation.

## Interpretation

An interpretation must include the observation, the inference connecting it to the interpretation, plausible competing interpretations, and the responsible reviewer or signer.

## Corrections

Published evidence is not silently overwritten. Corrections create a new report referencing the superseded report and explaining the change.

## Exclusions

ORIGIN may reject evidence that cannot be lawfully redistributed, exposes secrets or personal information, relies only on screenshots when raw artifacts exist, omits revisions or commands, combines technical layers misleadingly, or makes unsupported identity claims.
