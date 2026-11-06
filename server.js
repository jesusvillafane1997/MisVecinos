const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const DEFAULT_PORT = Number(process.env.PORT) || 3080;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ENV_FILE = path.join(__dirname, '.env');

// Load .env file if present (zero-dependency loader)
function loadDotEnv() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const lines = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('Warning reading .env:', err.message);
  }
}

loadDotEnv();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Supabase connection config endpoint
  if (pathname === '/api/supabase-config') {
    if (req.method === 'GET') {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
      return sendJson(res, 200, {
        supabaseUrl,
        supabaseAnonKey,
        configured: Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'))
      });
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const supabaseUrl = String(body.supabaseUrl || '').trim().replace(/\/+$/, '');
        const supabaseAnonKey = String(body.supabaseAnonKey || '').trim();
        process.env.SUPABASE_URL = supabaseUrl;
        process.env.SUPABASE_ANON_KEY = supabaseAnonKey;
        return sendJson(res, 200, {
          ok: true,
          supabaseUrl,
          supabaseAnonKey,
          configured: Boolean(supabaseUrl && supabaseAnonKey)
        });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
  }

  // Serve static files from public/
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexHtml = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexHtml).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

function startServer(port) {
  server.once('error', err => {
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
  server.listen(port, () => {
    console.log(`Mis Vecinos (Córdoba) server running at http://localhost:${port}`);
  });
}

startServer(DEFAULT_PORT);
