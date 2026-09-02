const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
for (const file of ['app.js','friends.js']) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  if (/localStorage\./.test(text) || /BigYearStorage\./.test(text)) {
    throw new Error(`${file}: direct persistence access detected`);
  }
}
for (const file of ['repository.js','storage.js','state.js','friends.js','app.js']) {
  if (!fs.existsSync(path.join(root,file))) throw new Error(`Missing ${file}`);
}
console.log('Architecture boundary tests: OK');
