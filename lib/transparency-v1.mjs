import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, createHash } from 'node:crypto';

function sha256Hex(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

function leafHash(value) {
  return sha256Hex(Buffer.concat([Buffer.from([0]), Buffer.from(value, 'hex')]));
}

function nodeHash(left, right) {
  return sha256Hex(Buffer.concat([Buffer.from([1]), Buffer.from(left, 'hex'), Buffer.from(right, 'hex')]));
}

export function merkleLevels(hashes) {
  if (!Array.isArray(hashes)) throw new TypeError('hashes must be an array');
  if (hashes.length === 0) return [[sha256Hex(Buffer.alloc(0))]];
  const levels = [hashes.map(leafHash)];
  while (levels.at(-1).length > 1) {
    const current = levels.at(-1);
    const next = [];
    for (let index = 0; index < current.length; index += 2) {
      next.push(index + 1 < current.length ? nodeHash(current[index], current[index + 1]) : current[index]);
    }
    levels.push(next);
  }
  return levels;
}

export function merkleRoot(hashes) {
  return merkleLevels(hashes).at(-1)[0];
}

export function inclusionProof(hashes, index) {
  if (!Number.isInteger(index) || index < 0 || index >= hashes.length) throw new RangeError('index out of range');
  const levels = merkleLevels(hashes);
  let cursor = index;
  const path = [];
  for (let level = 0; level < levels.length - 1; level += 1) {
    const nodes = levels[level];
    const sibling = cursor % 2 ? cursor - 1 : cursor + 1;
    if (sibling < nodes.length) path.push({ hash: nodes[sibling], side: cursor % 2 ? 'left' : 'right' });
    cursor = Math.floor(cursor / 2);
  }
  return { index, size: hashes.length, leaf: hashes[index], path, root: levels.at(-1)[0] };
}

export function verifyInclusion(proof) {
  let hash = leafHash(proof.leaf);
  for (const item of proof.path) hash = item.side === 'left' ? nodeHash(item.hash, hash) : nodeHash(hash, item.hash);
  return hash === proof.root;
}

export function generateOperatorKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString()
  };
}

export function createSignedCheckpoint(logResult, privateKeyPem, operator = 'origin-operator') {
  if (!logResult?.valid) throw new Error('cannot checkpoint an invalid log');
  const body = {
    version: 1,
    operator,
    size: logResult.size,
    root: logResult.root,
    createdAt: new Date().toISOString()
  };
  const signature = sign(null, Buffer.from(canonicalize(body)), createPrivateKey(privateKeyPem)).toString('base64');
  return { ...body, signature };
}

export function verifySignedCheckpoint(checkpoint, publicKeyPem) {
  const { signature, ...body } = checkpoint;
  return verify(null, Buffer.from(canonicalize(body)), createPublicKey(publicKeyPem), Buffer.from(signature, 'base64'));
}
