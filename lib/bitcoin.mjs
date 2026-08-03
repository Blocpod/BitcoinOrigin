import { createHash } from 'node:crypto';

export const GENESIS = Object.freeze({
  headerHex:
    '01000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a' +
    '29ab5f49' +
    'ffff001d' +
    '1dac2b7c',
  displayHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
  merkleRootDisplay: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
  bits: 0x1d00ffff,
  transactionHex:
    '0100000001' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    'ffffffff' +
    '4d' +
    '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73' +
    'ffffffff' +
    '01' +
    '00f2052a01000000' +
    '43' +
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac' +
    '00000000'
});

export function reverseHex(hex) {
  return Buffer.from(hex, 'hex').reverse().toString('hex');
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest();
}

export function sha256d(buffer) {
  return sha256(sha256(buffer));
}

export function hash256Display(hex) {
  return Buffer.from(sha256d(Buffer.from(hex, 'hex'))).reverse().toString('hex');
}

export function decodeCompact(bits) {
  const exponent = bits >>> 24;
  const mantissa = bits & 0x007fffff;
  const negative = Boolean(bits & 0x00800000);
  if (negative) throw new Error('Negative compact targets are invalid for proof of work');
  if (mantissa === 0) return 0n;
  if (exponent <= 3) {
    return BigInt(mantissa) >> BigInt(8 * (3 - exponent));
  }
  return BigInt(mantissa) << BigInt(8 * (exponent - 3));
}

export function targetHex(bits) {
  return decodeCompact(bits).toString(16).padStart(64, '0');
}

export function verifyProofOfWork(headerHex, bits) {
  const displayHash = hash256Display(headerHex);
  const hashValue = BigInt(`0x${displayHash}`);
  const target = decodeCompact(bits);
  return {
    pass: hashValue <= target,
    displayHash,
    targetHex: target.toString(16).padStart(64, '0')
  };
}

export function readVarInt(buffer, offset = 0) {
  if (offset >= buffer.length) throw new Error('Unexpected end of buffer while reading varint');
  const first = buffer[offset];
  if (first < 0xfd) return { value: BigInt(first), size: 1 };
  if (first === 0xfd) {
    if (offset + 3 > buffer.length) throw new Error('Truncated uint16 varint');
    return { value: BigInt(buffer.readUInt16LE(offset + 1)), size: 3 };
  }
  if (first === 0xfe) {
    if (offset + 5 > buffer.length) throw new Error('Truncated uint32 varint');
    return { value: BigInt(buffer.readUInt32LE(offset + 1)), size: 5 };
  }
  if (offset + 9 > buffer.length) throw new Error('Truncated uint64 varint');
  return { value: buffer.readBigUInt64LE(offset + 1), size: 9 };
}

function ensureRemaining(buffer, offset, bytes, label) {
  if (offset + bytes > buffer.length) throw new Error(`Truncated transaction while reading ${label}`);
}

export function parseTransaction(hex) {
  const buffer = Buffer.from(hex, 'hex');
  let offset = 0;
  ensureRemaining(buffer, offset, 4, 'version');
  const version = buffer.readInt32LE(offset);
  offset += 4;

  let hasWitness = false;
  if (buffer[offset] === 0x00 && buffer[offset + 1] !== 0x00) {
    hasWitness = true;
    offset += 2;
  }

  const inputCountVar = readVarInt(buffer, offset);
  const inputCount = Number(inputCountVar.value);
  offset += inputCountVar.size;
  const inputs = [];

  for (let i = 0; i < inputCount; i += 1) {
    ensureRemaining(buffer, offset, 36, 'input outpoint');
    const previousTxid = Buffer.from(buffer.subarray(offset, offset + 32)).reverse().toString('hex');
    offset += 32;
    const previousIndex = buffer.readUInt32LE(offset);
    offset += 4;
    const scriptLengthVar = readVarInt(buffer, offset);
    const scriptLength = Number(scriptLengthVar.value);
    offset += scriptLengthVar.size;
    ensureRemaining(buffer, offset, scriptLength, 'input script');
    const scriptSig = buffer.subarray(offset, offset + scriptLength).toString('hex');
    offset += scriptLength;
    ensureRemaining(buffer, offset, 4, 'sequence');
    const sequence = buffer.readUInt32LE(offset);
    offset += 4;
    inputs.push({ previousTxid, previousIndex, scriptSig, sequence });
  }

  const outputCountVar = readVarInt(buffer, offset);
  const outputCount = Number(outputCountVar.value);
  offset += outputCountVar.size;
  const outputs = [];

  for (let i = 0; i < outputCount; i += 1) {
    ensureRemaining(buffer, offset, 8, 'output value');
    const valueSatoshis = buffer.readBigUInt64LE(offset);
    offset += 8;
    const scriptLengthVar = readVarInt(buffer, offset);
    const scriptLength = Number(scriptLengthVar.value);
    offset += scriptLengthVar.size;
    ensureRemaining(buffer, offset, scriptLength, 'output script');
    const scriptPubKey = buffer.subarray(offset, offset + scriptLength).toString('hex');
    offset += scriptLength;
    outputs.push({ valueSatoshis: valueSatoshis.toString(), scriptPubKey });
  }

  const witnesses = [];
  if (hasWitness) {
    for (let i = 0; i < inputCount; i += 1) {
      const itemCountVar = readVarInt(buffer, offset);
      const itemCount = Number(itemCountVar.value);
      offset += itemCountVar.size;
      const stack = [];
      for (let j = 0; j < itemCount; j += 1) {
        const itemLengthVar = readVarInt(buffer, offset);
        const itemLength = Number(itemLengthVar.value);
        offset += itemLengthVar.size;
        ensureRemaining(buffer, offset, itemLength, 'witness item');
        stack.push(buffer.subarray(offset, offset + itemLength).toString('hex'));
        offset += itemLength;
      }
      witnesses.push(stack);
    }
  }

  ensureRemaining(buffer, offset, 4, 'locktime');
  const lockTime = buffer.readUInt32LE(offset);
  offset += 4;
  if (offset !== buffer.length) throw new Error(`Transaction has ${buffer.length - offset} trailing bytes`);

  return {
    version,
    hasWitness,
    inputCount,
    outputCount,
    inputs,
    outputs,
    witnesses,
    lockTime,
    txid: hash256Display(hex),
    byteLength: buffer.length
  };
}

export function merkleRootFromTxids(txidsDisplayOrder) {
  if (!Array.isArray(txidsDisplayOrder) || txidsDisplayOrder.length === 0) {
    throw new Error('At least one transaction ID is required');
  }
  let layer = txidsDisplayOrder.map((txid) => Buffer.from(txid, 'hex').reverse());
  while (layer.length > 1) {
    if (layer.length % 2 === 1) layer.push(layer[layer.length - 1]);
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(sha256d(Buffer.concat([layer[i], layer[i + 1]])));
    }
    layer = next;
  }
  return Buffer.from(layer[0]).reverse().toString('hex');
}

export function runGenesisProof() {
  const transaction = parseTransaction(GENESIS.transactionHex);
  const headerHash = hash256Display(GENESIS.headerHex);
  const merkleRoot = merkleRootFromTxids([transaction.txid]);
  const proofOfWork = verifyProofOfWork(GENESIS.headerHex, GENESIS.bits);
  return {
    headerHash,
    expectedHeaderHash: GENESIS.displayHash,
    headerHashPass: headerHash === GENESIS.displayHash,
    txid: transaction.txid,
    expectedMerkleRoot: GENESIS.merkleRootDisplay,
    merkleRoot,
    merkleRootPass: merkleRoot === GENESIS.merkleRootDisplay,
    transactionShapePass:
      transaction.version === 1 &&
      transaction.inputCount === 1 &&
      transaction.outputCount === 1 &&
      transaction.outputs[0].valueSatoshis === '5000000000',
    proofOfWorkPass: proofOfWork.pass,
    targetHex: proofOfWork.targetHex,
    transaction
  };
}
