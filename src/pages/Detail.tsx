import { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChartBar, Check, CheckCircle, Copy, DownloadSimple, Eye, FileImage, Heart, ThumbsDown, ThumbsUp, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router-dom';
import GalleryCard from '../components/GalleryCard';
import componentsData from '../data/components.json';
import projectsData from '../data/ui-projects.json';
import { useFavorites } from '../hooks/useFavorites';
import { usePreference } from '../hooks/usePreference';
import type { ComponentLibrary, UIProject, ReproStatus } from '../types';
import { findSimilar, getAdjacentDirections } from '../utils/search';
import { buildReplicaBrief } from '../utils/replicaBrief';
import { downloadReproZip } from '../utils/reproPack';
import { canOpenOriginal, getLinkState, isVerifiedProject, linkStateCopy } from '../utils/projectQuality';

const projects = projectsData as UIProject[];
const libraries = componentsData as ComponentLibrary[];
const UNKNOWN = '未采集';

function validFont(value: string | null) {
  return value && value.length < 80 && !/paste|keyframe|duration|transition/i.test(value) ? value : null;
}

/** Build artifact URL prefix for a validated project. */
function valBase(id: string) {
  return `./repro/${id}/validation`;
}

const STATUS_LABEL: Record<ReproStatus, string> = {
  untested: '复刻未验证',
  passed: '复刻已验证',
  failed: '未通过验证',
  'needs-review': '需人工复核',
};

const STATUS_CLASS: Record<ReproStatus, string> = {
  untested: 'repro-badge--untested',
  passed: 'repro-badge--passed',
  failed: 'repro-badge--failed',
  'needs-review': 'repro-badge--review',
};

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find(item => item.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { preference, likeProject, dislikeProject } = usePreference();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  const relatedComponents = useMemo(() => project ? libraries.filter(item => item.styleFamily === project.styleFamily).slice(0, 4) : [], [project]);
  const reportProjectId = project?.id;
  const hasValidationArtifacts = !!project && project.reproStatus !== 'untested' && !!project.reproReportPath;

  useEffect(() => {
    if (!hasValidationArtifacts || !reportProjectId) {
      setReportData(null);
      return;
    }

    const controller = new AbortController();
    fetch(`${valBase(reportProjectId)}/report.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`验证报告加载失败: ${response.status}`);
        return response.json();
      })
      .then(setReportData)
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setReportData(null);
      });
    return () => controller.abort();
  }, [hasValidationArtifacts, reportProjectId]);

  if (!project) return <main className="container page-shell"><Link className="back-link" to="/"><ArrowLeft size={16} /> 返回画廊</Link><div className="empty-state"><h1>没有找到这个 UI</h1><Link to="/">重新浏览</Link></div></main>;

  const liked = preference.likedProjectIds.includes(project.id);
  const disliked = preference.dislikedProjectIds.includes(project.id);
  const favorite = isFavorite(project.id);
  const similar = findSimilar(project.id).filter(isVerifiedProject).slice(0, 4);
  const adjacent = getAdjacentDirections(project.id).filter(isVerifiedProject).slice(0, 4);
  const linkState = getLinkState(project);
  const verified = isVerifiedProject(project);
  const replicaBrief = buildReplicaBrief(project);
  const evidence = [
    ['风格家族', project.styleFamilyNameZh],
    ['情绪', project.mood.join('、') || UNKNOWN],
    ['材质', project.materials.join('、') || UNKNOWN],
    ['行业', project.industry.join('、') || UNKNOWN],
    ['明暗', project.isDark ? '暗色' : '浅色'],
    ['内容密度', project.density || UNKNOWN],
    ['字体', validFont(project.fontFamily) || UNKNOWN],
    ['颜色', [project.colors.bg, project.colors.accent, project.colors.text].filter(Boolean).join('、') || UNKNOWN],
    ['布局', project.layoutTraits.join('、') || UNKNOWN],
    ['交互', project.interactions.join('、') || UNKNOWN],
    ['动效', project.animations.join('、') || UNKNOWN],
  ];
  const coverage = evidence.filter(([, value]) => value !== UNKNOWN).length;
  const rs = project.reproStatus;
  const activeReportData = reportData?.projectId === project.id ? reportData : null;

  const copyReference = async () => {
    await navigator.clipboard.writeText(replicaBrief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleExportPack = async () => {
    setExportError(null);
    setExporting(true);
    try {
      await downloadReproZip(project);
    } catch (e) {
      setExportError((e as Error).message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="container detail-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> 返回画廊</Link>

      <section className="detail-lead">
        <div className="detail-lead__copy">
          <span className="eyebrow">{project.projectType === 'award' ? '获奖 UI' : project.source} / {project.styleFamilyNameZh}</span>
          <h1>{project.name}</h1>
          <p>{project.description || project.styleDescription}</p>
          <div className="detail-actions">
            <button className="primary-action" type="button" onClick={copyReference}><Copy size={17} /> {copied ? '已复制复刻任务' : '复制复刻任务'}</button>
            <a className="secondary-action" href={`./${project.previewImage}`} download><DownloadSimple size={17} /> 下载参考截图</a>
            {project.originalUrl && canOpenOriginal(project) && <a className="secondary-action" href={project.originalUrl} target="_blank" rel="noreferrer">查看原站 <ArrowUpRight size={17} /></a>}
          </div>
          <p className={`link-state link-state--${linkState}`}>{linkStateCopy[linkState]}</p>
          <div className="preference-actions" aria-label="记录偏好">
            <button type="button" className={liked ? 'active' : ''} onClick={() => likeProject(project.id)}><ThumbsUp size={17} weight={liked ? 'fill' : 'regular'} /> 接近预期</button>
            <button type="button" className={disliked ? 'active' : ''} onClick={() => dislikeProject(project.id)}><ThumbsDown size={17} weight={disliked ? 'fill' : 'regular'} /> 不是这个味道</button>
            <button type="button" className={favorite ? 'active' : ''} onClick={() => toggleFavorite(project.id)}><Heart size={17} weight={favorite ? 'fill' : 'regular'} /> {favorite ? '已收藏' : '收藏'}</button>
          </div>
        </div>
        <div className="browser-frame detail-browser">
          <div className="browser-frame__bar" aria-hidden="true"><span /><span /><span /><div className="browser-frame__address">{project.originalUrl || project.name}</div></div>
          <div className="browser-frame__viewport"><img src={`./${project.previewImage}`} alt={`${project.name} UI 全貌`} /></div>
        </div>
      </section>

      <section className="detail-evidence">
        <div className="section-heading">
          <span className="eyebrow">忠实拆解</span>
          <h2>当前能确认 {coverage} / {evidence.length} 项</h2>
          <p>"未采集"表示资料中没有可靠数值，不会用常见值补齐。</p>
        </div>
        <dl className="evidence-grid">
          {evidence.map(([label, value]) => <div key={label} className={value === UNKNOWN ? 'unknown' : ''}><dt>{label}</dt><dd>{value}</dd>{value === UNKNOWN ? <WarningCircle size={16} /> : <Check size={16} />}</div>)}
        </dl>
      </section>

      <section className="replica-pack">
        <div className="replica-pack__heading"><div><span className="eyebrow">截图驱动复刻包</span><h2>文字负责约束，截图负责长相。</h2></div><p><WarningCircle size={16} /> 单靠文字无法生成一样的页面。请把下载的截图和下面任务一起交给支持看图的模型。</p></div>
        <pre>{verified ? replicaBrief : '这个条目的参考图或原链接仍待复核，暂不提供生成任务。'}</pre>
        {verified && <div className="replica-pack__actions"><button type="button" className="primary-action" onClick={copyReference}><Copy size={17} /> {copied ? '已复制' : '复制完整任务'}</button><a className="secondary-action" href={`./${project.previewImage}`} download><DownloadSimple size={17} /> 下载 1280 × 820 截图</a></div>}
      </section>

      {/* ====== 复刻验证状态（模型无关，本地视觉验证） ====== */}
      <section className="repro-status">
        <div className="section-heading">
          <span className="eyebrow">本地视觉验证</span>
          <h2>与具体 AI 模型无关的还原度检验。</h2>
        </div>

        {/* 状态徽标 + 说明 */}
        <div className="repro-status__row">
          <div className="repro-status__left">
            <span className={`repro-badge ${STATUS_CLASS[rs]}`}>
              {rs === 'passed' ? <CheckCircle size={18} weight="bold" />
               : rs === 'failed' ? <XCircle size={18} weight="bold" />
               : rs === 'needs-review' ? <Eye size={18} weight="bold" />
               : <WarningCircle size={18} />}
              {' '}{STATUS_LABEL[rs]}
            </span>
            <span className="repro-screenshot-note">{verified ? '截图已验收' : '截图未验收'}</span>
          </div>
          <div className="repro-status__right">
            {verified && (
              <button type="button" className="primary-action" onClick={handleExportPack} disabled={exporting}>
                <DownloadSimple size={17} /> {exporting ? '正在打包…' : '导出复刻包（ZIP）'}
              </button>
            )}
            {hasValidationArtifacts && (
              <>
                <a className="secondary-action" href={`${valBase(project.id)}/report.html`} target="_blank" rel="noreferrer"><ChartBar size={17} /> 查看验证报告</a>
                <a className="secondary-action" href={`${valBase(project.id)}/reference.png`} download><FileImage size={17} /> 参考截图</a>
                <a className="secondary-action" href={`${valBase(project.id)}/candidate.png`} download><FileImage size={17} /> 候选截图</a>
                <a className="secondary-action" href={`${valBase(project.id)}/diff.png`} download><FileImage size={17} /> 下载差异图</a>
              </>
            )}
          </div>
        </div>

        {/* 验证结果详情（仅当已执行过验证时显示） */}
        {hasValidationArtifacts && (
          <div className="repro-results">
            {/* 原始指标（全部保留，不用单一综合分数掩盖问题） */}
            {activeReportData && (
              <dl className="repro-metrics">
                <div className="repro-metric-item">
                  <dt>验证时间</dt><dd>{new Date(String(activeReportData.validatedAt || project.reproValidatedAt)).toLocaleString('zh-CN')}</dd>
                </div>
                <div className="repro-metric-item">
                  <dt>SSIM（感知相似度）</dt>
                  <dd className={(activeReportData.ssim as number ?? project.reproScore ?? 0) >= 0.9 ? 'metric-good' : (activeReportData.ssim as number ?? project.reproScore ?? 0) >= 0.6 ? 'metric-warn' : 'metric-bad'}>
                    {(Number(activeReportData.ssim || project.reproScore || 0)).toFixed(4)}
                  </dd>
                </div>
                <div className="repro-metric-item">
                  <dt>像素差异比例</dt>
                  <dd className={Number(activeReportData.pixelDifference || 0) <= 0.12 ? 'metric-good' : Number(activeReportData.pixelDifference || 0) <= 0.4 ? 'metric-warn' : 'metric-bad'}>
                    {(Number(activeReportData.pixelDifference || 0) * 100).toFixed(2)}%
                  </dd>
                </div>
                <div className="repro-metric-item">
                  <dt>主要颜色差异</dt><dd>{Number(activeReportData.colorDifference || 0).toFixed(4)}</dd>
                </div>
                <div className="repro-metric-item">
                  <dt>结构差异（分块均值）</dt><dd>{Number(activeReportData.structuralDifference || 0).toFixed(4)}</dd>
                </div>
                {typeof activeReportData.edgeDifference === 'number' && (
                  <div className="repro-metric-item">
                    <dt>边缘密度差异</dt><dd>{activeReportData.edgeDifference.toFixed(4)}</dd>
                  </div>
                )}
                <div className="repro-metric-item">
                  <dt>横向溢出</dt>
                  <dd className={activeReportData.horizontalOverflow ? 'metric-bad' : 'metric-good'}>
                    {activeReportData.horizontalOverflow ? `${activeReportData.overflowPixels || 0}px ✗` : '无 ✓'}
                  </dd>
                </div>
                <div className="repro-metric-item">
                  <dt>画布尺寸</dt>
                  <dd className={activeReportData.dimensionsMatch !== false ? 'metric-good' : 'metric-bad'}>
                    {activeReportData.dimensionsMatch === false ? '非 1280×820 ✗' : '1280 × 820 ✓'}
                  </dd>
                </div>
                {Array.isArray(activeReportData.notes) && activeReportData.notes.length > 0 && (
                  <div className="repro-metric-item" style={{ gridColumn: '1 / -1' }}>
                    <dt>备注</dt><dd><ul>{(activeReportData.notes as string[]).map((n, i) => <li key={i}>{n}</li>)}</ul></dd>
                  </div>
                )}
                {Array.isArray(project.reproLimitations) && project.reproLimitations.length > 0 && (
                  <div className="repro-metric-item" style={{ gridColumn: '1 / -1' }}>
                    <dt>限制项</dt><dd><ul>{project.reproLimitations.map((l, i) => <li key={i}>{l}</li>)}</ul></dd>
                  </div>
                )}
              </dl>
            )}

            {/* 内联差异图预览 */}
            <div className="repro-diff-preview">
              <h3 style={{ fontSize: 14, color: 'var(--faint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>视觉对比</h3>
              <div className="repro-diff-grid">
                <figure><img src={`${valBase(project.id)}/reference.png`} alt="参考" /><figcaption>参考 reference.png</figcaption></figure>
                <figure><img src={`${valBase(project.id)}/candidate.png`} alt="候选" /><figcaption>候选 candidate.png</figcaption></figure>
                <figure><img src={`${valBase(project.id)}/diff.png`} alt="差异" /><figcaption>差异 diff.png</figcaption></figure>
                <figure><img src={`${valBase(project.id)}/diff-overlay.png`} alt="叠加" /><figcaption>差异叠加（红=不同）</figcaption></figure>
              </div>
            </div>

            <p className="repro-report-hint">
              完整报告包含所有原始指标与通过规则。
              报告路径：<code>{project.reproReportPath || valBase(project.id)}</code>
            </p>
          </div>
        )}

        {/* 未验证时的说明 */}
        {rs === 'untested' && (
          <div className="repro-untested-info">
            <p><WarningCircle size={16} /> "截图已验收"仅表示参考快照可用且符合质量标准。</p>
            <p>"复刻未验证"表示尚未对任何候选实现执行本地视觉比对。要开始：</p>
            <ol>
              <li>点击「导出复刻包」获取 ZIP（含 reference.png + 任务说明）。</li>
              <li>将任务包交给任意支持看图的 AI，拿到 HTML/CSS/React 代码。</li>
              <li>运行 <code>npm run repro:validate -- --id {id} --candidate &lt;路径&gt;</code> 获取验证结果。</li>
            </ol>
          </div>
        )}

        {/* 导出错误提示 */}
        {exportError && <p className="repro-error">{exportError}</p>}
      </section>

      {relatedComponents.length > 0 && (
        <section className="detail-components">
          <div className="section-heading"><span className="eyebrow">可选实现资源</span><h2>这个 UI 方向可从这些组件库开始。</h2></div>
          <div className="detail-component-grid">{relatedComponents.map(library => <article key={library.id}><span>{library.framework.join(' / ')}</span><h3>{library.name}</h3><p>{library.components.slice(0, 6).join('、')}</p>{library.documentationUrl && <a href={library.documentationUrl} target="_blank" rel="noreferrer">查看文档 <ArrowUpRight size={15} /></a>}</article>)}</div>
          <Link className="text-link" to="/components">浏览全部组件资源 <ArrowUpRight size={16} /></Link>
        </section>
      )}

      <section className="related-section">
        <div className="section-heading"><span className="eyebrow">继续比较</span><h2>相似的，和刻意不同的。</h2></div>
        <div className="archive-grid archive-grid--compact">{[...similar.slice(0, 2), ...adjacent.slice(0, 2)].map(item => <GalleryCard key={item.id} project={item} />)}</div>
      </section>
    </main>
  );
}
