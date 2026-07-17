// ============================================================
// repro-pack.cjs
// Exports a replication task package to  repro/<project-id>/task/
//   - reference.png   (copy of the 1280x820 screenshot)
//   - brief.md
//   - project.json
//   - acceptance.json
// Usage:
//   node scripts/repro-pack.cjs --id v4-openai
//   node scripts/repro-pack.cjs --all            (every verified project)
// ============================================================
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ui-projects.json'), 'utf8'));
const quality = require('../src/data/project-quality.json');
let buildPackage;
let isAcceptedProject;
const isAccepted = (project) => isAcceptedProject(project, quality);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function exportOne(project) {
  const taskDir = path.join(root, 'repro', project.id, 'task');
  fs.mkdirSync(taskDir, { recursive: true });

  // 1. reference.png — verify dimensions, copy as-is.
  const srcPng = path.join(root, project.previewImage);
  if (!fs.existsSync(srcPng)) {
    console.error(`  ! missing screenshot for ${project.id}: ${project.previewImage}`);
    return false;
  }
  const buf = fs.readFileSync(srcPng);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== 1280 || h !== 820) {
    console.warn(`  ! ${project.id} screenshot is ${w}x${h}, expected 1280x820 (copied anyway)`);
  }
  fs.copyFileSync(srcPng, path.join(taskDir, 'reference.png'));

  // 2-4. text payloads
  const pkg = buildPackage(project);
  fs.writeFileSync(path.join(taskDir, 'brief.md'), pkg['brief.md']);
  fs.writeFileSync(path.join(taskDir, 'project.json'), pkg['project.json']);
  fs.writeFileSync(path.join(taskDir, 'acceptance.json'), pkg['acceptance.json']);
  console.log(`  + repro/${project.id}/task/  (reference ${w}x${h})`);
  return true;
}

async function main() {
  ({ buildPackage, isAcceptedProject } = await import('./repro-pack-common.mjs'));
  const id = arg('id');
  const all = process.argv.includes('--all');

  if (id) {
    const project = projects.find((p) => p.id === id);
    if (!project) { console.error(`Project not found: ${id}`); process.exit(1); }
    if (!isAccepted(project)) { console.error(`Project is not in the accessible accepted library: ${id}`); process.exit(1); }
    console.log(`Exporting task package for ${id}…`);
    exportOne(project);
  } else if (all) {
    const accepted = projects.filter(isAccepted);
    console.log(`Exporting task packages for ${accepted.length} accepted projects…`);
    let ok = 0;
    for (const p of accepted) if (exportOne(p)) ok += 1;
    console.log(`Done: ${ok}/${accepted.length} packages written.`);
  } else {
    console.log('Usage: node scripts/repro-pack.cjs --id <id> | --all');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
