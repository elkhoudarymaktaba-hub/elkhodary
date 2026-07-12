const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'temp_boxes.txt');
const destPath = path.join(__dirname, 'app/boxes/page.tsx');

if (fs.existsSync(srcPath)) {
  const content = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(destPath, content, 'utf8');
  console.log('--- SUCCESS: File app/boxes/page.tsx has been successfully fixed in UTF-8 ---');
} else {
  console.error('Source file temp_boxes.txt not found!');
}
