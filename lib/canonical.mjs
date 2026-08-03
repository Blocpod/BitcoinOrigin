import { createHash } from 'node:crypto';

export function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'bigint') return JSON.stringify(value.toString());
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

export function sha256Hex(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return createHash('sha256').update(bytes).digest('hex');
}

export function digestObject(value) {
  return sha256Hex(canonicalize(value));
}

export function withoutFields(object, fields = []) {
  const copy = structuredClone(object);
  for (const field of fields) delete copy[field];
  return copy;
}
