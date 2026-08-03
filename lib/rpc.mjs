import { digestObject } from './canonical.mjs';

export async function rpcCall(endpoint, method, params = [], options = {}) {
  const headers = { 'content-type': 'application/json' };
  if (options.username || options.password) {
    headers.authorization = `Basic ${Buffer.from(`${options.username ?? ''}:${options.password ?? ''}`).toString('base64')}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '1.0', id: 'origin', method, params }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message ?? JSON.stringify(payload.error));
    return payload.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeNode(config) {
  const calls = [
    ['getnetworkinfo', []],
    ['getblockchaininfo', []],
    ['getblockhash', [0]],
    ['getmempoolinfo', []],
    ['getchaintips', []]
  ];
  const results = {};
  for (const [method, params] of calls) {
    try {
      results[method] = { ok: true, result: await rpcCall(config.endpoint, method, params, config.auth ?? {}) };
    } catch (error) {
      results[method] = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  const genesisHash = results.getblockhash?.ok ? results.getblockhash.result : null;
  if (genesisHash) {
    try {
      results.getblockheader = { ok: true, result: await rpcCall(config.endpoint, 'getblockheader', [genesisHash, true], config.auth ?? {}) };
    } catch (error) {
      results.getblockheader = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  const fingerprintBody = {
    implementation: config.name,
    network: results.getblockchaininfo?.result?.chain ?? null,
    subversion: results.getnetworkinfo?.result?.subversion ?? null,
    protocolVersion: results.getnetworkinfo?.result?.protocolversion ?? null,
    genesisHash,
    bestBlockHash: results.getblockchaininfo?.result?.bestblockhash ?? null,
    blocks: results.getblockchaininfo?.result?.blocks ?? null,
    pruned: results.getblockchaininfo?.result?.pruned ?? null
  };
  return {
    generatedAt: new Date().toISOString(),
    config: { name: config.name, endpoint: config.endpoint.replace(/:\/\/.*@/, '://***@') },
    fingerprint: { ...fingerprintBody, digest: digestObject(fingerprintBody) },
    results
  };
}

export function compareProbes(probes) {
  const fields = ['network', 'genesisHash', 'protocolVersion', 'subversion', 'pruned'];
  return fields.map((field) => {
    const values = probes.map((probe) => ({ name: probe.config.name, value: probe.fingerprint[field] ?? null }));
    const unique = new Set(values.map((item) => JSON.stringify(item.value)));
    return { field, agreement: unique.size <= 1, values };
  });
}
