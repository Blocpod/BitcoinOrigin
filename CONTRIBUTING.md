# Contributing to ORIGIN

ORIGIN welcomes protocol engineers, cryptographers, reproducible-build specialists, historians, node operators, and adversarial reviewers from every Bitcoin ecosystem.

The project succeeds only if its claims can survive independent reproduction and hostile review.

## Ground rules

- Evidence beats affiliation.
- Consensus behavior, relay policy, mining policy, wallet behavior, and institutional behavior must remain separate.
- Fixture data must never be presented as live evidence.
- Every factual claim needs a reproducible method and source artifacts.
- Unknown results stay unknown. Do not convert missing evidence into a pass or fail.
- Never commit private keys, seed phrases, RPC credentials, private endpoints, or personal data.

Read [GOVERNANCE.md](GOVERNANCE.md), [docs/EVIDENCE_POLICY.md](docs/EVIDENCE_POLICY.md), and [SECURITY.md](SECURITY.md) before submitting material changes.

## Development setup

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Blocpod/BitcoinOrigin.git
cd BitcoinOrigin
npm run check
npm test
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

No third-party runtime packages are currently required.

## Contribution paths

### Code changes

1. Open an issue for substantial changes.
2. Create a focused branch.
3. Add or update tests.
4. Run `npm run ci` locally.
5. Open a pull request using the repository template.

### Evidence or vector additions

An evidence contribution must include:

- the exact subject, release, tag, and commit SHA;
- source and artifact hashes;
- the commands used;
- environment details;
- expected and observed results;
- the relevant layer: consensus, policy, wallet, custody, build, or history;
- uncertainty and known limitations.

Use the evidence proposal issue template before adding a new implementation or major vector pack.

### Documentation and methodology

Methodology changes are treated as high-impact changes. Explain what failure mode the change addresses and how it avoids favoring one implementation or community.

## Pull request expectations

A pull request should be small enough to review, contain a clear threat model when security-sensitive, and avoid unrelated formatting changes.

Required checks:

```bash
npm run check
npm test
npm run build
npm run verify
```

Generated files must be committed when their source changes:

- `origin-single.html`
- `web/data/reports.json`
- `data/reports/*.json`
- `data/log/origin-log.json`

## Review standard

Maintainers review for:

- reproducibility;
- evidence provenance;
- layer separation;
- deterministic behavior;
- security impact;
- neutrality and interpretation boundaries;
- test coverage;
- clear user-facing disclosure.

Approval means the contribution meets the published process. It does not mean maintainers endorse a chain, claimant, political position, or interpretation.

## Commit style

Use short, imperative commit messages. Examples:

- `Add BIP-322 verification vectors`
- `Harden build manifest validation`
- `Document fixture evidence boundaries`

## Security reports

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
