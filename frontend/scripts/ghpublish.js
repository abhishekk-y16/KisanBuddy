#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const outDir = path.join(repoRoot, 'out');
const publishDir = path.join(repoRoot, 'out-publish');
const targetSubdir = path.join(publishDir, 'KisanBuddy');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean publishDir
if (fs.existsSync(publishDir)) {
  fs.rmSync(publishDir, { recursive: true, force: true });
}

// Copy out -> out-publish/KisanBuddy
if (!fs.existsSync(outDir)) {
  console.error('out directory not found. Run `npm run build` first.');
  process.exit(1);
}
fs.mkdirSync(targetSubdir, { recursive: true });
copyRecursive(outDir, targetSubdir);

// create .nojekyll so GitHub Pages serves files starting with _
fs.writeFileSync(path.join(publishDir, '.nojekyll'), '');

// Run gh-pages to publish out-publish folder using local binary (cross-platform)
const ghPagesBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'gh-pages.cmd' : 'gh-pages');
if (!fs.existsSync(ghPagesBin)) {
  console.error('gh-pages binary not found at', ghPagesBin);
  console.error('Install gh-pages locally with `npm install --save-dev gh-pages`');
  process.exit(1);
}
// Publish the parent `out-publish` directory so the `KisanBuddy/` folder
// is present at the branch root (site will live at /KisanBuddy/)
const gh = spawnSync(ghPagesBin, ['-d', publishDir, '-b', 'gh-pages'], { stdio: 'inherit', shell: true });
if (gh.error) {
  console.error('Failed to run gh-pages:', gh.error);
  process.exit(1);
}
process.exit(gh.status);
