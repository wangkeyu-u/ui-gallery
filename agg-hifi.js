// agg-hifi.js
// 聚合所有 repro/<id>/result.hifi.json,输出统计,并把 hifi 验证结果写回 preview-data.json(新增 hifiPassed / animOk 字段)。
// 运行(工具恢复后,所有批次跑完): node agg-hifi.js
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('preview-data.json', 'utf8'));
const byId = new Map(data.map(d => [d.id, d]));

let total = 0, passed = 0, animOk = 0, attempted = 0, unreachable = 0;
const fails = [];
for (const it of data) {
  const rj = 'repro/' + it.id + '/result.hifi.json';
  if (!fs.existsSync(rj)) continue;
  const r = JSON.parse(fs.readFileSync(rj, 'utf8'));
  total++;
  it.hifiPassed = !!r.passed;
  it.animOk = !!r.animOk;
  it.hifiAttempts = r.attempts || 0;
  it.hifiNotes = r.notes || '';
  if (r.passed) passed++;
  if (r.animOk) animOk++;
  if ((r.attempts || 0) >= 1) attempted++; else unreachable++;
  if (!r.passed) fails.push(it.id + ': ' + (r.notes || 'no notes'));
}

fs.writeFileSync('preview-data.json', JSON.stringify(data, null, 1));
console.log('=== Hifi Repro 验证汇总 ===');
console.log('已验证站点:', total, '/', data.length);
console.log('静态复现通过(passed):', passed, '(' + (passed / total * 100).toFixed(1) + '%)');
console.log('动画还原(animOk):', animOk, '(' + (animOk / total * 100).toFixed(1) + '%)');
console.log('真正尝试过(attempts>=1):', attempted, '| 缺失输入:', unreachable);
console.log('失败站点数:', fails.length);
if (fails.length) console.log(fails.slice(0, 30).join('\n'));
