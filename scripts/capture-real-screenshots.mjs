import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs', 'screenshots');
const brandDir = path.join(rootDir, 'docs', 'brand');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 1. Start preview server
console.log('Starting Vite preview server on port 4173...');
const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
  cwd: rootDir,
  stdio: 'ignore'
});

await new Promise(r => setTimeout(r, 1500));

// 2. Start Chrome with remote debugging
console.log('Starting Headless Chrome with WebGL...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--use-gl=angle',
  '--ignore-gpu-blocklist',
  '--window-size=1600,900',
  '--hide-scrollbars',
  'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 1200));

async function createCdpClient() {
  const targetRes = await fetch('http://localhost:9222/json/new', { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  return { send, close: () => ws.close(), targetId: target.id };
}

const targets = [
  {
    name: '01-spatial-canvas-overview.png',
    url: 'http://localhost:4173/?view=canvas',
    width: 1600,
    height: 900,
    delayMs: 2500,
    dest: path.join(screenshotsDir, '01-spatial-canvas-overview.png')
  },
  {
    name: '02-nymspace-bend-ledger.png',
    url: 'http://localhost:4173/?view=list',
    width: 1600,
    height: 900,
    delayMs: 2500,
    dest: path.join(screenshotsDir, '02-nymspace-bend-ledger.png')
  },
  {
    name: '03-cctv-exposure-grid.png',
    url: 'http://localhost:4173/?view=exposure-grid',
    width: 1600,
    height: 900,
    delayMs: 3000,
    dest: path.join(screenshotsDir, '03-cctv-exposure-grid.png')
  },
  {
    name: '04-nansen-profiler-graph.png',
    url: 'http://localhost:4173/?nansen=1',
    width: 1600,
    height: 900,
    delayMs: 2500,
    dest: path.join(screenshotsDir, '04-nansen-profiler-graph.png')
  },
  {
    name: '05-intent-agent-stream.png',
    url: 'http://localhost:4173/?intent=1',
    width: 1600,
    height: 900,
    delayMs: 2500,
    dest: path.join(screenshotsDir, '05-intent-agent-stream.png')
  },
  {
    name: '06-clean-slate-light-mode.png',
    url: 'http://localhost:4173/?theme=light',
    width: 1600,
    height: 900,
    delayMs: 2500,
    dest: path.join(screenshotsDir, '06-clean-slate-light-mode.png')
  },
  {
    name: 'aether-banner.png',
    url: 'http://localhost:4173/?view=canvas',
    width: 1600,
    height: 680,
    delayMs: 2500,
    dest: path.join(brandDir, 'aether-banner.png')
  }
];

try {
  const cdp = await createCdpClient();
  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');

  for (const t of targets) {
    console.log(`Navigating to ${t.name}...`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: t.width,
      height: t.height,
      deviceScaleFactor: 2, // Retina 2x resolution!
      mobile: false
    });

    await cdp.send('Page.navigate', { url: t.url });
    // Wait for settle
    await new Promise(r => setTimeout(r, t.delayMs));

    console.log(`Capturing ${t.name}...`);
    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync(t.dest, buffer);
    console.log(`✓ Saved ${t.name} (${Math.round(buffer.length / 1024)} KB)`);
  }

  cdp.close();
} catch (err) {
  console.error('Error during capture:', err);
} finally {
  chrome.kill();
  preview.kill();
  console.log('Completed all real screenshots!');
}
