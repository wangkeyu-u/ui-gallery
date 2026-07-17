const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ui-projects.json'), 'utf8'));
const quality = require('../src/data/project-quality.json');
const acceptedLinkStates = new Set(['ok', 'redirected']);

function isAccepted(project) {
  const listed = project.id.startsWith('v4-') || quality.verifiedIds.includes(project.id);
  const state = quality.linkStates[project.id] || (quality.redirectedIds.includes(project.id) ? 'redirected' : 'ok');
  return listed && acceptedLinkStates.has(state);
}

function pngDimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const results = projects.map(project => {
  const file = path.join(root, project.previewImage);
  const issues = [];
  let width = null;
  let height = null;
  let fileSize = null;
  if (!fs.existsSync(file)) {
    issues.push('FILE_MISSING');
  } else {
    fileSize = fs.statSync(file).size;
    const dimensions = pngDimensions(file);
    if (!dimensions) issues.push('NOT_PNG_OR_CORRUPT');
    else ({ width, height } = dimensions);
    if (fileSize < 3000) issues.push('FILE_TOO_SMALL');
  }
  if (!project.description) issues.push('MISSING_DESCRIPTION');
  return {
    id: project.id,
    name: project.name,
    accepted: isAccepted(project),
    previewImage: project.previewImage,
    width,
    height,
    fileSize,
    issues,
  };
});

const accepted = results.filter(result => result.accepted);
const quarantined = results.filter(result => !result.accepted);
const critical = accepted.filter(result => result.issues.some(issue => ['FILE_MISSING', 'NOT_PNG_OR_CORRUPT', 'FILE_TOO_SMALL'].includes(issue)));
const families = {};
projects.filter(isAccepted).forEach(project => { families[project.styleFamily] = (families[project.styleFamily] || 0) + 1; });

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalRecords: results.length,
    accepted: accepted.length,
    quarantined: quarantined.length,
    acceptedWithCriticalIssues: critical.length,
    acceptedFamilies: Object.keys(families).length,
  },
  familyDistribution: Object.fromEntries(Object.entries(families).sort((a, b) => b[1] - a[1])),
  criticalIssues: critical,
  results,
};

fs.writeFileSync(path.join(root, 'src/data/preview-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(report.summary);
if (critical.length) process.exitCode = 1;
