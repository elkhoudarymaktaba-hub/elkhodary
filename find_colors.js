const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'app', 'admin'),
  path.join(__dirname, 'components', 'admin')
];

const colorsToSearch = [
  '1B4F8A',
  '2E7FD9',
  '4FA8E8',
  'F0F6FF',
  '93C5FD'
];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      colorsToSearch.forEach(color => {
        if (content.toLowerCase().includes(color.toLowerCase())) {
          console.log(`Found ${color} in ${path.relative(__dirname, fullPath)}`);
        }
      });
    }
  }
}

targetDirs.forEach(scanDir);
