import fs from 'fs';

// Find the file (adjust the name if your exact filename is different, e.g., "Daily Album Listens.md" or "Music Log.md")
// Let's check files in the root to find the right one containing dataviewjs
const files = fs.readdirSync('./');
const targetFile = files.find(f => f.toLowerCase().includes('listen') || f.toLowerCase().includes('music') && f.endsWith('.md'));

if (targetFile) {
  let content = fs.readFileSync(targetFile, 'utf8');
  console.log(`Found target file: ${targetFile}`);

  // Strip out the exact rogue literal artifact at the very top
  content = content.replace(/^---\\npublish: false\\---\\n\\n/, '');
  
  // Also clean up any variation if it starts with standard broken frontmatter
  if (content.startsWith('---\npublish: false\n---\n\n---')) {
    content = content.replace(/^---\npublish: false\n---\n\n---/, '---');
  }

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Music log file cleaned successfully!');
} else {
  console.log('Could not automatically locate the log file. Please check the filename.');
}