import { z } from 'zod';

const httpUrl = z.string().url().refine((url) => /^https?:\/\//.test(url), 'must use http(s)');
const imagePath = z.string().regex(/^previews\/[a-z0-9-]+\.png$/, 'must be a local preview PNG');

const common = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  fw: z.array(z.string().min(1)),
  theme: z.string().min(1),
  vendor: z.string(),
  link: httpUrl,
  img: imagePath,
  prompt: z.string(),
  hifiPassed: z.boolean().optional(),
  animOk: z.boolean().optional(),
  hifiAttempts: z.number().int().nonnegative().optional(),
  hifiNotes: z.string().optional(),
});

const libraryItem = common.extend({
  kind: z.literal('item'),
  chips: z.array(z.string()),
  repo: z.union([httpUrl, z.literal('')]).optional(),
  desc: z.string().optional(),
  license: z.string().optional(),
});

const projectItem = common.extend({
  kind: z.literal('proj'),
  agency: z.string(),
  year: z.number().int().min(1990).max(2100),
  award: z.string().min(1),
  tech: z.array(z.string()),
  accent: z.string().optional(),
});

export const galleryItemSchema = z.discriminatedUnion('kind', [libraryItem, projectItem]);
export const gallerySchema = z.array(galleryItemSchema).length(230).superRefine((items, ctx) => {
  const ids = new Set<string>();
  for (const [index, item] of items.entries()) {
    if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'duplicate id' });
    ids.add(item.id);
    if (item.animOk === true && item.hifiPassed !== true) {
      ctx.addIssue({ code: 'custom', path: [index, 'animOk'], message: 'animation cannot pass unless reproduction passes' });
    }
  }
});

export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type GalleryKind = GalleryItem['kind'];
