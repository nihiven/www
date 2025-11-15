const http = require('http');
const fs = require('fs');
const path = require('path');

// Get markdown directory from command line argument or use default
const mdDirectory = process.argv[2] || path.join(process.cwd(), 'md');

console.log(`Serving markdown files from: ${mdDirectory}`);

// Import marked dynamically since we'll install it
let marked;

const server = http.createServer(async (req, res) => {
  // Lazy load marked
  if (!marked) {
    marked = (await import('marked')).marked;
  }

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

    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const pageTitle = titleMatch ? titleMatch[1] : 'A cool web site!';

    // Convert to HTML
    const html = marked.parse(content);

    // Send response with nice styling
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>nihiven:: ${pageTitle}</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    img {
      max-width: 100%;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      color: #666;
      margin: 16px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    table th {
      background: #f6f8fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body>
  <h1>404 - File Not Found</h1>
  <p>The requested markdown file could not be found. 🪦</p>
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
