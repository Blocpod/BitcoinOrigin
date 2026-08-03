import { createHash } from 'node:crypto';

const STATUSES = new Set(['pass', 'fail', 'warn', 'unknown']);
const LAYERS = new Set(['founding', 'historical', 'consensus', 'relay-policy', 'mining-policy', 'wallet', 'custody', 'build-provenance', 'governance']);

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

function digest(value) {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

export function validateEvidenceReport(report) {
  const errors = [];
  if (!report || typeof report !== 'object') return { valid: false, errors: ['report must be an object'] };
  if (report.schemaVersion !== '1.0') errors.push('schemaVersion must equal 1.0');
  if (!report.subject?.name) errors.push('subject.name is required');
  if (!report.subject?.revision) errors.push('subject.revision is required');
  if (!Array.isArray(report.checks) || report.checks.length === 0) errors.push('checks must be a non-empty array');
  for (const [index, check] of (report.checks || []).entries()) {
    if (!check.id) errors.push(`checks[${index}].id is required`);
    if (!STATUSES.has(check.status)) errors.push(`checks[${index}].status is invalid`);
    if (!LAYERS.has(check.layer)) errors.push(`checks[${index}].layer is invalid`);
    if (!check.method) errors.push(`checks[${index}].method is required`);
    if (!Array.isArray(check.artifacts)) errors.push(`checks[${index}].artifacts must be an array`);
  }
  return { valid: errors.length === 0, errors };
}

export function sealEvidenceReport(report) {
  const copy = structuredClone(report);
  delete copy.contentHash;
  const validation = validateEvidenceReport(copy);
  if (!validation.valid) throw new Error(validation.errors.join('; '));
  return { ...copy, contentHash: digest(copy) };
}

export function verifyEvidenceReport(report) {
  const validation = validateEvidenceReport(report);
  if (!validation.valid) return { valid: false, errors: validation.errors, hashMatch: false };
  const copy = structuredClone(report);
  const expected = copy.contentHash;
  delete copy.contentHash;
  const actual = digest(copy);
  return { valid: expected === actual, errors: expected === actual ? [] : ['contentHash mismatch'], hashMatch: expected === actual, expected, actual };
}
