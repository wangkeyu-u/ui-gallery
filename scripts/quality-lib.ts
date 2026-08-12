import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

export interface QualityItem {
  id: string;
  name: string;
  kind: 'item' | 'proj';
  link: string;
  img: string;
  theme: string;
  vendor: string;
  fw: string[];
  repo?: string;
  license?: string;
  chips?: string[];
  agency?: string;
  award?: string;
  year?: number;
  tech?: string[];
}

export interface QualityAssessment {
  id: string;
  passed: boolean;
  reasons: string[];
  checks: Record<string, boolean>;
  asset: { path: string; sha256: string | null; width: number | null; height: number | null };
}

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

export async function assessQuality(items: QualityItem[], root: string) {
  const idCounts = count(items.map((item) => item.id));
  const linkCounts = count(items.map((item) => item.link));
  const assets = await Promise.all(items.map(async (item) => {
    const absolute = path.resolve(root, item.img);
    try {
      await access(absolute);
      const bytes = await readFile(absolute);
      const png = PNG.sync.read(bytes);
      return { path: item.img, sha256: sha256(bytes), width: png.width, height: png.height };
    } catch {
      return { path: item.img, sha256: null, width: null, height: null };
    }
  }));
  const assetCounts = count(assets.map((asset) => asset.sha256).filter((hash): hash is string => !!hash));

  return items.map<QualityAssessment>((item, index) => {
    const asset = assets[index];
    const tags = item.kind === 'item' ? item.chips : item.tech;
    const sourceAndRights = item.kind === 'item'
      ? !!item.repo && /^https?:\/\//.test(item.repo) && !!item.license
      : !!item.agency && !!item.award && Number.isInteger(item.year) && /^https?:\/\//.test(item.link);
    const completeMetadata = !!item.name && !!item.theme && !!item.vendor && Array.isArray(tags) && tags.length > 0 &&
      (item.kind === 'item' ? Array.isArray(item.fw) : !!item.agency && !!item.award && !!item.year);
    const checks = {
      asset_exists: asset.sha256 !== null,
      readable_dimensions: asset.width !== null && asset.height !== null && asset.width >= 480 && asset.height >= 300,
      source_and_rights: sourceAndRights,
      unique_id: idCounts[item.id] === 1,
      unique_link: linkCounts[item.link] === 1,
      unique_asset: asset.sha256 !== null && assetCounts[asset.sha256] === 1,
      complete_metadata: completeMetadata,
      usable_target: /^https?:\/\//.test(item.link) && Array.isArray(tags) && tags.length > 0,
    };
    const reasons = Object.entries(checks).filter(([, passed]) => !passed).map(([gate]) => gate);
    return { id: item.id, passed: reasons.length === 0, reasons, checks, asset };
  });
}

export async function buildQualityReport(items: QualityItem[], root: string, rubric: unknown, dataBytes: Buffer) {
  const assessments = await assessQuality(items, root);
  return {
    schemaVersion: 1,
    model: {
      id: 'ui-gallery-quality-rubric',
      version: '2.0.0',
      rubricSha256: sha256(JSON.stringify(rubric)),
      dataSha256: sha256(dataBytes),
    },
    summary: {
      total: assessments.length,
      passed: assessments.filter((item) => item.passed).length,
      failed: assessments.filter((item) => !item.passed).length,
      passRate: assessments.filter((item) => item.passed).length / assessments.length,
      failureReasons: Object.entries(count(assessments.flatMap((item) => item.reasons))).sort(([a], [b]) => a.localeCompare(b)),
    },
    items: assessments,
  };
}

function count(values: string[]) {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}
