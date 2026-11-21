// gen-gallery.js — 用模板 + preview-data.json 重建自包含画廊 preview-gallery.html
// 用法: npm run build
const fs = require('fs');
const path = require('path');

function buildGalleryHtml(tpl, data) {
  // HTML parses script end tags and comments before JavaScript string literals.
  const json = JSON.stringify(data).replace(/[<\u2028\u2029]/g,
    character => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));
  if (!tpl.includes('/*ITEMS*/')) throw new Error('模板缺少 /*ITEMS*/ 占位符');
  // A callback keeps prompt text such as $& and $` literal during replacement.
  return tpl.replace('/*ITEMS*/', () => json);
}

if (require.main === module) {
  const TEMPLATE = path.join(__dirname, '..', 'gallery.template.html');
  const DATA = path.join(__dirname, '..', 'preview-data.json');
  const OUT = path.join(__dirname, '..', 'preview-gallery.html');

  const tpl = fs.readFileSync(TEMPLATE, 'utf8');
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const html = buildGalleryHtml(tpl, data);
  fs.writeFileSync(OUT, html);
  console.log('gallery written:', OUT, '| items:', data.length, '| bytes:', html.length);
}

module.exports = { buildGalleryHtml };
