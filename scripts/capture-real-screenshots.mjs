import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs', 'screenshots');
const brandDir = path.join(rootDir, 'docs', 'brand');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const targets = [
  {
    name: '01-star-focus-cluster.png',
    url: 'http://localhost:4173/?cluster=pos-drift-perp',
    size: '1600,900',
    dest: path.join(screenshotsDir, '01-star-focus-cluster.png')
  },
  {
    name: '02-nansen-thesis-interrogator.png',
    url: 'http://localhost:4173/?intent=1',
    size: '1600,900',
    dest: path.join(screenshotsDir, '02-nansen-thesis-interrogator.png')
  },
  {
    name: '03-nansen-entity-profiler.png',
    url: 'http://localhost:4173/?nansen=1',
    size: '1600,900',
    dest: path.join(screenshotsDir, '03-nansen-entity-profiler.png')
  },
  {
    name: '04-position-cockpit-inspector.png',
    url: 'http://localhost:4173/?node=pos-drift-perp',
    size: '1600,900',
    dest: path.join(screenshotsDir, '04-position-cockpit-inspector.png')
  },
  {
    name: '05-cctv-surveillance-matrix.png',
    url: 'http://localhost:4173/?view=exposure-grid',
    size: '1600,900',
    dest: path.join(screenshotsDir, '05-cctv-surveillance-matrix.png')
  },
  {
    name: '06-dashed-frame-ledger.png',
    url: 'http://localhost:4173/?view=list',
    size: '1600,900',
    dest: path.join(screenshotsDir, '06-dashed-frame-ledger.png')
  },
  {
    name: '07-clean-slate-light-mode.png',
    url: 'http://localhost:4173/?theme=light',
    size: '1600,900',
    dest: path.join(screenshotsDir, '07-clean-slate-light-mode.png')
  },
  {
    name: 'aether-banner.png',
    url: 'http://localhost:4173/?cluster=pos-drift-perp',
    size: '1600,680',
    dest: path.join(brandDir, 'aether-banner.png')
  }
];

// Start Vite preview
console.log('Starting Vite preview on port 4173...');
const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
  cwd: rootDir,
  stdio: 'ignore'
});

await new Promise(r => setTimeout(r, 2000));

try {
  for (const t of targets) {
    console.log(`Capturing ${t.name}...`);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-snap-'));
    if (fs.existsSync(t.dest)) fs.unlinkSync(t.dest);

    const chrome = spawn(chromePath, [
      '--headless',
      `--user-data-dir=${tempDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      `--window-size=${t.size}`,
      `--screenshot=${t.dest}`,
      t.url
    ], { stdio: 'ignore' });

    // Poll until file is written and stable
    let captured = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 250));
      if (fs.existsSync(t.dest) && fs.statSync(t.dest).size > 10000) {
        captured = true;
        break;
      }
    }

    try { chrome.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

    if (captured) {
      console.log(`✓ Generated ${t.name} (${Math.round(fs.statSync(t.dest).size / 1024)} KB)`);
    } else {
      console.error(`✗ Timeout capturing ${t.name}`);
    }
  }
} finally {
  preview.kill('SIGKILL');
  console.log('All captures complete!');
}
