import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file if supported in Node 20.6+
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // .env not present or in container environment
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const DEFAULT_NANSEN_KEY = process.env.NANSEN_API_KEY || '';

app.use(express.json({ limit: '10mb' }));

// Enable CORS for Vite dev server and external agent tooling
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-nansen-key, apikey');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// In-memory agent bridge store
let latestState = null;
let latestStateReceivedAt = null;
const sseSubscribers = new Set();
const ackWaiters = new Map();

// Heartbeat comment every 15s to keep SSE connections alive
const heartbeatTimer = setInterval(() => {
  for (const client of sseSubscribers) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseSubscribers.delete(client);
    }
  }
}, 15000);
heartbeatTimer.unref();

// Serve static assets from dist
app.use(express.static(distPath));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', project: 'Aether Spatial DeFi Workspace with Nansen Intelligence' });
});

// --- Aether Agent Bridge Endpoints ---

// Browser pushes live workspace state snapshot
app.post('/api/agent/state', (req, res) => {
  const snapshot = req.body;
  if (!snapshot || typeof snapshot !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid state snapshot payload' });
  }
  const ts = typeof snapshot.ts === 'number' ? snapshot.ts : Date.now();
  latestState = {
    ...snapshot,
    ts,
  };
  latestStateReceivedAt = Date.now();
  res.status(200).json({ ok: true, ts });
});

// Agent reads latest workspace state snapshot + freshness
app.get('/api/agent/state', (req, res) => {
  if (!latestState) {
    return res.status(200).json({
      ok: false,
      staleMs: null,
      nodes: [],
      wires: [],
      totals: null,
      cctv: null,
      viewMode: null,
      error: 'no browser connected — open http://localhost:3000',
    });
  }
  const now = Date.now();
  const snapshotTs = latestState.ts || latestStateReceivedAt || now;
  const staleMs = Math.max(0, now - snapshotTs);
  res.status(200).json({
    ok: true,
    ...latestState,
    staleMs,
  });
});

// SSE stream: browser connects to receive commands
app.get('/api/agent/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseSubscribers.add(res);
  res.write(': connected\n\n');

  req.on('close', () => {
    sseSubscribers.delete(res);
  });
});

// Agent dispatches command to browser subscribers (supports ?wait=1)
app.post('/api/agent/command', async (req, res) => {
  const { type, payload } = req.body || {};
  if (!type) {
    return res.status(400).json({ ok: false, error: 'Command "type" is required' });
  }

  const id = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const message = `data: ${JSON.stringify({ id, type, payload: payload || {} })}\n\n`;

  let delivered = 0;
  for (const client of sseSubscribers) {
    try {
      client.write(message);
      delivered++;
    } catch {
      sseSubscribers.delete(client);
    }
  }

  const wait = req.query.wait === '1' || req.query.wait === 'true';

  if (!wait) {
    return res.status(200).json({ id, delivered });
  }

  if (delivered === 0) {
    return res.status(200).json({
      id,
      delivered: 0,
      ok: false,
      error: 'no browser connected — open http://localhost:3000',
    });
  }

  try {
    const ackResult = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        ackWaiters.delete(id);
        resolve({
          id,
          delivered,
          ok: false,
          timeout: true,
          error: 'Browser ack timed out after 5000ms',
        });
      }, 5000);

      ackWaiters.set(id, { resolve, timer });
    });

    return res.status(200).json(ackResult);
  } catch (err) {
    return res.status(500).json({ id, delivered, ok: false, error: err.message });
  }
});

// Browser sends ack for an executed command
app.post('/api/agent/ack', (req, res) => {
  const { id, ok, result } = req.body || {};
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Field "id" is required in ack payload' });
  }

  const waiter = ackWaiters.get(id);
  if (waiter) {
    clearTimeout(waiter.timer);
    ackWaiters.delete(id);
    waiter.resolve({
      id,
      ok: ok !== false,
      result: result !== undefined ? result : null,
      delivered: true,
    });
    return res.status(200).json({ acked: true, id });
  }

  return res.status(200).json({ acked: false, id, note: 'No pending waiter or timed out' });
});

// Nansen API Proxy Endpoint
app.all('/api/nansen/*', async (req, res) => {
  const subPath = req.params[0] || '';
  const targetUrl = `https://api.nansen.ai/api/v1/${subPath}`;
  const apiKey = req.headers['x-nansen-key'] || req.headers['apikey'] || DEFAULT_NANSEN_KEY;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    };

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && Object.keys(req.body || {}).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const nansenRes = await fetch(targetUrl, fetchOptions);

    // Forward SSE Stream if agent endpoint
    const contentType = nansenRes.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (nansenRes.body) {
        const reader = nansenRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        };
        await pump();
        return;
      }
    }

    const data = await nansenRes.text();
    res.status(nansenRes.status).send(data);
  } catch (err) {
    console.error('[Nansen Proxy Error]:', err);
    res.status(500).json({ error: 'Nansen API Proxy Error', message: err.message });
  }
});

// Fallback for SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Aether] Server running on http://0.0.0.0:${PORT}`);
});
