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

// Load EJS template
const templatePath = path.join(__dirname, '../ejs', 'layout.ejs');

const server = http.createServer(async (req, res) => {
  try {
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
        webRingHTML: webRingHTML
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
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body>
  <h1>404 - File Not Found</h1>
  <p>The requested markdown file could not be found.</p>
</body>
</html>`);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>500 Error</title></head>
<body>
  <h1>500 - Server Error</h1>
  <p>${err.message}</p>
</body>
</html>`);
    }
  }
});

const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
  console.log(`Markdown server running on http://localhost:${PORT}`);
  console.log('Serving up some delicious .md files as HTML!');
});
