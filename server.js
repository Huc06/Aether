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

app.use(express.json());

// Serve static assets from dist
app.use(express.static(distPath));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', project: 'Aether Spatial DeFi Workspace with Nansen Intelligence' });
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
