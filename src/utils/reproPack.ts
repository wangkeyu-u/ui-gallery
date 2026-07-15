/**
 * Frontend wrapper around repro-pack-common.cjs (single source of truth).
 * Generates task-package payloads for ZIP download in the detail page.
 */
import type { UIProject } from '../types';
// @ts-ignore CJS interop — repro-pack-common.cjs is pure JS, no types
import { buildBrief, buildProjectJson, buildAcceptanceJson } from '../../scripts/repro-pack-common.cjs';

export interface ReproPackageFiles {
  'reference.png': Blob;
  'brief.md': string;
  'project.json': string;
  'acceptance.json': string;
}

/** Build all text payloads for a project's replication task package. */
export function buildReproPackageTexts(project: UIProject): Pick<ReproPackageFiles, Exclude<keyof ReproPackageFiles, 'reference.png'>> {
  return {
    'brief.md': buildBrief(project as any),
    'project.json': JSON.stringify(buildProjectJson(project as any), null, 2) + '\n',
    'acceptance.json': JSON.stringify(buildAcceptanceJson(project as any), null, 2) + '\n',
  };
}

/** Download a ZIP containing the full task package. Reference image is fetched from previewImage URL. */
export async function downloadReproZip(project: UIProject): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  // text files
  const texts = buildReproPackageTexts(project);
  zip.file('brief.md', texts['brief.md']);
  zip.file('project.json', texts['project.json']);
  zip.file('acceptance.json', texts['acceptance.json']);
  // reference screenshot
  const resp = await fetch(`./${project.previewImage}`);
  if (!resp.ok) throw new Error(`无法加载截图: ${resp.status}`);
  const imgBlob = await resp.blob();
  zip.file('reference.png', imgBlob);
  // generate & trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${project.id}-repro-task.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
