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
    let urlPath = req.url === '/' ? '/index' : req.url;

    // Remove extension if present for consistent handling
    if (urlPath.endsWith('.md') || urlPath.endsWith('.html')) {
      urlPath = urlPath.replace(/\.(md|html)$/, '');
    }

    // Check for .html file first (in html/ directory), then fall back to .md
    const htmlDirectory = path.join(path.dirname(mdDirectory), 'html');
    const htmlPath = path.join(htmlDirectory, urlPath.substring(1) + '.html');
    const mdPath = path.join(mdDirectory, urlPath.substring(1) + '.md');

    let content;
    let html;

    if (fs.existsSync(htmlPath)) {
      // Serve HTML file directly (already HTML, no conversion needed)
      content = fs.readFileSync(htmlPath, 'utf8');
      html = content;
    } else {
      // Fall back to markdown file
      content = fs.readFileSync(mdPath, 'utf8');
      html = marked.parse(content);
    }

    // Generate webring HTML
    const webRingHTML = getWebRingHTML(siteConfig.name, siteConfig.webringSeparator);

    // Generate sidebar HTML if configured
    let sidebarHTML = '';
    if (siteConfig.sidebarLinks && siteConfig.sidebarLinks.length > 0) {
      const links = siteConfig.sidebarLinks
        .map(link => `<a href="${link.url}">${link.label}</a>`)
        .join('');
      sidebarHTML = `<nav class="sidebar">${links}</nav>`;
    }

    // Render page with EJS template
    ejs.renderFile(
      templatePath,
      {
        siteConfig,
        content: html,
        webRingHTML: webRingHTML,
        sidebarHTML: sidebarHTML,
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
