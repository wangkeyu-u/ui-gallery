// gen-gallery.js — 用模板 + preview-data.json 重建自包含画廊 preview-gallery.html
// 用法: node gen-gallery.js
const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'gallery.template.html');
const DATA = path.join(__dirname, 'preview-data.json');
const OUT = path.join(__dirname, 'preview-gallery.html');

const tpl = fs.readFileSync(TEMPLATE, 'utf8');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const json = JSON.stringify(data); // 紧凑，避免画廊体积过大
if (!tpl.includes('/*ITEMS*/')) { console.error('模板缺少 /*ITEMS*/ 占位符'); process.exit(1); }
const html = tpl.replace('/*ITEMS*/', json);
fs.writeFileSync(OUT, html);
console.log('gallery written:', OUT, '| items:', data.length, '| bytes:', html.length);
