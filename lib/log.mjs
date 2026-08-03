import { digestObject, withoutFields } from './canonical.mjs';

export function createLogEntry({ index, timestamp = new Date().toISOString(), type, subject, payload, previousHash = null }) {
  const entry = { index, timestamp, type, subject, payload, previousHash };
  return { ...entry, entryHash: digestObject(entry) };
}

export function verifyLog(entries) {
  const errors = [];
  let previousHash = null;
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (entry.index !== i) errors.push(`Entry ${i} has index ${entry.index}`);
    if (entry.previousHash !== previousHash) errors.push(`Entry ${i} previousHash mismatch`);
    const expected = digestObject(withoutFields(entry, ['entryHash']));
    if (entry.entryHash !== expected) errors.push(`Entry ${i} content hash mismatch`);
    previousHash = entry.entryHash;
  }
  return { valid: errors.length === 0, errors, head: previousHash, length: entries.length };
}

export function merkleRootHex(hashes) {
  if (hashes.length === 0) return null;
  let layer = hashes.map((hash) => Buffer.from(hash, 'hex'));
  while (layer.length > 1) {
    if (layer.length % 2 === 1) layer.push(layer[layer.length - 1]);
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(Buffer.from(digestObject({ left: layer[i].toString('hex'), right: layer[i + 1].toString('hex') }), 'hex'));
    }
    layer = next;
  }
  return layer[0].toString('hex');
}
