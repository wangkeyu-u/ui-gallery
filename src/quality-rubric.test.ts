import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assessQuality, type QualityItem } from '../scripts/quality-lib';

const base: QualityItem = {
  id: 'alpha', name: 'Alpha', kind: 'item', link: 'https://example.com/alpha', img: 'alpha.png',
  theme: 'Test', vendor: 'Vendor', fw: ['React'], repo: 'https://example.com/repo', license: 'MIT', chips: ['Button'],
};

async function fixtureRoot() {
  const root = await mkdtemp(path.join(tmpdir(), 'ui-gallery-quality-'));
  await writeFile(path.join(root, 'alpha.png'), PNG.sync.write(new PNG({ width: 480, height: 300 })));
  return root;
}

describe('quality rubric anti-gaming failures', () => {
  it('fails when source-rights capability is removed', async () => {
    const [result] = await assessQuality([{ ...base, license: undefined }], await fixtureRoot());
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain('source_and_rights');
  });

  it('fails both records when the canonical source link is duplicated', async () => {
    const root = await fixtureRoot();
    await writeFile(path.join(root, 'beta.png'), PNG.sync.write(new PNG({ width: 480, height: 300, fill: true })));
    const results = await assessQuality([base, { ...base, id: 'beta', img: 'beta.png' }], root);
    expect(results.every((result) => !result.passed && result.reasons.includes('unique_link'))).toBe(true);
  });

  it('fails when an input tampers with the referenced asset', async () => {
    const [result] = await assessQuality([{ ...base, img: 'missing.png' }], await fixtureRoot());
    expect(result.passed).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(['asset_exists', 'readable_dimensions', 'unique_asset']));
  });
});
