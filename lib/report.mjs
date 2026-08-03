import { digestObject, withoutFields } from './canonical.mjs';

export function summarizeChecks(checks) {
  const summary = { pass: 0, warn: 0, fail: 0, unknown: 0, total: checks.length, coverage: 0 };
  for (const check of checks) {
    const status = ['pass', 'warn', 'fail', 'unknown'].includes(check.status) ? check.status : 'unknown';
    summary[status] += 1;
  }
  const measured = summary.total - summary.unknown;
  summary.coverage = summary.total === 0 ? 0 : Math.round((measured / summary.total) * 100);
  return summary;
}

export function finalizeReport(report) {
  const normalized = structuredClone(report);
  normalized.summary = summarizeChecks(normalized.checks ?? []);
  normalized.contentHash = digestObject(withoutFields(normalized, ['contentHash']));
  return normalized;
}

export function verifyReport(report) {
  const expected = digestObject(withoutFields(report, ['contentHash']));
  return {
    valid: typeof report.contentHash === 'string' && report.contentHash === expected,
    expected,
    actual: report.contentHash ?? null
  };
}

export function compareReports(reports) {
  const allCheckIds = [...new Set(reports.flatMap((report) => report.checks.map((check) => check.id)))].sort();
  return allCheckIds.map((checkId) => ({
    checkId,
    results: reports.map((report) => {
      const check = report.checks.find((candidate) => candidate.id === checkId);
      return {
        implementation: report.subject.name,
        status: check?.status ?? 'unknown',
        title: check?.title ?? checkId
      };
    })
  }));
}
