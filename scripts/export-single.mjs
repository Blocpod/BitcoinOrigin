import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'web', 'index.html');
const target = path.join(root, 'origin-single.html');

const html = await fs.readFile(source, 'utf8');

if (!html.includes('<!doctype html>') || !html.includes('id="observatory"')) {
  throw new Error('web/index.html is not a valid ORIGIN standalone document.');
}

await fs.writeFile(target, html);
console.log(`Exported origin-single.html (${Buffer.byteLength(html).toLocaleString()} bytes).`);
