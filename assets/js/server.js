const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const ejs = require('ejs');
const { getWebRingHTML } = require(path.join(__dirname, 'webring.js'));

let siteConfig;
try {
  const configPath = path.join(process.cwd(), 'site-config.json');
  siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('ERROR: No site-config.json found. Cannot start server.');
  console.error(
    'Please create site-config.json with: { "name": "Site Name", "title": "Page Title", "address": "site.com" }'
  );
  process.exit(1);
}

// Get markdown directory from site config or use default 'md'
const mdDirectory = siteConfig.mdDirectory || path.join(process.cwd(), 'md');

console.log(
  `Serving \"${siteConfig.name}\" markdown files from: ${mdDirectory}`
);

// Check site directory first, fall back to global /assets/
function localPath(relativePath) {
  const siteDir = process.cwd();
  const localFilePath = path.join(siteDir, relativePath);
  const globalFilePath = path.join(__dirname, '..', relativePath);

  // Check if file exists in site-specific directory
  if (fs.existsSync(localFilePath)) {
    return localFilePath;
  }

  // Fall back to global assets
  return globalFilePath;
}

// Load EJS template (check local first, then global)
const templatePath = localPath('ejs/layout.ejs');

const server = http.createServer(async (req, res) => {
  try {
    // Serve static assets (check local first, then global)
    if (req.url.startsWith('/assets/')) {
      const assetPath = localPath(req.url.substring(1)); // Remove leading slash
      if (fs.existsSync(assetPath)) {
        const ext = path.extname(assetPath);
        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.css': 'text/css',
          '.js': 'application/javascript',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(assetPath).pipe(res);
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Asset Not Found');
        return;
      }
    }

    // Clean up the URL path
    let filePath = req.url === '/' ? '/index.md' : req.url;

    // Add .md extension if not present
    if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    // Remove leading slash and resolve path from custom md directory
    filePath = path.join(mdDirectory, filePath.substring(1));

    // Read the markdown file
    const content = fs.readFileSync(filePath, 'utf8');

    // Convert to HTML
    const html = marked.parse(content);

    // Generate webring HTML
    const webRingHTML = getWebRingHTML(siteConfig.name);

    // Render page with EJS template
    ejs.renderFile(
      templatePath,
      {
        siteConfig,
        content: html,
        webRingHTML: webRingHTML,
        localPath: localPath, // Pass helper to templates for local-first includes
      },
      (err, str) => {
        if (err) {
          throw err;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(str);
      }
    );
  } catch (err) {
    // Generate webring HTML for error pages
    const webRingHTML = getWebRingHTML(siteConfig.name);

    if (err.code === 'ENOENT') {
      ejs.renderFile(
        localPath('ejs/404.ejs'),
        {
          siteConfig,
          webRingHTML: webRingHTML,
          localPath: localPath,
        },
        (ejsErr, str) => {
          if (ejsErr) {
            console.error('Error rendering 404 template:', ejsErr);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - File Not Found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(str);
          }
        }
      );
    } else {
      ejs.renderFile(
        localPath('ejs/500.ejs'),
        {
          siteConfig,
          webRingHTML: webRingHTML,
          localPath: localPath,
          errorMessage: err.message,
        },
        (ejsErr, str) => {
          if (ejsErr) {
            console.error('Error rendering 500 template:', ejsErr);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Server Error');
          } else {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(str);
          }
        }
      );
    }
  }
});

const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
  console.log(`Markdown server running on http://localhost:${PORT}`);
  console.log('Serving up some delicious .md files as HTML!');
});
