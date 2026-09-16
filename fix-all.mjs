import fs from 'fs';
import path from 'path';

const vaultDir = './';
const files = fs.readdirSync(vaultDir);

let fixedCount = 0;

for (const file of files) {
  if (file.endsWith('.md') && file.toLowerCase() !== 'index.md') {
    const fullPath = path.join(vaultDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // 1. Remove the broken literal string text injections completely
    if (content.includes('---\\npublish: false\\---') || content.includes('---npublish: false---')) {
      content = content.replace(/---\\npublish: false\\---/g, '');
      content = content.replace(/---npublish: false---/g, '');
      changed = true;
    }

    // 2. Clean up any literal '\n## Review\n\n' or stray double frontmatter blocks at the start
    if (content.includes('\\n\\n## Review\\n\\n')) {
      content = content.replace(/\\n\\n## Review\\n\\n/g, '');
      changed = true;
    }

    // 3. If there's a double frontmatter mess at the top, clean it back to a single clean YAML block
    // (This restores your original properties block)
    if (content.startsWith('---\npublish: false\n---\n\n---')) {
      content = content.replace(/^---\npublish: false\n---\n\n---/, '---');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      fixedCount++;
    }
  }
}

console.log(`Successfully repaired ${fixedCount} files!`);