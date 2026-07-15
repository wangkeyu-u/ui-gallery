// ============================================================
// migrate-repro.cjs
// Adds model-agnostic reproduction (repro) fields to every UIProject.
// - Defaults everything to "untested".
// - Does NOT derive reproStatus from hifiPassed (they are independent).
// - Preserves every existing field and value.
// ============================================================
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'src/data/ui-projects.json');

const projects = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (!Array.isArray(projects)) {
  console.error('ui-projects.json is not an array; aborting.');
  process.exit(1);
}

const VALID_STATUS = new Set(['untested', 'passed', 'failed', 'needs-review']);

let changed = 0;
for (const project of projects) {
  // Only fill missing fields; never overwrite data that a validation run
  // has already written back.
  let touched = false;
  if (!('knownLimitations' in project)) { project.knownLimitations = []; touched = true; }
  if (!('reproStatus' in project) || !VALID_STATUS.has(project.reproStatus)) { project.reproStatus = 'untested'; touched = true; }
  if (!('reproScore' in project)) { project.reproScore = null; touched = true; }
  if (!('reproValidatedAt' in project)) { project.reproValidatedAt = null; touched = true; }
  if (!('reproReportPath' in project)) { project.reproReportPath = null; touched = true; }
  if (!('reproValidatorVersion' in project)) { project.reproValidatorVersion = null; touched = true; }
  if (!('reproLimitations' in project)) { project.reproLimitations = []; touched = true; }
  if (touched) changed += 1;
}

fs.writeFileSync(dataPath, `${JSON.stringify(projects, null, 2)}\n`);

const statusCounts = {};
for (const p of projects) statusCounts[p.reproStatus] = (statusCounts[p.reproStatus] || 0) + 1;
console.log(`Migrated ${changed}/${projects.length} projects.`);
console.log('reproStatus distribution:', statusCounts);
