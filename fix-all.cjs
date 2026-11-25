'use strict';
const fs = require('fs');
const path = require('path');

const SRC = String.raw`C:\ClaudeCode\Falta 1\falta1-app\src`;
const ROOT = String.raw`C:\ClaudeCode\Falta 1\falta1-app`;

function readFile(relPath) {
  const p = relPath.startsWith('C:') ? relPath : path.join(SRC, relPath);
  return fs.readFileSync(p, 'utf8');
}
function writeFile(relPath, content) {
  const p = relPath.startsWith('C:') ? relPath : path.join(SRC, relPath);
  fs.writeFileSync(p, content, 'utf8');
  console.log('  Written: ' + p);
}
function rep(content, replacements, fileName) {
  let result = content;
  for (const [from, to] of replacements) {
    const before = result;
    if (from instanceof RegExp) { result = result.replace(from, to); }
    else { result = result.split(from).join(to); }
    if (result === before) console.warn('  WARN [' + fileName + ']: not found: ' + String(from).slice(0,70));
    else console.log('  OK [' + fileName + ']: ' + String(from).slice(0,60));
  }
  return result;
}

