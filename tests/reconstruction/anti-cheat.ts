import { readFile } from 'node:fs/promises';

export const forbiddenSourcePatterns: Array<[string, RegExp]> = [
  ['embedded image element', /<img\b|createElement\(['"]img/i],
  ['canvas pixel copy', /<canvas\b|createElement\(['"]canvas|getContext\(['"]2d|drawImage\s*\(/i],
  ['embedded binary asset', /data:image\/|;base64,/i],
  ['reference asset import', /reference-cases|\.reference\.png/i],
  ['remote or local CSS image', /(?:background|content)\s*:[^;}]*url\s*\(/i],
  ['test-only visual override', /visual-test|test-overlay|pixel-mask/i],
];

export async function scanCandidateSources(paths: string[]) {
  const violations: Array<{ file: string; rule: string }> = [];
  for (const file of paths) {
    const source = await readFile(file, 'utf8');
    for (const [rule, pattern] of forbiddenSourcePatterns) {
      if (pattern.test(source)) violations.push({ file, rule });
    }
  }
  return violations;
}
