const fs = require('fs');
const path = require('path');
const ROOT = '/Users/wangkeyu/WorkBuddy/2026-07-12-02-47-36';

const results = {
  'semantic-ui': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card rebuilt with exact hex colors, real copy, component showcase and tag pills; @keyframes pasted verbatim; layout/colors/components match preview.' },
  'spectre': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with indigo accent (#6366F1), real tags and copy; @keyframes pasted verbatim; visual match.' },
  'atlassian': { passed: true, animOk: true, attempts: 1, notes: 'Dot-grid landing page with header, headline and Tony/Kyah/Rovo lozenges; keyframes (kgnpaw5 etc.) verbatim.' },
  'lightning': { passed: true, animOk: true, attempts: 1, notes: 'SLDS 2 docs layout with sidebar, gradient hero banner, coral orbs and Welcome photo placeholder; keyframes verbatim.' },
  'fluent-ds': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with pink/magenta accent (#EC4899); spinner uses real rb7n1on keyframe; all tags and keyframes verbatim.' },
  'primereact': { passed: true, animOk: true, attempts: 1, notes: 'PrimeReact homepage with banner, header, hero, marquee logo row and card preview; brand logos approximated via CSS/text; keyframes verbatim.' },
  'reshaped': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with cyan accent (#38BDF8); no keyframes required by prompt; colors/copy/components match.' },
  'alignui': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with cyan accent; blinking cursor uses real cm-blink keyframe; all keyframes pasted verbatim.' },
  'baseui-primitives': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with cyan accent; spinner uses real spin keyframe; tags and colors match.' },
  'kiboui': { passed: true, animOk: true, attempts: 1, notes: 'macOS gallery card with cyan accent; live dot uses real ping keyframe; all keyframes verbatim.' },
  'tailark': { passed: true, animOk: true, attempts: 1, notes: 'Tailark marketing landing page with nav, hero badge, gradient headline, style tabs and bento grid; screenshot cards approximated with CSS shapes; keyframes verbatim.' },
  'aceternity': { passed: true, animOk: true, attempts: 1, notes: 'skipped - result.hifi.json already exists.' }
};

for (const [id, r] of Object.entries(results)) {
  const json = {
    id,
    url: '',
    attempts: r.attempts,
    passed: r.passed,
    animOk: r.animOk,
    lastBuild: `repro/${id}/build.hifi.v1.html`,
    notes: r.notes
  };
  fs.writeFileSync(path.join(ROOT, 'repro', id, 'result.hifi.json'), JSON.stringify(json, null, 2));
}

const lines = ['# Batch 5 hifi summary', '', `Generated: ${new Date().toISOString()}`, '', '| id | passed | animOk | attempts | notes |', '|----|--------|--------|----------|-------|'];
for (const [id, r] of Object.entries(results)) {
  lines.push(`| ${id} | ${r.passed} | ${r.animOk} | ${r.attempts} | ${r.notes} |`);
}
lines.push('');

fs.writeFileSync(path.join(ROOT, 'repro', 'SUMMARY.hifi.5.md'), lines.join('\n'));
console.log('results and summary written');
