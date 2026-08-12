import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { ssim } from 'ssim.js';

export interface DomSnapshot {
  width: number;
  height: number;
  scrollWidth: number;
  scrollHeight: number;
  elementCount: number;
  maxDepth: number;
  tags: Record<string, number>;
  images: number;
  canvases: number;
  backgroundImages: string[];
}

export function compareImages(referenceBytes: Buffer, candidateBytes: Buffer) {
  const reference = PNG.sync.read(referenceBytes);
  const candidate = PNG.sync.read(candidateBytes);
  if (reference.width !== candidate.width || reference.height !== candidate.height) throw new Error('Screenshot dimensions differ');
  const diff = new PNG({ width: reference.width, height: reference.height });
  const pixelDiffCount = pixelmatch(reference.data, candidate.data, diff.data, reference.width, reference.height, { threshold: 0.1 });
  const refEdge = edgeMap(reference);
  const candidateEdge = edgeMap(candidate);
  const edgeDiff = new PNG({ width: reference.width, height: reference.height });
  const edgeDiffCount = pixelmatch(refEdge.data, candidateEdge.data, edgeDiff.data, reference.width, reference.height, { threshold: 0 });
  const similarity = ssim(
    { data: new Uint8ClampedArray(reference.data), width: reference.width, height: reference.height },
    { data: new Uint8ClampedArray(candidate.data), width: candidate.width, height: candidate.height },
  ).mssim;
  const refPalette = palette(reference);
  const candidatePalette = palette(candidate);
  return {
    width: reference.width,
    height: reference.height,
    pixelDiffCount,
    pixelDiffRatio: pixelDiffCount / (reference.width * reference.height),
    ssim: similarity,
    edgeDiffCount,
    edgeDiffRatio: edgeDiffCount / (reference.width * reference.height),
    color: {
      referenceDominant: refPalette,
      candidateDominant: candidatePalette,
      dominantMeanDelta: dominantMeanDelta(refPalette, candidatePalette),
    },
    diffPng: PNG.sync.write(diff),
    edgeDiffPng: PNG.sync.write(edgeDiff),
  };
}

export function compareStructure(reference: DomSnapshot, candidate: DomSnapshot) {
  const tags = new Set([...Object.keys(reference.tags), ...Object.keys(candidate.tags)]);
  let dot = 0, refNorm = 0, candidateNorm = 0;
  for (const tag of tags) {
    const a = reference.tags[tag] ?? 0, b = candidate.tags[tag] ?? 0;
    dot += a * b; refNorm += a * a; candidateNorm += b * b;
  }
  return {
    tagCosineSimilarity: dot / (Math.sqrt(refNorm) * Math.sqrt(candidateNorm)),
    elementCountDelta: Math.abs(reference.elementCount - candidate.elementCount),
    maxDepthDelta: Math.abs(reference.maxDepth - candidate.maxDepth),
  };
}

function edgeMap(input: PNG) {
  const output = new PNG({ width: input.width, height: input.height });
  const gray = (x: number, y: number) => {
    const index = (y * input.width + x) * 4;
    return input.data[index] * .299 + input.data[index + 1] * .587 + input.data[index + 2] * .114;
  };
  for (let y = 1; y < input.height - 1; y++) for (let x = 1; x < input.width - 1; x++) {
    const gx = -gray(x-1,y-1)+gray(x+1,y-1)-2*gray(x-1,y)+2*gray(x+1,y)-gray(x-1,y+1)+gray(x+1,y+1);
    const gy = -gray(x-1,y-1)-2*gray(x,y-1)-gray(x+1,y-1)+gray(x-1,y+1)+2*gray(x,y+1)+gray(x+1,y+1);
    const value = Math.hypot(gx, gy) > 80 ? 255 : 0;
    const index = (y * input.width + x) * 4;
    output.data[index] = output.data[index+1] = output.data[index+2] = value; output.data[index+3] = 255;
  }
  return output;
}

function palette(input: PNG) {
  const bins = new Map<string, number>();
  for (let i = 0; i < input.data.length; i += 16) {
    const r = Math.round(input.data[i] / 32) * 32;
    const g = Math.round(input.data[i+1] / 32) * 32;
    const b = Math.round(input.data[i+2] / 32) * 32;
    const key = `${Math.min(r,255)},${Math.min(g,255)},${Math.min(b,255)}`;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }
  return [...bins.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([rgb,count])=>({rgb:rgb.split(',').map(Number),share:count/[...bins.values()].reduce((a,b)=>a+b,0)}));
}

function dominantMeanDelta(a: ReturnType<typeof palette>, b: ReturnType<typeof palette>) {
  const mean = (p: ReturnType<typeof palette>) => p.reduce((out,x)=>out.map((v,i)=>v+x.rgb[i]*x.share),[0,0,0]);
  const x=mean(a), y=mean(b); return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);
}
