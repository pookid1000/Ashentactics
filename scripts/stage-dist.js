// Copies just the game's web assets into dist/ for Tauri packaging, leaving
// the project root (where index.html is edited/tested directly via file://)
// untouched. Re-run before every `tauri build`/`tauri dev` — wired in as
// tauri.conf.json's beforeBuildCommand/beforeDevCommand.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const ITEMS = ['index.html', 'css', 'js', 'assets'];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const item of ITEMS) {
  fs.cpSync(path.join(root, item), path.join(dist, item), { recursive: true });
}

console.log('Staged web assets into dist/ for Tauri:', ITEMS.join(', '));
