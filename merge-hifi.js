// merge-hifi.js — 把混合高保真提示词(prompt.hifi.md)写入 preview-data.json 的 prompt 字段
// 优先用 hifi;若 hifi 缺失则保留已有 prompt(向后兼容)
const fs = require('fs');
const path = require('path');

const DATA = 'preview-data.json';
const items = JSON.parse(fs.readFileSync(DATA, 'utf8'));
let updated = 0, kept = 0, empty = 0;

for (const it of items) {
  const hifiPath = path.join('repro', it.id, 'prompt.hifi.md');
  if (fs.existsSync(hifiPath)) {
    const txt = fs.readFileSync(hifiPath, 'utf8').trim();
    if (txt.length > 50) { it.prompt = txt; updated++; continue; }
  }
  // 无 hifi:保留现有 prompt(可能是早先的静态提示词)
  if (it.prompt && it.prompt.length > 50) kept++;
  else empty++;
}
fs.writeFileSync(DATA, JSON.stringify(items, null, 1));
console.log('updated from hifi:', updated, '| kept existing:', kept, '| still empty:', empty, '| total:', items.length);
