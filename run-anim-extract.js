// run-anim-extract.js — 并发跑 repro-read2.js 生成所有可访问站的 anim.json
// 用法: node run-anim-extract.js [concurrency]
const fs = require('fs');
const { spawn } = require('child_process');

const NODE = process.execPath;
const accessible = JSON.parse(fs.readFileSync('/tmp/accessible.json', 'utf8'));
const CONC = parseInt(process.argv[2] || '4', 10);

// skip-if-done: anim.json 存在且 ok:true 则跳过
const todo = accessible.filter(s => {
  const p = 'repro/' + s.id + '/anim.json';
  if (fs.existsSync(p)) {
    try { const r = JSON.parse(fs.readFileSync(p, 'utf8')); if (r.ok) return false; } catch (e) {}
  }
  return true;
});
console.log('total accessible:', accessible.length, '| todo:', todo.length, '| concurrency:', CONC);

let idx = 0, done = 0, ok = 0, fail = 0;
const results = [];
function next() {
  if (idx >= todo.length) return null;
  const s = todo[idx++];
  return new Promise(resolve => {
    const out = 'repro/' + s.id + '/anim.json';
    const child = spawn(NODE, ['repro-read2.js', s.url, out], {
      env: { ...process.env, NODE_PATH: process.cwd() + '/node_modules' },
      stdio: 'ignore'
    });
    const to = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) {} }, 60000);
    child.on('exit', () => {
      clearTimeout(to);
      done++;
      let good = false;
      try { const r = JSON.parse(fs.readFileSync(out, 'utf8')); good = !!r.ok; } catch (e) {}
      if (good) ok++; else { fail++; results.push(s.id + ':fail'); }
      if (done % 10 === 0 || done === todo.length) console.log(`  progress ${done}/${todo.length} (ok=${ok} fail=${fail})`);
      resolve();
    });
  });
}

(async () => {
  const workers = Array.from({ length: CONC }, async () => {
    let p; while ((p = next())) { await p; }
  });
  await Promise.all(workers);
  console.log('DONE. ok=' + ok, 'fail=' + fail);
  if (results.length) console.log('failed ids:', results.join(' '));
})();
