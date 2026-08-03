import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [html, css, js, data] = await Promise.all([
  fs.readFile(path.join(root, 'web/index.html'), 'utf8'),
  fs.readFile(path.join(root, 'web/styles.css'), 'utf8'),
  fs.readFile(path.join(root, 'web/app.js'), 'utf8'),
  fs.readFile(path.join(root, 'web/data/reports.json'), 'utf8')
]);

const safeData = data.replaceAll('</script', '<\\/script');
const safeJs = js.replaceAll('</script', '<\\/script');
const output = html
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="./app.js"></script>', () => `<script>window.__ORIGIN_REPORTS__=${safeData.trim()};</script>\n<script>\n${safeJs}\n</script>`);

await fs.writeFile(path.join(root, 'origin-single.html'), output);
console.log(`Exported origin-single.html (${Buffer.byteLength(output).toLocaleString()} bytes).`);
