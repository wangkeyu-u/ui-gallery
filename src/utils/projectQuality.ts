import type { UIProject } from '../types';
import qualityData from '../data/project-quality.json';

export type LinkState = 'ok' | 'redirected' | 'blocked' | 'dead' | 'quarantine';

const VERIFIED_IDS = new Set(qualityData.verifiedIds);
const LINK_STATES = qualityData.linkStates as Partial<Record<string, LinkState>>;
const REDIRECTED_IDS = new Set(qualityData.redirectedIds);

export function isVerifiedProject(project: UIProject | string) {
  const id = typeof project === 'string' ? project : project.id;
  const state = getLinkState(id);
  return (VERIFIED_IDS.has(id) || id.startsWith('v4-')) && (state === 'ok' || state === 'redirected');
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
