// merge-prompts.js — 把 repro 闭环生成的最终提示词合并进 preview-data.json 的 `prompt` 字段
// 用法: node merge-prompts.js
const fs = require('fs');
const path = require('path');

const DATA = 'preview-data.json';
const items = JSON.parse(fs.readFileSync(DATA, 'utf8'));
let merged = 0, empty = 0;

for (const it of items) {
  const rj = path.join('repro', it.id, 'result.json');
  let prompt = '';
  if (fs.existsSync(rj)) {
    try {
      const r = JSON.parse(fs.readFileSync(rj, 'utf8'));
      const fp = r.finalPrompt;
      if (fp && fs.existsSync(fp)) {
        prompt = fs.readFileSync(fp, 'utf8').trim();
      } else {
        // 回退: 扫描目录下任意 prompt.v*.md（兼容迭代到 v2/v3 的情况）
        const dir = path.join('repro', it.id);
        if (fs.statSync(dir).isDirectory()) {
          const cand = fs.readdirSync(dir)
            .filter(f => /^prompt\.v\d+\.md$/.test(f))
            .sort((a, b) => {
              const na = +a.match(/v(\d+)/)[1], nb = +b.match(/v(\d+)/)[1];
              return nb - na;
            });
          if (cand.length) prompt = fs.readFileSync(path.join(dir, cand[0]), 'utf8').trim();
        }
      }
    } catch (e) { /* ignore */ }
  }
  it.prompt = prompt;
  if (prompt) merged++; else empty++;
}

fs.writeFileSync(DATA, JSON.stringify(items, null, 1));
console.log('merged prompts:', merged, '| empty:', empty, '| total:', items.length);
