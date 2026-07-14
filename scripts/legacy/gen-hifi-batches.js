// gen-hifi-batches.js
// 把所有「高保真(hifi)提示词」站点分区，供后台子代理并行跑「提示词→AI 生成→对比」验证。
// 运行(工具恢复后): node gen-hifi-batches.js
const fs = require('fs');
const B = 12; // 每批站点数

const data = JSON.parse(fs.readFileSync('preview-data.json', 'utf8'));
const sites = [];
for (const it of data) {
  const p = it.prompt || '';
  // 仅取带真实动画规格的高保真提示词，且本地有真实截图可作对比目标
  if (p.includes('精确动画规格') && fs.existsSync('previews/' + it.id + '.png')) {
    sites.push({
      id: it.id,
      url: it.link || '',
      target: 'previews/' + it.id + '.png',
      promptFile: 'repro/' + it.id + '/prompt.hifi.md'
    });
  }
}
const batches = [];
for (let i = 0; i < sites.length; i += B) {
  batches.push({ index: batches.length, sites: sites.slice(i, i + B) });
}
fs.writeFileSync('repro/hifi-batches.json', JSON.stringify(batches, null, 0));
console.log('hifi sites:', sites.length, '| batches:', batches.length, '(size ' + B + ')');
