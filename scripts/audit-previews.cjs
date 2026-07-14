/**
 * Preview Image Quality Audit
 * 
 * Checks all 230 preview images for:
 * - File size anomalies (too small = likely broken)
 * - Image dimensions (too small = wrong screenshot)
 * - Solid color detection (all white/black = empty)
 * - Cross-references with data quality
 */

const fs = require('fs');
const path = require('path');

const previewsDir = path.join(__dirname, '..', 'previews');
const dataPath = path.join(__dirname, '..', 'preview-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Read image header to get dimensions (PNG header)
function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature: first 8 bytes
  // IHDR chunk starts at byte 8, width at bytes 16-19, height at bytes 20-23
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height, size: buf.length };
}

// Check if image is mostly solid color (empty/blank)
function checkSolidColor(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 100) return { isSolid: true, reason: 'too-small' };
  
  // Sample pixels from the image data
  // PNG: after IHDR (33 bytes), IDAT chunks contain compressed data
  // For a quick check, sample every Nth byte in the raw file
  // If most bytes are the same, it's likely solid
  const sampleSize = Math.min(1000, buf.length);
  const step = Math.floor(buf.length / sampleSize);
  const samples = [];
  for (let i = 0; i < buf.length && samples.length < sampleSize; i += step) {
    samples.push(buf[i]);
  }
  
  // Check variance
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - avg) ** 2, 0) / samples.length;
  
  // Very low variance = solid color
  if (variance < 5) {
    return { isSolid: true, reason: `low-variance-${avg.toFixed(0)}` };
  }
  
  return { isSolid: false, variance: variance.toFixed(1) };
}

const results = [];
let issueCount = 0;

for (const item of data) {
  const imgPath = path.join(previewsDir, path.basename(item.img));
  const result = {
    id: item.id,
    name: item.name,
    kind: item.kind,
    theme: item.theme,
    imgPath: item.img,
    issues: [],
  };

  // Check file exists
  if (!fs.existsSync(imgPath)) {
    result.issues.push('FILE_MISSING');
    issueCount++;
    results.push(result);
    continue;
  }

  const stats = fs.statSync(imgPath);
  result.fileSize = stats.size;

  // Check file size
  if (stats.size < 3000) {
    result.issues.push('FILE_TOO_SMALL');
    issueCount++;
  }

  // Get dimensions
  const dims = getPngDimensions(imgPath);
  if (dims) {
    result.width = dims.width;
    result.height = dims.height;
    result.fileSizeFormatted = (dims.size / 1024).toFixed(1) + 'KB';

    // Check dimensions
    if (dims.width < 400 || dims.height < 250) {
      result.issues.push('DIMENSIONS_TOO_SMALL');
      issueCount++;
    }
    if (dims.width !== 1280 && dims.height !== 820 && dims.width !== 820) {
      // Non-standard dimensions (not the expected screenshot size)
      // This isn't necessarily an issue, just worth noting
      result.nonStandardDims = true;
    }
  } else {
    result.issues.push('NOT_PNG_OR_CORRUPT');
    issueCount++;
  }

  // Check for solid color (empty screenshot)
  const solidCheck = checkSolidColor(imgPath);
  if (solidCheck.isSolid) {
    result.issues.push('SOLID_COLOR:' + solidCheck.reason);
    issueCount++;
  }

  // Check data quality
  if (!item.prompt || item.prompt.length < 50) {
    result.issues.push('NO_PROMPT');
  }
  if (!item.desc) {
    result.issues.push('NO_DESC');
  }
  if (item.hifiPassed === undefined) {
    result.issues.push('NO_VERIFICATION');
  }

  results.push(result);
}

// Summary
const withIssues = results.filter(r => r.issues.length > 0);
const criticalIssues = results.filter(r => 
  r.issues.some(i => ['FILE_MISSING', 'FILE_TOO_SMALL', 'NOT_PNG_OR_CORRUPT', 'SOLID_COLOR'].some(p => i.startsWith(p)))
);

console.log('=== PREVIEW AUDIT SUMMARY ===');
console.log(`Total images: ${results.length}`);
console.log(`Images with issues: ${withIssues.length}`);
console.log(`Critical issues (broken/empty): ${criticalIssues.length}`);
console.log('');

// Critical issues
if (criticalIssues.length > 0) {
  console.log('=== CRITICAL ISSUES (need replacement) ===');
  criticalIssues.forEach(r => {
    console.log(`  ${r.id} | ${r.name} | ${r.issues.filter(i => ['FILE_MISSING','FILE_TOO_SMALL','NOT_PNG_OR_CORRUPT'].includes(i) || i.startsWith('SOLID_COLOR')).join(', ')}`);
  });
}

// Data quality issues
const noPrompt = results.filter(r => r.issues.includes('NO_PROMPT'));
const noDesc = results.filter(r => r.issues.includes('NO_DESC'));
const noVerif = results.filter(r => r.issues.includes('NO_VERIFICATION'));

console.log('\n=== DATA QUALITY ===');
console.log(`Missing prompt (<50 chars): ${noPrompt.length}`);
console.log(`Missing description: ${noDesc.length}`);
console.log(`Missing verification data: ${noVerif.length}`);

// Dimension distribution
const dims = results.filter(r => r.width && r.height);
const dimCounts = {};
dims.forEach(r => {
  const key = `${r.width}x${r.height}`;
  dimCounts[key] = (dimCounts[key] || 0) + 1;
});
console.log('\n=== DIMENSION DISTRIBUTION ===');
Object.entries(dimCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

// File size distribution
const sizes = results.filter(r => r.fileSize).map(r => r.fileSize);
const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
const minSize = Math.min(...sizes);
const maxSize = Math.max(...sizes);
console.log('\n=== FILE SIZE ===');
console.log(`  Min: ${(minSize / 1024).toFixed(1)}KB`);
console.log(`  Avg: ${(avgSize / 1024).toFixed(1)}KB`);
console.log(`  Max: ${(maxSize / 1024).toFixed(1)}KB`);

// Write full report
const reportPath = path.join(__dirname, '..', 'src', 'data', 'preview-audit.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    total: results.length,
    withIssues: withIssues.length,
    critical: criticalIssues.length,
    missingPrompt: noPrompt.length,
    missingDesc: noDesc.length,
    missingVerification: noVerif.length,
  },
  criticalIssues: criticalIssues.map(r => ({ id: r.id, name: r.name, issues: r.issues })),
  allResults: results,
}, null, 2));

console.log(`\n=== Full report written to src/data/preview-audit.json ===`);
