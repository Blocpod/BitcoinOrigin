import { hash256Display, merkleRootFromTxids, parseTransaction, runGenesisProof, targetHex, verifyProofOfWork } from './bitcoin.mjs';

export function runVector(vector) {
  try {
    switch (vector.type) {
      case 'header-hash': {
        const actual = hash256Display(vector.headerHex);
        return result(vector, actual === vector.expected, { actual, expected: vector.expected });
      }
      case 'proof-of-work': {
        const actual = verifyProofOfWork(vector.headerHex, Number(vector.bits));
        const pass = actual.pass === vector.expectedPass;
        return result(vector, pass, actual);
      }
      case 'compact-target': {
        const actual = targetHex(Number(vector.bits));
        return result(vector, actual === vector.expected, { actual, expected: vector.expected });
      }
      case 'transaction-shape': {
        const tx = parseTransaction(vector.transactionHex);
        const checks = Object.entries(vector.expected).map(([key, expected]) => ({
          key,
          expected,
          actual: tx[key],
          pass: String(tx[key]) === String(expected)
        }));
        return result(vector, checks.every((check) => check.pass), { checks, txid: tx.txid });
      }
      case 'merkle-root': {
        const actual = merkleRootFromTxids(vector.txids);
        return result(vector, actual === vector.expected, { actual, expected: vector.expected });
      }
      case 'genesis-proof': {
        const proof = runGenesisProof();
        const pass = proof.headerHashPass && proof.merkleRootPass && proof.transactionShapePass && proof.proofOfWorkPass;
        return result(vector, pass, proof);
      }
      default:
        return result(vector, false, { error: `Unsupported vector type: ${vector.type}` }, 'unknown');
    }
  } catch (error) {
    return result(vector, false, { error: error instanceof Error ? error.message : String(error) }, 'fail');
  }
}

function result(vector, pass, evidence, forcedStatus) {
  return {
    id: vector.id,
    layer: vector.layer,
    category: vector.category,
    title: vector.title,
    description: vector.description,
    status: forcedStatus ?? (pass ? 'pass' : 'fail'),
    evidence,
    sourceRefs: vector.sourceRefs ?? [],
    reproducibleCommand: vector.reproducibleCommand ?? null
  };
}

export function runVectors(vectors) {
  return vectors.map(runVector);
}
