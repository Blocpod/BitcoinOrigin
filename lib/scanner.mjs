import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_EXTENSIONS = new Set(['.c', '.cc', '.cpp', '.h', '.hpp', '.go', '.rs', '.py', '.js', '.mjs', '.ts', '.java', '.kt', '.md', '.txt', '.json', '.toml', '.yaml', '.yml']);
const DEFAULT_IGNORES = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', 'target', 'depends']);

async function walk(root, options, files = []) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (DEFAULT_IGNORES.has(entry.name) || options.ignores?.includes(entry.name)) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) await walk(full, options, files);
    else if (entry.isFile() && (options.extensions ?? DEFAULT_EXTENSIONS).has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

export async function scanSource(root, policy, options = {}) {
  const absoluteRoot = path.resolve(root);
  const files = await walk(absoluteRoot, options);
  const findings = [];
  let scannedBytes = 0;
  for (const file of files) {
    const stat = await fs.stat(file);
    if (stat.size > (options.maxFileBytes ?? 2_000_000)) continue;
    const text = await fs.readFile(file, 'utf8');
    scannedBytes += Buffer.byteLength(text);
    const lines = text.split(/\r?\n/);
    for (const rule of policy.rules) {
      const regex = new RegExp(rule.pattern, rule.flags ?? 'i');
      lines.forEach((line, index) => {
        regex.lastIndex = 0;
        if (!regex.test(line)) return;
        findings.push({
          ruleId: rule.id,
          title: rule.title,
          severity: rule.severity,
          interpretation: rule.interpretation,
          file: path.relative(absoluteRoot, file),
          line: index + 1,
          excerpt: line.trim().slice(0, 280)
        });
      });
    }
  }
  return {
    root: absoluteRoot,
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    scannedBytes,
    findings,
    disclaimer: 'Lexical matches are review signals, not conclusions. Every finding requires contextual human and technical review.'
  };
}
