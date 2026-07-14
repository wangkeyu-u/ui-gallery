import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import projectsData from '../data/ui-projects.json';
import type { UIProject, SavedTheme, ThemeDNA } from '../types';
import { usePreference } from '../hooks/usePreference';

const projects = projectsData as UIProject[];

const STORAGE_KEY = 'ui-gallery-themes';

function loadThemes(): SavedTheme[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveThemes(themes: SavedTheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export default function Themes() {
  const [themes, setThemes] = useState<SavedTheme[]>(loadThemes);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [themeName, setThemeName] = useState('');
  const { preference } = usePreference();

  useEffect(() => {
    saveThemes(themes);
  }, [themes]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const generateDNA = (project: UIProject): ThemeDNA => {
    return {
      themeName: themeName || `${project.name} 主题`,
      coreMood: project.mood.join('、') || '未指定',
      useCase: project.industry.join('、') || '通用',
      targetUser: '设计师、开发者',
      colorSystem: [
        project.colors.bg ? `背景: ${project.colors.bg}` : '',
        project.colors.accent ? `强调: ${project.colors.accent}` : '',
        project.isDark ? '暗色模式' : '浅色模式',
      ].filter(Boolean).join('，'),
      typeHierarchy: project.fontFamily || '系统默认',
      spacing: project.density === 'rich' ? '紧凑' : project.density === 'minimal' ? '宽松' : '适中',
      borderRadius: '4px (可根据参考调整)',
      borderRules: '1px solid var(--border)',
      shadowRules: 'sm / md / lg 三级',
      materialExpression: project.materials.join('、') || '标准',
      artDirection: project.styleDescription,
      pageComposition: project.layoutTraits.join('、') || '标准布局',
      componentForm: '参照原始 UI 的组件形态',
      interactionStates: project.interactions.join('、') || '标准 hover/focus',
      animationRhythm: project.animations.join('、') || '标准过渡',
      responsiveRules: '桌面优先，移动端适配',
      accessibility: 'WCAG 2.1 AA',
      forbiddenPatterns: '不使用紫色渐变、模板化 Bento、过度毛玻璃',
      references: `${project.name} (${project.originalUrl})`,
    };
  };

  const createTheme = () => {
    if (!selectedProject) return;
    const dna = generateDNA(selectedProject);
    const newTheme: SavedTheme = {
      id: `theme-${Date.now()}`,
      name: dna.themeName,
      dna,
      referenceProjectId: selectedProject.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    setThemes(prev => [...prev, newTheme]);
    setSelectedProjectId('');
    setThemeName('');
  };

  const deleteTheme = (id: string) => {
    setThemes(prev => prev.filter(t => t.id !== id));
  };

  const exportTheme = (theme: SavedTheme, format: 'json' | 'css' | 'tailwind' | 'markdown') => {
    let content = '';
    let filename = `${theme.name}.${format === 'json' ? 'json' : format === 'css' ? 'css' : format === 'tailwind' ? 'ts' : 'md'}`;

    if (format === 'json') {
      content = JSON.stringify(theme.dna, null, 2);
    } else if (format === 'css') {
      content = `:root {\n${Object.entries(theme.dna).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`;
    } else if (format === 'tailwind') {
      content = `export default {\n  theme: {\n    extend: {\n${Object.entries(theme.dna).map(([k, v]) => `      ${k}: '${v}',`).join('\n')}\n    }\n  }\n}`;
    } else {
      content = `# ${theme.name}\n\n${Object.entries(theme.dna).map(([k, v]) => `## ${k}\n${v}\n`).join('\n')}`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container theme-page">
      <div className="gallery-hero" style={{ paddingBottom: 'var(--space-md)' }}>
        <div className="gallery-hero__label">主题管理</div>
        <h1 className="gallery-hero__title" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
          我的主题
        </h1>
        <p className="gallery-hero__desc">
          从选定的参考 UI 中提取主题规范，导出为设计令牌、CSS 变量或 Tailwind 配置。
        </p>
      </div>

      {/* Create theme */}
      <section className="detail-section">
        <h2 className="detail-section__title">从参考 UI 创建主题</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', maxWidth: 600 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              参考项目
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                fontSize: 14,
              }}
            >
              <option value="">选择一个 UI 项目…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.styleFamilyNameZh}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              主题名称（可选）
            </label>
            <input
              type="text"
              value={themeName}
              onChange={e => setThemeName(e.target.value)}
              placeholder="例如：液态铬银"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                fontSize: 14,
              }}
            />
          </div>
        </div>
        {selectedProject && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={createTheme}>
              提取主题 DNA
            </button>
            <Link to={`/detail/${selectedProject.id}`} className="btn btn-secondary" style={{ marginLeft: 8 }}>
              查看参考详情
            </Link>
          </div>
        )}
      </section>

      {/* Preference summary */}
      {preference.likedProjectIds.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section__title">偏好档案</h2>
          <div className="detail-dna-grid">
            <div className="detail-dna-item">
              <div className="detail-dna-item__label">已喜欢</div>
              <div className="detail-dna-item__value">{preference.likedProjectIds.length} 个</div>
            </div>
            <div className="detail-dna-item">
              <div className="detail-dna-item__label">已排除</div>
              <div className="detail-dna-item__value">{preference.dislikedProjectIds.length} 个</div>
            </div>
            {preference.positiveKeywords.length > 0 && (
              <div className="detail-dna-item">
                <div className="detail-dna-item__label">正向关键词</div>
                <div className="detail-dna-item__value">{preference.positiveKeywords.join('、')}</div>
              </div>
            )}
            {preference.negativeKeywords.length > 0 && (
              <div className="detail-dna-item">
                <div className="detail-dna-item__label">负向关键词</div>
                <div className="detail-dna-item__value">{preference.negativeKeywords.join('、')}</div>
              </div>
            )}
            {preference.lockedDecisions.length > 0 && (
              <div className="detail-dna-item">
                <div className="detail-dna-item__label">已锁定</div>
                <div className="detail-dna-item__value">{preference.lockedDecisions.join('、')}</div>
              </div>
            )}
            {preference.rejectedPatterns.length > 0 && (
              <div className="detail-dna-item">
                <div className="detail-dna-item__label">已排斥</div>
                <div className="detail-dna-item__value">{preference.rejectedPatterns.join('、')}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Saved themes */}
      <section className="detail-section">
        <h2 className="detail-section__title">已保存主题（{themes.length}）</h2>
        {themes.length === 0 ? (
          <div className="theme-empty">
            <p>还没有保存的主题。</p>
            <Link to="/" className="btn btn-secondary">去画廊找参考</Link>
          </div>
        ) : (
          themes.map(theme => (
            <div key={theme.id} className="theme-card">
              <div className="theme-card__header">
                <div>
                  <div className="theme-card__name">{theme.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    参考来源：{projects.find(p => p.id === theme.referenceProjectId)?.name || '未知'}
                  </div>
                </div>
                <div className="theme-card__version">v{theme.version}</div>
              </div>
              <pre className="theme-card__dna">{Object.entries(theme.dna).map(([k, v]) => `${k}: ${v}`).join('\n')}</pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => exportTheme(theme, 'json')}>Design Tokens JSON</button>
                <button className="btn btn-secondary" onClick={() => exportTheme(theme, 'css')}>CSS Variables</button>
                <button className="btn btn-secondary" onClick={() => exportTheme(theme, 'tailwind')}>Tailwind Config</button>
                <button className="btn btn-secondary" onClick={() => exportTheme(theme, 'markdown')}>Markdown 规范</button>
                <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => deleteTheme(theme.id)}>删除</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
