import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const DIST_DIR = path.join(process.cwd(), 'dist');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ROOT_AUDIO_DIR = path.join(process.cwd(), 'audio');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // Proxy /api/ requests to local backend FastAPI server (port 8000)
  if (req.url && req.url.startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: 'localhost:8000',
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': 'http',
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ detail: 'Serveur API backend FastAPI non démarré sur port 8000.' }));
    });

    req.pipe(proxyReq);
    return;
  }

  // Reject unsafe HTTP methods for static files
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Malformed URL');
    return;
  }

  // Neutralize null bytes and control characters
  if (pathname.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  // Explicitly block dotfiles (.env, .git) and traversal segments (..)
  const segments = pathname.split(/[/\\]+/).filter(Boolean);
  if (segments.some(s => s === '..' || (s.startsWith('.') && s !== '.well-known'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  // Prevent path traversal outside allowed directories
  const normalizedPath = path.posix.normalize(pathname.replace(/\\/g, '/'));
  const resolvedDistPath = path.resolve(DIST_DIR, '.' + normalizedPath);
  const resolvedPublicPath = path.resolve(PUBLIC_DIR, '.' + normalizedPath);
  
  let resolvedRootAudioPath = null;
  if (normalizedPath.startsWith('/audio/')) {
    resolvedRootAudioPath = path.resolve(ROOT_AUDIO_DIR, '.' + normalizedPath.replace(/^\/audio/, ''));
  }

  let filePath = null;

  // 1. Check in dist/
  if (fs.existsSync(resolvedDistPath) && !fs.statSync(resolvedDistPath).isDirectory()) {
    filePath = resolvedDistPath;
  } 
  // 2. Check in public/
  else if (fs.existsSync(resolvedPublicPath) && !fs.statSync(resolvedPublicPath).isDirectory()) {
    filePath = resolvedPublicPath;
  }
  // 3. Check in audio/ (for words/, stories/, koko/)
  else if (resolvedRootAudioPath && fs.existsSync(resolvedRootAudioPath) && !fs.statSync(resolvedRootAudioPath).isDirectory()) {
    filePath = resolvedRootAudioPath;
  }
  // 4. Asset fallback / SPA fallback
  else {
    if (pathname.startsWith('/audio/') || pathname.startsWith('/assets/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Asset Not Found');
      return;
    }
    // SPA Fallback to dist/index.html
    filePath = path.resolve(DIST_DIR, 'index.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Application Build Not Found. Please run `npm run build` first.');
      return;
    }
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const isCodeOrHtml = ext === '.html' || ext === '.js' || ext === '.json';
  const headers = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': isCodeOrHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=(self)',
  };

  if (pathname === '/sw.js') {
    headers['Service-Worker-Allowed'] = '/';
    headers['Cache-Control'] = 'no-cache';
  }

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Requested Range Not Satisfiable');
      return;
    }

    const chunksize = (end - start) + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const rangeHeaders = {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunksize,
    };
    res.writeHead(206, rangeHeaders);
    if (req.method === 'HEAD') {
      res.end();
    } else {
      stream.pipe(res);
    }
  } else {
    headers['Content-Length'] = fileSize;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
    } else {
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Mwana Lari Server running at http://localhost:${PORT}/`);
});
