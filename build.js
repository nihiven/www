const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { minify: minifyHTML } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { getWebRingHTML } = require('./assets/js/webring.js');

// Parse CLI arguments
const args = process.argv.slice(2);
const siteFilter = args.find(arg => arg.startsWith('--site='))?.split('=')[1];

// Minifier configurations
const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
};

const cssMinifier = new CleanCSS({
  level: 2,
});

// Find all sites (directories with site-config.json)
function findSites() {
  const rootDir = __dirname;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => {
      const configPath = path.join(rootDir, entry.name, 'site-config.json');
      return fs.existsSync(configPath);
    })
    .map(entry => entry.name);
}

// Read site configuration
function readSiteConfig(siteName) {
  const configPath = path.join(__dirname, siteName, 'site-config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`Error reading config for ${siteName}:`, err.message);
    return null;
  }
}

// Resolve CSS theme file path (local override or global)
function resolveCSSTheme(siteName, themeName = 'amber-phosphor') {
  const localPath = path.join(__dirname, siteName, 'css', `${themeName}.css`);
  const globalPath = path.join(__dirname, 'assets', 'css', `${themeName}.css`);

  if (fs.existsSync(localPath)) {
    console.log(`  Using local theme: ${siteName}/css/${themeName}.css`);
    return localPath;
  }

  if (fs.existsSync(globalPath)) {
    console.log(`  Using global theme: assets/css/${themeName}.css`);
    return globalPath;
  }

  console.warn(
    `  Warning: Theme '${themeName}' not found, using amber-phosphor fallback`
  );
  return path.join(__dirname, 'assets', 'css', 'amber-phosphor.css');
}

// Find all markdown files in a directory
function findMarkdownFiles(mdDir, baseDir = mdDir) {
  const results = [];

  if (!fs.existsSync(mdDir)) {
    return results;
  }

  const entries = fs.readdirSync(mdDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(mdDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push({
        fullPath,
        relativePath: path.relative(baseDir, fullPath),
      });
    }
  }

  return results;
}

// Extract title from markdown content (first h1 or filename)
function extractTitle(markdownContent, filename) {
  const h1Match = markdownContent.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1];
  }

  // Fallback to filename without extension
  return path.basename(filename, '.md');
}

// Build HTML template
function buildHTMLTemplate(siteConfig, pageTitle, markdownHTML, minifiedCSS) {
  const title =
    pageTitle === 'index'
      ? siteConfig.title
      : `${pageTitle} - ${siteConfig.name}`;
  const webRingHTML = getWebRingHTML(siteConfig.name);

  // Build header buttons HTML if they exist
  let headerButtonsHTML = '';
  if (siteConfig.headerButtons && siteConfig.headerButtons.length > 0) {
    const buttons = siteConfig.headerButtons
      .map(btn => `<a href="${btn.url}">${btn.label}</a>`)
      .join('');
    headerButtonsHTML = `
      <div class="header-buttons">
        ${buttons}
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  <style>
    ${minifiedCSS}

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
    }

    .monitor {
      width: 100%;
      max-width: 900px;
      min-height: 500px;
      padding: 20px;
      border-radius: 8px;
      font-size: 20px;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    a {
      color: var(--crt-fg);
      text-decoration: underline;
      filter: brightness(1.2);
    }

    a:hover {
      text-shadow: 0 0 10px var(--crt-glow), 0 0 20px var(--crt-glow);
      filter: brightness(1.4);
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h1:first-child, h2:first-child, h3:first-child {
      margin-top: 0;
    }

    p {
      margin-bottom: 1em;
    }

    ul, ol {
      margin-bottom: 1em;
      margin-left: 2em;
    }

    pre {
      margin-bottom: 1em;
      padding: 1em;
      background: var(--crt-bg-dark);
      border-radius: 4px;
      overflow-x: auto;
    }

    code {
      font-family: inherit;
    }

    /* Webring button styling */
    .webring-container {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--crt-fg);
    }

    .webring-container > div {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .webring-container a {
      padding: 7px 14px;
      background: var(--crt-bg-dark);
      border: 1px solid var(--crt-fg);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 0.76em;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .webring-container a:first-child {
      text-align: left;
    }

    .webring-container a:nth-child(2) {
      text-align: center;
    }

    .webring-container a:last-child {
      text-align: right;
    }

    .webring-container a:hover {
      background: var(--crt-fg);
      color: var(--crt-bg);
      box-shadow: 0 0 15px var(--crt-glow);
    }

    /* Site header styling */
    .site-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--crt-fg);
    }

    .site-header h1 {
      margin: 0;
      font-size: 2em;
      letter-spacing: 4px;
      text-transform: uppercase;
      position: relative;
      display: inline-block;
    }

    .site-header h1 .crt-cursor {
      position: absolute;
      right: -0.6em;
      top: 50%;
      transform: translateY(-50%);
    }

    /* Header buttons styling */
    .header-buttons {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid var(--crt-fg);
      gap: 10px;
    }

    .header-buttons a {
      padding: 7px 14px;
      background: var(--crt-bg-dark);
      border: 1px solid var(--crt-fg);
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 0.76em;
      transition: all 0.2s;
    }

    .header-buttons a:hover {
      background: var(--crt-fg);
      color: var(--crt-bg);
      box-shadow: 0 0 15px var(--crt-glow);
      filter: brightness(1);
    }
  </style>
</head>
<body>
  <div class="monitor crt crt-glow">
    <div class="site-header">
      <h1 class="crt-glow-strong">${siteConfig.name}<span class="crt-cursor"></span></h1>
      ${headerButtonsHTML}
    </div>
    ${markdownHTML}
    ${webRingHTML}
  </div>
</body>
</html>`;
}

// Build a single site
async function buildSite(siteName) {
  console.log(`\nBuilding site: ${siteName}`);

  const siteConfig = readSiteConfig(siteName);
  if (!siteConfig) {
    console.error(`  Skipping ${siteName}: Invalid config`);
    return;
  }

  // Resolve CSS theme
  const themeName = siteConfig.theme || 'amber-phosphor';
  const cssPath = resolveCSSTheme(siteName, themeName);
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const minifiedCSS = cssMinifier.minify(cssContent).styles;

  // Find markdown files
  const mdDir = path.join(__dirname, siteName, 'md');
  const markdownFiles = findMarkdownFiles(mdDir);

  if (markdownFiles.length === 0) {
    console.log(`  No markdown files found in ${siteName}/md/`);
    return;
  }

  console.log(`  Found ${markdownFiles.length} markdown file(s)`);

  // Create output directory
  const htmlDir = path.join(__dirname, siteName, 'html');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  // Process each markdown file
  let successCount = 0;
  for (const mdFile of markdownFiles) {
    try {
      // Read and convert markdown
      const markdownContent = fs.readFileSync(mdFile.fullPath, 'utf8');
      let markdownHTML = await marked.parse(markdownContent);

      // Replace .md links with .html links
      markdownHTML = markdownHTML.replace(
        /href="([^"]*?)\.md"/g,
        'href="$1.html"'
      );
      markdownHTML = markdownHTML.replace(
        /href='([^']*?)\.md'/g,
        "href='$1.html'"
      );

      // Extract page title
      const pageTitle = extractTitle(markdownContent, mdFile.relativePath);

      // Build HTML
      const html = buildHTMLTemplate(
        siteConfig,
        pageTitle,
        markdownHTML,
        minifiedCSS
      );

      // Minify HTML
      const minifiedHTML = await minifyHTML(html, htmlMinifyOptions);

      // Determine output path
      const outputPath = path.join(
        htmlDir,
        mdFile.relativePath.replace('.md', '.html')
      );

      // Create subdirectories if needed
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write output file
      fs.writeFileSync(outputPath, minifiedHTML, 'utf8');
      console.log(
        `  ✓ ${mdFile.relativePath} -> html/${mdFile.relativePath.replace('.md', '.html')}`
      );
      successCount++;
    } catch (err) {
      console.error(
        `  ✗ Error processing ${mdFile.relativePath}:`,
        err.message
      );
    }
  }

  console.log(`  Completed: ${successCount}/${markdownFiles.length} files`);
}

// Main execution
async function main() {
  console.log('=== Markdown to HTML Build System ===\n');

  if (siteFilter) {
    console.log(`Building specific site: ${siteFilter}`);
    await buildSite(siteFilter);
  } else {
    const sites = findSites();
    console.log(`Found ${sites.length} site(s): ${sites.join(', ')}`);

    for (const site of sites) {
      await buildSite(site);
    }
  }

  console.log('\n=== Build Complete ===');
}

main();
