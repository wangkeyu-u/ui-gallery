import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanCandidateSources } from '../tests/reconstruction/anti-cheat';

describe('reconstruction static anti-cheat', () => {
  it.each([
    ['reference image', '<img src="reference.png">'],
    ['base64', 'const x = "data:image/png;base64,AAAA"'],
    ['canvas', 'const c = document.createElement("canvas")'],
    ['CSS reference', '.x{background:url("/reference-cases/a.png")}'],
    ['test overlay', '.test-overlay{position:fixed;inset:0}'],
  ])('rejects %s cheating fixture', async (_name, source) => {
    const root = await mkdtemp(path.join(tmpdir(), 'ui-gallery-cheat-'));
    const file = path.join(root, 'candidate.tsx');
    await writeFile(file, source);
    expect(await scanCandidateSources([file])).not.toEqual([]);
  });
});
