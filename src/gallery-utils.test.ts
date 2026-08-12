import { describe, expect, it } from 'vitest';
import { galleryItems } from './gallery-data';
import { DEFAULT_FILTERS, filterItems, readStoredSelection } from './gallery-utils';

describe('gallery data and filters', () => {
  it('retains the full curated collection', () => {
    expect(galleryItems).toHaveLength(230);
    expect(galleryItems.filter((item) => item.kind === 'item')).toHaveLength(177);
    expect(galleryItems.filter((item) => item.kind === 'proj')).toHaveLength(53);
  });

  it('combines filters without mutating the source', () => {
    const originalFirst = galleryItems[0];
    const selected = new Set(['antd']);
    const result = filterItems(galleryItems, { ...DEFAULT_FILTERS, framework: 'React', onlySelected: true }, selected);
    expect(result.map((item) => item.id)).toEqual(['antd']);
    expect(galleryItems[0]).toBe(originalFirst);
  });

  it('recovers safely from invalid local storage', () => {
    expect(readStoredSelection({ getItem: () => '{bad' }, 'key').size).toBe(0);
    expect([...readStoredSelection({ getItem: () => '["antd"]' }, 'key')]).toEqual(['antd']);
  });
});
