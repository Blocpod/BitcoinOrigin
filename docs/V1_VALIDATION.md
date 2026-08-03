# ORIGIN v1 release-candidate validation

This file marks the repository snapshot submitted through the pull-request CI path for final v1 release-candidate validation.

The required checks are:

- complete `npm run ci` pipeline on Node.js 22 and 24;
- unit and end-to-end CLI tests;
- deterministic standalone HTML generation;
- observatory and v1 CLI smoke tests;
- report and transparency-log verification.

A green result validates the software snapshot. It does not convert demonstration fixtures into live implementation audits.
