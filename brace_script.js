const fs = require('fs');
const code = fs.readFileSync('c:/Users/User/Downloads/imcan-inventory-hub-complete/imcan-inventory-hub/server/ai.ts', 'utf8');
let d = 0;
const lines = code.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (const c of l) {
    if (c === '{') d++;
    if (c === '}') d--;
  }
  if (i > 70 && i < 330) {
    out.push(`${i+1}: [${d}] ${l}`);
  }
}
fs.writeFileSync('c:/Users/User/Downloads/imcan-inventory-hub-complete/imcan-inventory-hub/braces.txt', out.join('\n'));
