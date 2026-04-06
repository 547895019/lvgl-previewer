const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

const PORT = process.argv[2] || 8080;
const ROOT = __dirname;
const CLI_PATH = path.join(ROOT, 'cli', 'lved-cli.js');

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json',
};

// Security headers for SharedArrayBuffer
const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// Validate and sanitize project path
function validateProjectPath(projectPath) {
  if (!projectPath) return null;
  // Resolve to absolute path
  const resolved = path.resolve(projectPath);
  // Ensure the path exists and is a directory
  try {
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) return null;
    return resolved;
  } catch(e) {
    return null;
  }
}

// Scan screens
function scanScreens(projectRoot) {
  const screensDir = path.join(projectRoot, 'screens');
  const result = [];
  try {
    for (const f of fs.readdirSync(screensDir)) {
      if (f.endsWith('.xml')) {
        result.push(f.replace('.xml', ''));
      }
    }
  } catch(e) {}
  return result.sort();
}

// Scan components recursively
function scanComponents(projectRoot) {
  const compsDir = path.join(projectRoot, 'components');
  const result = [];

  function scan(dir, relBase) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scan(path.join(dir, entry.name), rel);
        } else if (entry.name.endsWith('.xml')) {
          result.push({
            name: entry.name.replace('.xml', ''),
            path: `components/${rel}`,
          });
        }
      }
    } catch(e) {}
  }

  scan(compsDir, '');
  return result;
}

// Scan assets recursively
function scanAssets(projectRoot) {
  const result = [];

  function scan(dir, relBase) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scan(path.join(dir, entry.name), rel);
        } else if (/\.(ttf|otf|bin|png|jpg|jpeg|gif|bmp|webp)$/i.test(entry.name)) {
          result.push({ path: rel });
        }
      }
    } catch(e) {}
  }

  for (const dir of ['fonts', 'images']) {
    scan(path.join(projectRoot, dir), dir);
  }

  return result;
}

// Serve static file
function serveFileWithNoCache(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + filePath);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...SECURITY_HEADERS,
    });
    res.end(data);
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + filePath);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      ...SECURITY_HEADERS,
    });
    res.end(data);
  });
}

// Serve project file
function serveProjectFile(req, res, projectRoot, relPath) {
  const filePath = path.join(projectRoot, relPath);

  // Security: ensure the file is within the project root
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(projectRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // For HEAD requests, just check if file exists
  if (req.method === 'HEAD') {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end();
      }
    });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + relPath);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      ...SECURITY_HEADERS,
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Get project path from query
  const projectRoot = validateProjectPath(query.project);

  // API endpoints
  if (pathname === '/api/screens') {
    if (!projectRoot) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid project path' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
    res.end(JSON.stringify(scanScreens(projectRoot)));
    return;
  }

  if (pathname === '/api/components') {
    if (!projectRoot) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid project path' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
    res.end(JSON.stringify(scanComponents(projectRoot)));
    return;
  }

  if (pathname === '/api/assets') {
    if (!projectRoot) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid project path' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
    res.end(JSON.stringify(scanAssets(projectRoot)));
    return;
  }

  if (pathname === '/api/file-exists') {
    if (!projectRoot || !query.path) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
      res.end('{"exists":false}');
      return;
    }
    const filePath = path.join(projectRoot, path.normalize(query.path));
    const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
    res.end(JSON.stringify({ exists }));
    return;
  }

  if (pathname === '/api/file') {
    if (!projectRoot || !query.path) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing project or path');
      return;
    }
    serveProjectFile(req, res, projectRoot, query.path);
    return;
  }

  // Serve node_modules for CodeMirror
  if (pathname.startsWith('/node_modules/')) {
    const rel = pathname.slice('/node_modules/'.length);
    const filePath = path.join(ROOT, 'node_modules', rel);
    serveFile(res, filePath);
    return;
  }

  // Static files from previewer root
  if (pathname === '/') {
    serveFile(res, path.join(ROOT, 'index.html'));
    return;
  }

  if (pathname === '/viewer.html') {
    serveFile(res, path.join(ROOT, 'viewer.html'));
    return;
  }

  if (pathname === '/preview.html') {
    serveFile(res, path.join(ROOT, 'preview.html'));
    return;
  }

  // preview-bin files (WASM runtime)
  if (pathname.startsWith('/preview-bin/')) {
    const rel = pathname.slice('/preview-bin/'.length);
    // Try to find in project first, then fallback to examples project
    const searchPaths = projectRoot ? [projectRoot] : [];
    searchPaths.push(
      path.join(ROOT, 'preview-bin'),
      '/home/chenjinbin/examples',
      '/home/chenjinbin/8_animations',
      '/home/chenjinbin/3_assets'
    );

    for (const base of searchPaths) {
      const filePath = path.join(base, 'preview-bin', rel);
      try {
        if (fs.existsSync(filePath)) {
          serveFileWithNoCache(res, filePath);
          return;
        }
      } catch(e) {}
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('WASM runtime not found');
    return;
  }

  // Compile API - reads project from POST body
  if (pathname === '/api/compile' && req.method === 'POST') {
    // Read POST body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const projectPath = data.project || query.project;
        const compileProjectRoot = validateProjectPath(projectPath);

        if (!compileProjectRoot) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid project path: ' + projectPath }));
          return;
        }

        // Run CLI compile command
        const args = [CLI_PATH, 'compile', compileProjectRoot, '--target', 'web'];
        const options = { cwd: ROOT, env: process.env };

        const child = spawn('node', args, options);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });

        child.on('close', (code) => {
          res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({
            success: code === 0,
            code: code,
            stdout: stdout,
            stderr: stderr,
          }));
        });

        child.on('error', (err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: err.message,
          }));
        });

      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body: ' + e.message }));
      }
    });
    return;
  }

  // Save API
  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const projectPath = data.project;
        const filePath = data.path;
        const content = data.content;

        if (!projectPath || !filePath) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing project or path' }));
          return;
        }

        const projectRoot = validateProjectPath(projectPath);
        if (!projectRoot) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid project path' }));
          return;
        }

        const fullPath = path.join(projectRoot, filePath);
        const resolved = path.resolve(fullPath);

        // Security check
        if (!resolved.startsWith(projectRoot)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });

        // Write file
        fs.writeFileSync(fullPath, content, 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`LVGL Previewer server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Features:');
  console.log('- Open http://localhost:' + PORT + ' to access the project manager');
  console.log('- Click "Open Folder" to add LVGL projects');
  console.log('- Projects are stored in browser localStorage');
});
