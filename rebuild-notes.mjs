import fs from 'fs';
import path from 'path';

const vaultDir = './';
const files = fs.readdirSync(vaultDir);

let count = 0;

for (const file of files) {
  if (file.endsWith('.md') && file.toLowerCase() !== 'index.md') {
    const fullPath = path.join(vaultDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Extract existing values safely using regex
    const artistMatch = content.match(/artist:\s*"?([^"\r\n]+)"?/);
    const albumMatch = content.match(/album:\s*"?([^"\r\n]+)"?/);
    const yearMatch = content.match(/release-year:\s*"?([^"\r\n]+)"?/);
    const dateMatch = content.match(/listen-date:\s*"?([^"\r\n]+)"?/);
    const ratingMatch = content.match(/rating:\s*"?([^"\r\n]+)"?/);
    const coverMatch = content.match(/cover:\s*"?([^"\r\n]+)"?/);

    // Find where the markdown title header starts (# Title)
    const titleIndex = content.indexOf('# ');
    
    if (titleIndex !== -1 && artistMatch && albumMatch) {
      const bodyPart = content.substring(titleIndex);

      // Reconstruct the file with a pristine YAML frontmatter block matching your template
      const newFileContent = `---
artist: "${artistMatch[1].trim()}"
album: "${albumMatch[1].trim()}"
release-year: "${yearMatch ? yearMatch[1].trim() : ''}"
listen-date: "${dateMatch ? dateMatch[1].trim() : ''}"
rating: ${ratingMatch ? ratingMatch[1].trim() : '0'}
cover: "${coverMatch ? coverMatch[1].trim() : ''}"
publish: false
---

${bodyPart.trim()}
`;

      fs.writeFileSync(fullPath, newFileContent, 'utf8');
      count++;
    }
  }
}

console.log(`Successfully reconstructed ${count} files with pristine formatting!`);