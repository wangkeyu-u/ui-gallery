import type { UIProject } from '../types';

export type LinkState = 'ok' | 'redirected' | 'blocked' | 'dead' | 'quarantine';

const VERIFIED_IDS = new Set([
  'proj-2021-two-good-co', 'proj-2023-obys', 'proj-2024-gentlerain',
  'awd-lusion-oryzo', 'awd-locomotive', 'awd-huge', 'awd-2025-somefolk',
  'awd-2025-ottografie', 'awd-2025-rejouice', 'awd-2025-burocratik',
  'awd-2025-filip-felbar', 'awd-2025-25-residences', 'awd-2025-gianluca',
  'css-2025-spylt', 'css-2025-soren-west', 'webby-2024-suno',
  'webby-2024-metamask', 'webby-2024-raw-materials', 'webby-2024-shopify',
  'prod-jasper', 'prod-framer', 'prod-figma', 'prod-linear', 'prod-stripe',
  'prod-clay', 'prod-attio', 'prod-posthog', 'prod-beehiiv', 'prod-deepgram',
  'prod-github-copilot', 'prod-monday', 'prod-asana', 'prod-mixpanel',
  'prod-glossier', 'studio-now-here', 'studio-brittany', 'studio-josh-comeau',
  'studio-stelo', 'extra-nike', 'extra-wieden', 'extra-razorfish',
  'extra-vercel-docs', 'extra-supabase', 'extra-prisma', 'extra-clerk',
  'extra-resend', 'extra-linear-method', 'extra-stripe-atlas',
  'extra-apple-vision', 'extra-anthropic', 'extra-brutalist',
  'extra-hoverstats', 'extra-zara',
  'new-dropbox-brand', 'new-rijksmuseum', 'new-raycast',
  'new-rivian', 'new-google-fonts',
]);

const LINK_STATES: Partial<Record<string, LinkState>> = {
  'proj-template-portfolio': 'quarantine',
  'proj-bruno-folio-2019': 'quarantine',
  'awd-immersive-gq': 'quarantine',
  'awd-immersive-cartier': 'quarantine',
  'awd-resn-tracing': 'quarantine',
  'webby-2024-shopify': 'quarantine',
  'awd-bureau-borsche': 'dead',
  'proj-2024-gentlerain': 'dead',
  'awd-noomo': 'dead',
  'awd-tolus': 'dead',
  'awd-cupra': 'dead',
  'awd-unknown': 'dead',
  'awd-cybernauts': 'dead',
  'awd-lusion-oryzo': 'dead',
  'awd-velvet': 'dead',
  'awd-balenciaga': 'blocked',
  'extra-chanel': 'blocked',
  'awd-louisvuitton': 'blocked',
  'awd-volvo': 'blocked',
  'awd-gucci': 'blocked',
  'awd-buzzed': 'blocked',
  'css-2025-spylt': 'blocked',
  'extra-netflix': 'blocked',
};

const REDIRECTED_IDS = new Set([
  'awd-antinomy', 'awd-2025-burocratik', 'studio-complex-universe',
  'awd-2025-filip-felbar', 'prod-glossier', 'awd-haus', 'extra-hoverstats',
  'awd-instrument', 'awd-jeton', 'studio-josh-comeau', 'fwa-2024-la-petite',
  'awd-locomotive', 'prod-mixpanel', 'awd-2025-ottografie',
  'awd-2025-rejouice', 'awd-2025-somefolk', 'studio-stelo', 'prod-stripe',
  'extra-stripe-atlas', 'webby-2024-raw-materials', 'extra-codrops',
  'extra-apple-vision', 'extra-audi', 'awd-hakuhodo', 'extra-nike',
  'extra-porsche', 'extra-spotify',
]);

export function isVerifiedProject(project: UIProject | string) {
  const id = typeof project === 'string' ? project : project.id;
  return (VERIFIED_IDS.has(id) || id.startsWith('v4-')) && LINK_STATES[id] !== 'quarantine';
}

export function getLinkState(project: UIProject | string): LinkState {
  const id = typeof project === 'string' ? project : project.id;
  return LINK_STATES[id] || (REDIRECTED_IDS.has(id) ? 'redirected' : 'ok');
}

export function canOpenOriginal(project: UIProject | string) {
  const state = getLinkState(project);
  return state === 'ok' || state === 'redirected';
}

export const linkStateCopy: Record<LinkState, string> = {
  ok: '原站可访问',
  redirected: '可访问 · 已跳转至当前站点',
  blocked: '原站限制访问',
  dead: '原站已失效 · 保留采集快照',
  quarantine: '待复核 · 暂不提供复刻包',
};
