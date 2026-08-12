import type { GalleryItem, GalleryKind } from './gallery-schema';

export interface Filters {
  kind: 'all' | GalleryKind;
  framework: string;
  theme: string;
  onlySelected: boolean;
}

export const DEFAULT_FILTERS: Filters = { kind: 'all', framework: '', theme: '', onlySelected: false };

export function filterItems(items: GalleryItem[], filters: Filters, selected: ReadonlySet<string>) {
  return items.filter((item) =>
    (filters.kind === 'all' || item.kind === filters.kind) &&
    (!filters.framework || item.fw.includes(filters.framework)) &&
    (!filters.theme || item.theme === filters.theme) &&
    (!filters.onlySelected || selected.has(item.id)),
  );
}

export function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<T, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

export function readStoredSelection(storage: Pick<Storage, 'getItem'>, key: string) {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? '[]');
    return new Set(Array.isArray(value) && value.every((id) => typeof id === 'string') ? value : []);
  } catch {
    return new Set<string>();
  }
}
