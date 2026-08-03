# Release Process

1. Update `CHANGELOG.md` and version fields.
2. Run `npm run check`, `npm test`, and `npm run build` on a clean checkout.
3. Verify generated reports and the transparency log.
4. Review fixture and live evidence labels.
5. Confirm no secrets or local credentials are present.
6. Create a signed tag when signing infrastructure is available.
7. Publish the source archive, standalone HTML, checksums, and release notes.
8. Record release artifact hashes in the transparency log.

Alpha releases may change schemas. Stable releases require migration notes for incompatible formats.
