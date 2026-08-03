import http from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGenesisProof } from '../lib/bitcoin.mjs';
import { verifyReport } from '../lib/report.mjs';
import { verifyProvenanceClaim } from '../lib/provenance.mjs';
import { verifyLog } from '../lib/log.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(root, 'web');
const port = Number(process.env.PORT ?? 8787);
const host = process.env.ORIGIN_HOST ?? '127.0.0.1';
const maxBody = 1_000_000;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function headers(extra = {}) {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    ...extra
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, headers({ 'content-type': 'application/json; charset=utf-8' }));
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBody) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function api(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'origin', version: '0.1.0' });
  }
  if (req.method === 'GET' && pathname === '/api/reports') {
    const data = JSON.parse(await fs.readFile(path.join(webRoot, 'data/reports.json'), 'utf8'));
    return sendJson(res, 200, data);
  }
  if (req.method === 'GET' && pathname === '/api/genesis') return sendJson(res, 200, runGenesisProof());
  if (req.method === 'GET' && pathname === '/api/log') {
    const entries = JSON.parse(await fs.readFile(path.join(root, 'data/log/origin-log.json'), 'utf8'));
    return sendJson(res, 200, { entries, verification: verifyLog(entries) });
  }
  if (req.method === 'POST' && pathname === '/api/verify-report') {
    return sendJson(res, 200, verifyReport(await readBody(req)));
  }
  if (req.method === 'POST' && pathname === '/api/verify-claim') {
    return sendJson(res, 200, verifyProvenanceClaim(await readBody(req)));
  }
  return false;
}

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const candidate = path.resolve(webRoot, `.${decoded}`);
  return candidate.startsWith(webRoot) ? candidate : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await api(req, res, url.pathname);
      if (handled !== false) return;
      return sendJson(res, 404, { error: 'Not found' });
    }
    const file = safePath(url.pathname);
    if (!file) return sendJson(res, 403, { error: 'Forbidden' });
    let stat;
    try {
      stat = await fs.stat(file);
    } catch {
      return sendJson(res, 404, { error: 'Not found' });
    }
    if (!stat.isFile()) return sendJson(res, 404, { error: 'Not found' });
    const type = mime[path.extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, headers({ 'content-type': type, 'cache-control': type.includes('html') ? 'no-cache' : 'public, max-age=3600' }));
    createReadStream(file).pipe(res);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`ORIGIN running at http://${host}:${port}`);
});
