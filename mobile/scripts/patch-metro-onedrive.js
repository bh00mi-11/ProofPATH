const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/@expo/metro-file-map/build/crawlers/node/index.js');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes("process.platform === 'win32'")) {
    content = content.replace(
      'const isSymbolicLink = entry.isSymbolicLink();',
      `let isSymbolicLink = entry.isSymbolicLink();
                    if (isSymbolicLink && process.platform === 'win32') {
                        try {
                            isSymbolicLink = _fs().lstatSync(file).isSymbolicLink();
                        } catch {
                            // ignore
                        }
                    }`
    );
    fs.writeFileSync(targetFile, content);
    console.log('Patched @expo/metro-file-map for Windows OneDrive ReparsePoints.');
  }
}
