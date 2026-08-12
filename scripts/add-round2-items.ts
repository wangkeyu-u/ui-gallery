import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const dataPath = new URL('../preview-data.json', import.meta.url);
const items = JSON.parse(await readFile(dataPath, 'utf8')) as Array<Record<string, unknown>>;

const additions = [
  {
    id: 'once-ui',
    name: 'Once UI',
    fw: ['React'],
    theme: 'AI 原生 / 语义化设计系统',
    vendor: 'Once UI System',
    link: 'https://once-ui.com',
    kind: 'item',
    img: 'previews/once-ui.png',
    chips: ['Layout', 'Theme', 'Typography', 'Forms', 'Navigation', 'Data Display'],
    repo: 'https://github.com/once-ui-system/core',
    desc: '面向 Next.js 的 AI-native 语义化开源设计系统，强调人类可读与机器可写的组件语法。',
    prompt: '',
    license: 'MIT',
    provenance: {
      sourceType: 'official_repository',
      sourceUrl: 'https://github.com/once-ui-system/core',
      verifiedAt: '2026-08-13T00:00:00.000Z',
      license: 'MIT',
    },
  },
  {
    id: 'basecoat',
    name: 'Basecoat',
    fw: ['CSS'],
    theme: 'Tailwind / 跨技术栈',
    vendor: 'Hunvreus',
    link: 'https://basecoatui.com',
    kind: 'item',
    img: 'previews/basecoat.png',
    chips: ['Button', 'Input', 'Dialog', 'Chart', 'Badge', 'Forms'],
    repo: 'https://github.com/hunvreus/basecoat',
    desc: '基于 Tailwind CSS、可用于任意 Web 技术栈的组件库，提供类似 shadcn/ui 的无 React 方案。',
    prompt: '',
    license: 'MIT',
    provenance: {
      sourceType: 'official_repository',
      sourceUrl: 'https://github.com/hunvreus/basecoat',
      verifiedAt: '2026-08-13T00:00:00.000Z',
      license: 'MIT',
    },
  },
];

for (const addition of additions) {
  const existing = items.find((item) => item.id === addition.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(addition)) throw new Error(`Conflicting existing item: ${addition.id}`);
  } else {
    items.push(addition);
  }
}

if (items.length !== 232) throw new Error(`Expected 232 unique curated items, received ${items.length}`);
if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error('Duplicate item IDs detected');

await writeFile(dataPath, `${JSON.stringify(items, null, 2)}\n`);
console.log(JSON.stringify({
  total: items.length,
  added: additions.map((item) => item.id),
  dataSha256: createHash('sha256').update(await readFile(dataPath)).digest('hex'),
}, null, 2));
