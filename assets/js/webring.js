const fs = require('fs');
const path = require('path');

// Load web ring sites from JSON
const webringSites = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'webring.json'), 'utf8')
);

/**
 * Generate web ring HTML for a given site
 * @param {string} currentSite - samus.cam
 * @param {string} separator - separator between links (default: ' : ')
 * @returns {string} HTML string for the web ring
 */
function getWebRingHTML(currentSite, separator = ' : ') {
  const currentIndex = webringSites.findIndex(
    site => site.name === currentSite
  );

  // If site not found in ring, just show all sites
  if (currentIndex === -1) {
    const links = webringSites
      .map(site => `<a href="${site.url}">${site.name}</a>`)
      .join(separator);

    return `
      <div class="webring-container">
        <div>${links}</div>
      </div>
    `;
  }

  // Calculate previous, next, and random sites
  const prevIndex =
    (currentIndex - 1 + webringSites.length) % webringSites.length;
  const nextIndex = (currentIndex + 1) % webringSites.length;

  // Get random site that isn't the current site
  const otherSites = webringSites.filter((_, i) => i !== currentIndex);
  const randomSite = otherSites[Math.floor(Math.random() * otherSites.length)];

  return `
    <div class="webring-container">
      <div>
        <a href="${webringSites[prevIndex].url}">&lt;&lt; ${webringSites[prevIndex].name}</a>
        ${separator}<a href="${randomSite.url}">random</a>${separator}
        <a href="${webringSites[nextIndex].url}">${webringSites[nextIndex].name} &gt;&gt;</a>
      </div>
    </div>
  `;
}

module.exports = { getWebRingHTML };
