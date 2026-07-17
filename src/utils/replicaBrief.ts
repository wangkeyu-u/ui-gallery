import type { UIProject } from '../types';
// @ts-ignore Shared ESM module keeps copied prompt and ZIP brief on one source of truth
import { buildModelPrompt } from '../../scripts/repro-pack-common.mjs';

export function buildReplicaBrief(project: UIProject) {
  return buildModelPrompt(project as any);
}
