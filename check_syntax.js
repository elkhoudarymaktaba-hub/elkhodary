const fs = require('fs');

const content = fs.readFileSync('app/admin/boxes/page.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '(') parenCount++;
    else if (char === ')') parenCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;

    if (braceCount < 0) {
      console.log(`Unmatched closing brace } on line ${i + 1}:${j + 1}`);
      braceCount = 0;
    }
    if (parenCount < 0) {
      console.log(`Unmatched closing paren ) on line ${i + 1}:${j + 1}`);
      parenCount = 0;
    }
    if (bracketCount < 0) {
      console.log(`Unmatched closing bracket ] on line ${i + 1}:${j + 1}`);
      bracketCount = 0;
    }
  }
}

console.log(`Final counts: braces=${braceCount}, parens=${parenCount}, brackets=${bracketCount}`);
