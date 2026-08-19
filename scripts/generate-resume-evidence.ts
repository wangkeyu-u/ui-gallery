import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const resumePath = process.env.RESUME_PDF ?? '/Users/wangkeyu/Downloads/123简历.pdf';
const sha = async (file: string) => createHash('sha256').update(await readFile(path.resolve(root, file))).digest('hex');
const resumeSha = createHash('sha256').update(await readFile(resumePath)).digest('hex');
const data = JSON.parse(await readFile('docs/generated/data-quality-report.json', 'utf8'));
const recon = JSON.parse(await readFile('docs/generated/reconstructions/report.json', 'utf8'));
const ssims = recon.results.map((item: { ssim: number }) => item.ssim) as number[];
const claimedMin = 0.9926, claimedMax = 0.9996;
const ssimClaimVerified = recon.results.length === 3 && ssims.every((value) => value >= claimedMin && value <= claimedMax);
const frameworkFiles = ['package.json', 'tsconfig.app.json', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx'];
const evidence = {
  schemaVersion: 1,
  source: { file: resumePath, sha256: resumeSha, page: 1, section: 'UI Gallery' },
  generatedBy: { command: 'npm run evidence:update', node: process.version },
  dataAndModels: {
    galleryData: { version: 'round2-232', file: 'preview-data.json', sha256: await sha('preview-data.json') },
    qualityRubric: { version: data.model.version, file: 'docs/quality-rubric.json', sha256: await sha('docs/quality-rubric.json') },
    reconstructionComparator: { version: recon.comparator.version, files: ['tests/reconstruction/metrics.ts','tests/reconstruction/anti-cheat.ts'], sha256: createHash('sha256').update((await Promise.all(['tests/reconstruction/metrics.ts','tests/reconstruction/anti-cheat.ts'].map((file)=>readFile(file)))).map(String).join('\n')).digest('hex') },
  },
  claims: [
    {
      id: 'ui-data-quality',
      resumeText: '独立设计并实现 UI Gallery（React、TypeScript、Vite），沉淀 232 条 UI 数据，建立质量准入体系，筛选出 155 个高质量可用参考',
      status: 'unsupported',
      assessment: `React/TypeScript/Vite and 232 unique records are verified, but rubric v${data.model.version} independently yields ${data.summary.passed}, not 155, passing references.`,
      measured: { total: data.summary.total, qualityPassed: data.summary.passed, qualityFailed: data.summary.failed, claimedQualityPassed: 155 },
      codeLocations: [...frameworkFiles, 'src/gallery-schema.ts', 'scripts/quality-lib.ts', 'docs/quality-rubric.json'],
      reproduce: ['npm run validate:data', 'npm run quality:data', 'npm run quality:data:check', 'npm run test -- --run src/quality-rubric.test.ts'],
      artifacts: ['docs/generated/data-quality-report.json', 'docs/source-audit.json'],
    },
    {
      id: 'visual-reconstruction',
      resumeText: '基于 Playwright、Pixelmatch 与 SSIM 构建无模型依赖的视觉复刻验证系统，支持尺寸、溢出、颜色、结构、边缘及反作弊检测，3 个标准演示案例达到 0.9926–0.9996 SSIM',
      status: ssimClaimVerified ? 'verified' : 'unsupported',
      assessment: ssimClaimVerified ? 'All three independently rendered cases fall inside the claimed interval and pass multidimensional and anti-cheat gates.' : 'At least one independently rendered case falls outside the claimed interval.',
      measured: { claimedRange: { min: claimedMin, max: claimedMax }, actualRange: { min: Math.min(...ssims), max: Math.max(...ssims) }, cases: recon.results.map((item: { id: string; ssim: number; pixelmatch: unknown; edgePixelmatch: unknown; color: unknown; structure: unknown; overflow: unknown; antiCheat: unknown }) => item) },
      codeLocations: ['public/reference-cases/', 'src/reconstructions/', 'tests/reconstruction.spec.ts', 'tests/reconstruction/metrics.ts', 'tests/reconstruction/anti-cheat.ts'],
      reproduce: ['npm run test', 'npm run test:reconstructions:update-evidence', 'npm run test:reconstructions:review', 'npm run test:reconstructions'],
      artifacts: ['docs/generated/reconstructions/report.json', ...recon.results.flatMap((item: { artifacts: string[] }) => item.artifacts.map((file) => `docs/generated/reconstructions/${file}`))],
    },
    {
      id: 'regression-ci-cd',
      resumeText: '搭建数据一致性检查、桌面端与移动端浏览器回归测试及 GitHub Actions CI/CD 流程，实现自动构建及全量验证',
      status: 'implemented_unverified',
      assessment: 'Data consistency, desktop/mobile tests, CI gates and a GitHub Pages deployment job are implemented and pass locally. At evidence-generation time, no GitHub-hosted execution or deployment result was available, so hosted CI/CD remains unverified.',
      measured: { localMatrix: ['desktop-chromium 1280x820', 'Pixel 7 mobile-chromium'], remoteWorkflowRun: false },
      codeLocations: ['scripts/validate-data.ts', 'tests/gallery.spec.ts', 'playwright.config.ts', '.github/workflows/ci.yml'],
      reproduce: ['npm run ci', 'npm run test:e2e'],
      artifacts: ['dist/', 'test-results/', 'playwright-report/'],
    },
  ],
};
await writeFile('docs/resume-evidence.json', `${JSON.stringify(evidence, null, 2)}\n`);
const md = `# Resume evidence\n\nSource resume: \`${resumePath}\` (SHA-256 \`${resumeSha}\`). Status values are limited to \`verified\`, \`implemented_unverified\`, and \`unsupported\`.\n\n${evidence.claims.map((claim) => `## ${claim.id} — ${claim.status}\n\n> ${claim.resumeText}\n\n${claim.assessment}\n\n- Code: ${claim.codeLocations.map((file) => `\`${file}\``).join(', ')}\n- Reproduce: ${claim.reproduce.map((command) => `\`${command}\``).join('; ')}\n- Artifacts: ${claim.artifacts.map((file) => `\`${file}\``).join(', ')}\n- Measurements: \`${JSON.stringify(claim.measured)}\`\n`).join('\n')}\n## Data and comparator versions\n\n- Gallery data \`${evidence.dataAndModels.galleryData.version}\`: \`${evidence.dataAndModels.galleryData.sha256}\`\n- Quality rubric \`${evidence.dataAndModels.qualityRubric.version}\`: \`${evidence.dataAndModels.qualityRubric.sha256}\`\n- Reconstruction comparator \`${evidence.dataAndModels.reconstructionComparator.version}\`: \`${evidence.dataAndModels.reconstructionComparator.sha256}\`\n`;
await writeFile('docs/RESUME_EVIDENCE.md', md);
console.log(JSON.stringify(evidence.claims.map(({ id, status, measured }) => ({ id, status, measured })), null, 2));
