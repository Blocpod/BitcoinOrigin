import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function hash160(buffer) {
  const sha = createHash('sha256').update(buffer).digest();
  return createHash('ripemd160').update(sha).digest();
}

function base58Encode(buffer) {
  let value = BigInt(`0x${buffer.toString('hex') || '0'}`);
  let output = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    value /= 58n;
    output = BASE58_ALPHABET[remainder] + output;
  }
  for (const byte of buffer) {
    if (byte !== 0) break;
    output = `1${output}`;
  }
  return output || '1';
}

export function publicKeyToP2pkhAddress(publicKeyHex, network = 'mainnet') {
  const publicKey = Buffer.from(publicKeyHex, 'hex');
  if (![33, 65].includes(publicKey.length)) throw new Error('Public key must be compressed (33 bytes) or uncompressed (65 bytes)');
  const version = network === 'testnet' ? 0x6f : 0x00;
  const payload = Buffer.concat([Buffer.from([version]), hash160(publicKey)]);
  const checksum = createHash('sha256').update(createHash('sha256').update(payload).digest()).digest().subarray(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
}

export function publicKeyToSpki(publicKeyHex) {
  const publicKey = Buffer.from(publicKeyHex, 'hex');
  let prefix;
  if (publicKey.length === 33) prefix = Buffer.from('3036301006072a8648ce3d020106052b8104000a032200', 'hex');
  else if (publicKey.length === 65) prefix = Buffer.from('3056301006072a8648ce3d020106052b8104000a034200', 'hex');
  else throw new Error('Unsupported secp256k1 public key length');
  return createPublicKey({ key: Buffer.concat([prefix, publicKey]), format: 'der', type: 'spki' });
}

export function buildClaimChallenge({ claimType, claimant, nonce, issuedAt, statement }) {
  const lines = [
    'ORIGIN PROVENANCE CLAIM v1',
    `claim-type:${claimType}`,
    `claimant:${claimant}`,
    `nonce:${nonce}`,
    `issued-at:${issuedAt}`,
    `statement:${statement}`
  ];
  return lines.join('\n');
}

export function verifyProvenanceClaim(claim) {
  const required = ['publicKeyHex', 'signatureDerBase64', 'message', 'address'];
  for (const field of required) {
    if (!claim[field]) return { valid: false, error: `Missing ${field}` };
  }
  try {
    const derivedAddress = publicKeyToP2pkhAddress(claim.publicKeyHex, claim.network ?? 'mainnet');
    const key = publicKeyToSpki(claim.publicKeyHex);
    const signature = Buffer.from(claim.signatureDerBase64, 'base64');
    const signatureValid = verifySignature('sha256', Buffer.from(claim.message, 'utf8'), key, signature);
    return {
      valid: signatureValid && derivedAddress === claim.address,
      signatureValid,
      addressValid: derivedAddress === claim.address,
      derivedAddress
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}
