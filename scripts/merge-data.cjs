/**
 * Merge new sites into preview-data.json
 * 
 * 1. Reads existing preview-data.json (230 items)
 * 2. Reads accessible-sites.json (136 new sites)
 * 3. For each new site with a screenshot, creates a data entry
 * 4. Fixes broken links in existing entries
 * 5. Writes updated preview-data.json
 */

const fs = require('fs');
const path = require('path');

const existingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'preview-data.json'), 'utf8'));
const newSites = JSON.parse(fs.readFileSync(path.join(__dirname, 'accessible-sites.json'), 'utf8'));
const fixedLinks = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixed-links.json'), 'utf8'));

const previewsDir = path.join(__dirname, '..', 'previews');

// Existing IDs to avoid duplicates
const existingIds = new Set(existingData.map(d => d.id));
const existingUrls = new Set(existingData.map(d => d.link));

// Fix broken links in existing entries
const fixedLinkMap = {};
fixedLinks.forEach(f => { fixedLinkMap[f.id] = f.url; });

let fixedCount = 0;
for (const item of existingData) {
  if (fixedLinkMap[item.id]) {
    item.link = fixedLinkMap[item.id];
    fixedCount++;
  }
}

// Add new sites that have screenshots
const newEntries = [];
let skippedNoScreenshot = 0;
let skippedDuplicate = 0;

for (const site of newSites) {
  // Skip if ID already exists
  if (existingIds.has(site.id)) {
    skippedDuplicate++;
    continue;
  }
  
  // Skip if URL already exists
  if (existingUrls.has(site.url)) {
    skippedDuplicate++;
    continue;
  }
  
  // Check if screenshot exists
  const screenshotPath = path.join(previewsDir, `${site.id}.png`);
  if (!fs.existsSync(screenshotPath)) {
    skippedNoScreenshot++;
    continue;
  }
  
  // Create new entry
  newEntries.push({
    id: site.id,
    name: site.name,
    fw: [],
    theme: site.theme,
    vendor: site.source || '',
    link: site.url,
    kind: 'proj',
    img: `previews/${site.id}.png`,
    chips: [],
    repo: '',
    desc: `${site.source} · ${site.theme}`,
    prompt: '',
    hifiPassed: undefined,
    animOk: undefined,
    hifiAttempts: undefined,
    hifiNotes: undefined,
  });
  
  existingIds.add(site.id);
  existingUrls.add(site.url);
}

// Merge
const mergedData = [...existingData, ...newEntries];

// Write
fs.writeFileSync(path.join(__dirname, '..', 'preview-data.json'), JSON.stringify(mergedData, null, 2));

console.log('=== MERGE COMPLETE ===');
console.log(`Existing items: ${existingData.length}`);
console.log(`Fixed links: ${fixedCount}`);
console.log(`New entries added: ${newEntries.length}`);
console.log(`Skipped (duplicate): ${skippedDuplicate}`);
console.log(`Skipped (no screenshot): ${skippedNoScreenshot}`);
console.log(`Total items: ${mergedData.length}`);
console.log(`  Projects (kind=proj): ${mergedData.filter(d => d.kind === 'proj').length}`);
console.log(`  Components (kind=item): ${mergedData.filter(d => d.kind === 'item').length}`);

// List new entries
console.log('\n=== NEW ENTRIES ===');
newEntries.forEach(e => console.log(`  ${e.id} | ${e.name} | ${e.theme}`));
