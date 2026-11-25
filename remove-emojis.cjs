const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Unicode emoji ranges with 'u' flag
const EMOJI_REGEX = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}]/gu;

// Empty JSX element patterns to remove entirely
const EMPTY_ELEMENT_PATTERNS = [
  // <span className="text-5xl mb-3"></span>
  /<span\s+className="text-5xl\s+mb-3"\s*><\/span>/g,
  // <div className="text-7xl mb-4"></div>
  /<div\s+className="text-7xl\s+mb-4"\s*><\/div>/g,
  // <div className="text-4xl text-center mb-4"></div>
  /<div\s+className="text-4xl\s+text-center\s+mb-4"\s*><\/div>/g,
  // <span className="text-6xl mb-4"></span>
  /<span\s+className="text-6xl\s+mb-4"\s*><\/span>/g,
  // <div className="text-7xl mb-6"></div>
  /<div\s+className="text-7xl\s+mb-6"\s*><\/div>/g,
];

// Collect all .jsx files recursively
function findJsxFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findJsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let modified = original;

  // Step 1: Remove empty JSX elements first (they contain emojis as their only content)
  for (const pattern of EMPTY_ELEMENT_PATTERNS) {
    modified = modified.replace(pattern, '');
  }

  // Step 2: Remove emoji characters
  modified = modified.replace(EMOJI_REGEX, '');

  // Step 3: Fix template literal leading/trailing whitespace left after emoji removal.
  // Targets backtick strings where the emoji was at the very start, leaving a leading space.
  // Pattern: inside a template literal expression, a space immediately after the backtick or ${...}
  // More targeted: fix ` <non-space> → `<non-space> only inside JSX string contexts.
  // We handle the common case: a backtick followed by one or more spaces then a non-space char.
  modified = modified.replace(/(`)\s+([¡¿A-Za-záéíóúüñÁÉÍÓÚÜÑ])/g, '$1$2');

  // Step 4: Clean up lines that are now entirely whitespace (resulted from removed elements)
  // Replace lines that are only spaces/tabs with empty lines, then collapse 3+ blank lines to 2
  modified = modified.replace(/^[ \t]+$/gm, '');
  modified = modified.replace(/\n{3,}/g, '\n\n');

  if (modified !== original) {
    fs.writeFileSync(filePath, modified, 'utf8');
    return { changed: true, original, modified };
  }
  return { changed: false };
}

// --- Main ---
const files = findJsxFiles(SRC_DIR);
const changedFiles = [];
const changes = [];

for (const filePath of files) {
  const result = processFile(filePath);
  if (result.changed) {
    changedFiles.push(filePath);

    // Collect a diff-like summary: find first 3 changed lines
    const origLines = result.original.split('\n');
    const modLines = result.modified.split('\n');
    const fileChanges = [];
    let diffCount = 0;
    const maxLines = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < maxLines && diffCount < 3; i++) {
      const o = origLines[i] !== undefined ? origLines[i] : '(line removed)';
      const m = modLines[i] !== undefined ? modLines[i] : '(line removed)';
      if (o !== m) {
        fileChanges.push({ line: i + 1, before: o.trim(), after: m !== undefined ? m.trim() : '(removed)' });
        diffCount++;
      }
    }
    changes.push({ file: path.relative(SRC_DIR, filePath), changes: fileChanges });
  }
}

// --- Report ---
console.log('='.repeat(60));
console.log(`Emoji Removal Complete`);
console.log('='.repeat(60));
console.log(`Total .jsx files scanned : ${files.length}`);
console.log(`Files modified           : ${changedFiles.length}`);
console.log('');

if (changes.length === 0) {
  console.log('No changes were needed.');
} else {
  console.log('First changes per modified file (up to 3 changed lines each):');
  console.log('-'.repeat(60));
  for (const entry of changes) {
    console.log(`\nFile: ${entry.file}`);
    for (const c of entry.changes) {
      console.log(`  Line ${c.line}:`);
      console.log(`    BEFORE: ${c.before.substring(0, 120)}`);
      console.log(`    AFTER : ${c.after.substring(0, 120)}`);
    }
  }
}
console.log('\n' + '='.repeat(60));
