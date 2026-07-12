const fs = require('fs');

const content = fs.readFileSync('app/admin/pages/page.tsx', 'utf8');

console.log('File read success. Length:', content.length);

let stack = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      stack.push({ char, lineNum, col: j + 1 });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`[Error] Unmatched } at line ${lineNum}, col ${j + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

console.log('Braces balance check completed. Stack size at end:', stack.length);
if (stack.length > 0) {
  console.log('Unclosed braces starting lines:');
  stack.slice(-10).forEach(item => {
    console.log(`  Line ${item.lineNum}: ${lines[item.lineNum - 1].trim()}`);
  });
}
