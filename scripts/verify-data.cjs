const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const projects = require('../src/data/ui-projects.json');
const styleFamilies = require('../src/data/style-families.json');
const quality = require('../src/data/project-quality.json');
const validStatuses = new Set(['untested', 'passed', 'failed', 'needs-review']);
const styleKeys = new Set(styleFamilies.map(family => family.key));
const verifiedIds = new Set(quality.verifiedIds);
const errors = [];

function fail(message) {
  errors.push(message);
}

const projectIds = new Set();
for (const project of projects) {
  if (!project.id || projectIds.has(project.id)) fail(`项目 ID 缺失或重复: ${project.id || '(empty)'}`);
  projectIds.add(project.id);
  if (!project.name || !project.description || !project.previewImage) fail(`${project.id}: 缺少 name/description/previewImage`);
  if (!validStatuses.has(project.reproStatus)) fail(`${project.id}: 非法 reproStatus ${project.reproStatus}`);
  if (!styleKeys.has(project.styleFamily)) fail(`${project.id}: styleFamily 未在分类表声明: ${project.styleFamily}`);

  const previewPath = path.join(root, project.previewImage);
  if (!fs.existsSync(previewPath)) fail(`${project.id}: 预览图不存在 ${project.previewImage}`);

  if (project.reproStatus !== 'untested') {
    if (!project.reproReportPath) {
      fail(`${project.id}: ${project.reproStatus} 缺少 reproReportPath`);
      continue;
    }
    const reportPath = path.join(root, project.reproReportPath);
    if (!fs.existsSync(reportPath)) {
      fail(`${project.id}: 验证报告不存在 ${project.reproReportPath}`);
      continue;
    }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (report.projectId !== project.id) fail(`${project.id}: 报告 projectId 不一致`);
    if (report.status !== project.reproStatus) fail(`${project.id}: 数据状态 ${project.reproStatus} 与报告 ${report.status} 不一致`);
    if (report.validatorVersion !== project.reproValidatorVersion) fail(`${project.id}: 验证器版本不一致`);
    if (Math.abs(Number(report.ssim) - Number(project.reproScore)) > 0.001) fail(`${project.id}: reproScore 与报告 SSIM 不一致`);

    for (const file of ['reference.png', 'candidate.png', 'diff.png', 'diff-overlay.png', 'report.html']) {
      if (!fs.existsSync(path.join(path.dirname(reportPath), file))) fail(`${project.id}: 缺少验证产物 ${file}`);
    }

    if (project.reproStatus === 'passed') {
      if (Number(report.ssim) < 0.9 || Number(report.pixelDifference) > 0.12) fail(`${project.id}: passed 指标未达到阈值`);
      if (report.dimensionsMatch !== true || report.horizontalOverflow) fail(`${project.id}: passed 但尺寸或横向溢出不合格`);
      if (report.antiCheat?.identicalToReference || report.antiCheat?.singleImageCover || report.antiCheat?.referenceImageUsed) {
        fail(`${project.id}: passed 但触发反作弊`);
      }
    }
  }
}

for (const id of quality.verifiedIds) {
  if (!projectIds.has(id)) fail(`质量白名单引用不存在的项目: ${id}`);
}
for (const id of [...Object.keys(quality.linkStates), ...quality.redirectedIds]) {
  if (!projectIds.has(id)) fail(`链接状态引用不存在的项目: ${id}`);
}
for (const id of ['demo-flat', 'demo-portfolio', 'demo-dashboard']) {
  const project = projects.find(item => item.id === id);
  if (!project || project.reproStatus !== 'passed' || !verifiedIds.has(id)) fail(`${id}: 通过演示必须同时为 passed 且进入质量白名单`);
}

if (errors.length) {
  console.error(`数据一致性检查失败（${errors.length} 项）:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const accepted = projects.filter(project => (verifiedIds.has(project.id) || project.id.startsWith('v4-')) && quality.linkStates[project.id] !== 'quarantine');
console.log(`数据一致性通过：${projects.length} 条记录，${accepted.length} 条准入，${projects.filter(project => project.reproStatus === 'passed').length} 条复刻通过。`);
