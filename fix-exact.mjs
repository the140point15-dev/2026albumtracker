import fs from 'fs';
import path from 'path';

const vaultDir = './';
const files = fs.readdirSync(vaultDir);

let count = 0;

for (const file of files) {
  if (file.endsWith('.md') && file.toLowerCase() !== 'index.md') {
    const fullPath = path.join(vaultDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // The exact broken string prefix present in your files
    const brokenPrefix = "---\\npublish: false\\---\\n\\n---";

    if (content.includes(brokenPrefix)) {
      // Replace the broken prefix with just the single opening ---
      content = content.replace(brokenPrefix, '---');

      // Now ensure `publish: false` is cleanly inside the frontmatter block
      // We'll insert it right after the opening ---
      content = content.replace('---\n', '---\npublish: false\n');

      fs.writeFileSync(fullPath, content, 'utf8');
      count++;
    }
  }
}

console.log(`Successfully fixed ${count} files!`);