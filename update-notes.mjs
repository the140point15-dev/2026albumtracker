import fs from 'fs';
import path from 'path';

const vaultDir = './';
const files = fs.readdirSync(vaultDir);

for (const file of files) {
  if (file.endsWith('.md') && file.toLowerCase() !== 'index.md') {
    const fullPath = path.join(vaultDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Fix broken literal '\n' frontmatter if it exists from the previous run
    content = content.replace(/---\\npublish: false\\---/g, '---\npublish: false\n---');

    // 2. If it has normal frontmatter without publish, insert it cleanly with real newlines
    if (content.startsWith('---') && !content.includes('publish:')) {
      content = content.replace('---', '---\npublish: false');
    } else if (!content.startsWith('---')) {
      // If no frontmatter at all, add proper one
      content = `---\npublish: false\n---\n\n` + content;
    }

    // 3. Ensure ## Review section exists cleanly
    if (!content.includes('## Review')) {
      content = content.trimEnd() + '\n\n## Review\n\n';
    }

    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

console.log('All notes have been cleaned and fixed!');