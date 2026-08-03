# Security Policy

## Supported versions

ORIGIN is currently alpha software. Security fixes are applied to the latest commit on `main` and to the latest tagged alpha release when practical.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:

https://github.com/Blocpod/BitcoinOrigin/security/advisories/new

Do not disclose an unresolved vulnerability in a public issue.

A useful report includes the affected commit, impact, reproduction steps, proof of concept, and any suggested mitigation. Maintainers will acknowledge a valid report as soon as practical and coordinate disclosure based on severity and exploitability.

## Never submit

Do not submit private keys, wallet seeds, RPC passwords, cookies, private node endpoints, internal network addresses, or credentials to an issue, pull request, fixture, or evidence bundle.

## Operational guidance

- Run live node probes locally.
- Use cookie authentication or a dedicated low-privilege RPC user.
- Keep the HTTP server bound to `127.0.0.1` unless a reverse proxy and authentication policy are deliberately configured.
- Treat build manifests as executable code.
- Use disposable, isolated build environments.
- Pin source revisions, dependency archives, and container image digests.
- Never interpret a source-scanner match as a confirmed control path without review.
- Do not run untrusted build manifests with `--allow-exec` on a workstation containing secrets.
