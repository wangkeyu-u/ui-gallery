import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { gallerySchema } from '../src/gallery-schema.ts';

const root = process.cwd();
const raw = JSON.parse(await readFile(path.join(root, 'preview-data.json'), 'utf8'));
const result = gallerySchema.safeParse(raw);

if (!result.success) {
  console.error(JSON.stringify({ valid: false, issues: result.error.issues }, null, 2));
  process.exit(1);
}

const missingImages: string[] = [];
await Promise.all(result.data.map(async (item) => {
  try { await access(path.join(root, item.img)); } catch { missingImages.push(item.img); }
}));
if (missingImages.length > 0) {
  console.error(JSON.stringify({ valid: false, missingImages: missingImages.sort() }, null, 2));
  process.exit(1);
}

const summary = {
  valid: true,
  total: result.data.length,
  libraries: result.data.filter((item) => item.kind === 'item').length,
  projects: result.data.filter((item) => item.kind === 'proj').length,
  images: result.data.length,
};
console.log(JSON.stringify(summary, null, 2));
