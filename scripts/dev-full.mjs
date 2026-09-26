#!/usr/bin/env node

/**
 * Concurrent launcher for Aether full-stack development environment:
 * - Express Server (Port 3000): Agent bridge & Nansen API proxy
 * - Vite Dev Server (Port 5199): React frontend with proxy to port 3000
 * 
 * Runs without external npm dependencies (concurrently/npm-run-all).
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[dev:full] Launching Aether full-stack development environment...');
console.log('[dev:full] -> Express Backend : http://localhost:3000');
console.log('[dev:full] -> Vite Dev Server : http://localhost:5199');

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const expressProc = spawn('node', ['server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3000' },
});

const viteProc = spawn(npxCmd, ['vite', '--port', '5199'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n[dev:full] Shutting down child processes...');

  try {
    expressProc.kill('SIGTERM');
  } catch {}

  try {
    viteProc.kill('SIGTERM');
  } catch {}

  setTimeout(() => {
    try {
      expressProc.kill('SIGKILL');
    } catch {}
    try {
      viteProc.kill('SIGKILL');
    } catch {}
    process.exit(exitCode);
  }, 1000).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

expressProc.on('exit', (code) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(`[dev:full] Express server exited with code ${code}`);
    shutdown(code);
  }
});

viteProc.on('exit', (code) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(`[dev:full] Vite dev server exited with code ${code}`);
    shutdown(code);
  }
});
