import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, CheckCircle, Trash } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import projectsData from '../data/ui-projects.json';
import { usePreference } from '../hooks/usePreference';
import type { SavedTheme, ThemeDNA, UIProject } from '../types';
import { isVerifiedProject } from '../utils/projectQuality';

const projects = (projectsData as UIProject[]).filter(isVerifiedProject);
const STORAGE_KEY = 'ui-gallery-themes';
const UNKNOWN = '未从参考中采集';

function loadThemes(): SavedTheme[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function validFont(value: string | null) {
  return value && value.length < 80 && !/paste|keyframe|duration|transition/i.test(value) ? value : null;
}

function extractDNA(project: UIProject, name: string): ThemeDNA {
  const colors = [
    project.colors.bg ? `背景 ${project.colors.bg}` : '',
    project.colors.accent ? `强调 ${project.colors.accent}` : '',
    project.colors.text ? `文字 ${project.colors.text}` : '',
  ].filter(Boolean);
  return {
    themeName: name.trim() || `${project.name} 拆解`,
    coreMood: project.mood.join('、') || UNKNOWN,
    useCase: project.industry.join('、') || UNKNOWN,
    targetUser: UNKNOWN,
    colorSystem: colors.join('，') || UNKNOWN,
    typeHierarchy: validFont(project.fontFamily) || UNKNOWN,
    spacing: project.density ? `仅采集到密度标注：${project.density}，未采集具体间距` : UNKNOWN,
    borderRadius: UNKNOWN,
    borderRules: UNKNOWN,
    shadowRules: UNKNOWN,
    materialExpression: project.materials.join('、') || UNKNOWN,
    artDirection: project.styleDescription || UNKNOWN,
    pageComposition: project.layoutTraits.join('、') || UNKNOWN,
    componentForm: UNKNOWN,
    interactionStates: project.interactions.join('、') || UNKNOWN,
    animationRhythm: project.animations.join('、') || UNKNOWN,
    responsiveRules: UNKNOWN,
    accessibility: UNKNOWN,
    forbiddenPatterns: UNKNOWN,
    references: `${project.name} / ${project.originalUrl}`,
  };
}

const LABELS: Record<keyof ThemeDNA, string> = {
  themeName: '主题名', coreMood: '情绪', useCase: '适用行业', targetUser: '目标用户', colorSystem: '颜色',
  typeHierarchy: '字体', spacing: '间距', borderRadius: '圆角', borderRules: '边框', shadowRules: '阴影',
  materialExpression: '材质', artDirection: '艺术方向', pageComposition: '页面构成', componentForm: '组件形态',
  interactionStates: '交互', animationRhythm: '动效', responsiveRules: '响应式', accessibility: '无障碍',
  forbiddenPatterns: '禁用项', references: '原始参考',
};

export default function Themes() {
  const [params] = useSearchParams();
  const [themes, setThemes] = useState<SavedTheme[]>(loadThemes);
  const [selectedId, setSelectedId] = useState(params.get('ref') || '');
  const [name, setName] = useState('');
  const { preference } = usePreference();
  const selected = useMemo(() => projects.find(project => project.id === selectedId), [selectedId]);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(themes)), [themes]);

  const create = () => {
    if (!selected) return;
    const dna = extractDNA(selected, name);
    const now = new Date().toISOString();
    setThemes(current => [{ id: `theme-${Date.now()}`, name: dna.themeName, dna, referenceProjectId: selected.id, createdAt: now, updatedAt: now, version: 1 }, ...current]);
    setName('');
  };

  const download = (theme: SavedTheme) => {
    const content = `# ${theme.name}\n\n${Object.entries(theme.dna).map(([key, value]) => `## ${LABELS[key as keyof ThemeDNA]}\n${value}`).join('\n\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${theme.name}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container page-shell">
      <header className="page-heading">
        <span className="eyebrow">从参考到自己的主题</span>
        <h1>只拆有证据的部分。</h1>
        <p>选一个真实 UI。颜色、材质、排版和动效只有在资料中明确存在时才会写入；不知道的地方保留“未采集”，不由系统脑补。</p>
      </header>

      <section className="theme-builder">
        <div className="theme-builder__form">
          <label htmlFor="theme-reference">参考 UI</label>
          <select id="theme-reference" value={selectedId} onChange={event => setSelectedId(event.target.value)}>
            <option value="">选择一个已收录界面</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name} / {project.styleFamilyNameZh}</option>)}
          </select>
          <label htmlFor="theme-name">给这份拆解命名</label>
          <input id="theme-name" value={name} onChange={event => setName(event.target.value)} placeholder="例如：Cupra 金属产品页" />
          <button type="button" className="primary-action" onClick={create} disabled={!selected}>保存这份拆解 <ArrowDown size={17} /></button>
          <p className="form-note"><CheckCircle size={16} /> 空白项不会自动补成常见 UI 参数。</p>
        </div>
        {selected ? (
          <div className="theme-builder__reference">
            <div className="browser-frame">
              <div className="browser-frame__bar" aria-hidden="true"><span /><span /><span /><div className="browser-frame__address">{selected.name}</div></div>
              <div className="browser-frame__viewport"><img src={`./${selected.previewImage}`} alt={`${selected.name} 参考 UI`} /></div>
            </div>
            <Link to={`/detail/${selected.id}`}>打开完整拆解 <ArrowUpRight size={16} /></Link>
          </div>
        ) : <div className="theme-builder__placeholder">选择参考后，这里会显示它的完整界面。</div>}
      </section>

      {(preference.likedProjectIds.length > 0 || preference.lockedDecisions.length > 0) && (
        <section className="preference-strip">
          <span>当前偏好</span>
          <p>喜欢 {preference.likedProjectIds.length} 个方向 / 排除 {preference.dislikedProjectIds.length} 个方向 / 锁定 {preference.lockedDecisions.length} 项决定</p>
        </section>
      )}

      <section className="saved-themes">
        <div className="section-heading"><span className="eyebrow">已保存</span><h2>{themes.length ? `${themes.length} 份主题拆解` : '还没有主题拆解'}</h2></div>
        {themes.map(theme => (
          <article className="saved-theme" key={theme.id}>
            <header><div><span>v{theme.version}</span><h3>{theme.name}</h3></div><div className="saved-theme__actions"><button onClick={() => download(theme)} aria-label={`下载 ${theme.name}`}><ArrowDown size={18} /></button><button onClick={() => setThemes(current => current.filter(item => item.id !== theme.id))} aria-label={`删除 ${theme.name}`}><Trash size={18} /></button></div></header>
            <dl>{(Object.entries(theme.dna) as [keyof ThemeDNA, string][]).filter(([key]) => key !== 'themeName').map(([key, value]) => <div key={key} className={value === UNKNOWN ? 'unknown' : ''}><dt>{LABELS[key]}</dt><dd>{value}</dd></div>)}</dl>
          </article>
        ))}
      </section>
    </main>
  );
}
