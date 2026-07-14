import { useState, useMemo } from 'react';
import componentsData from '../data/components.json';
import type { ComponentLibrary } from '../types';

const allComponents = componentsData as ComponentLibrary[];

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'material', label: 'Material' },
  { key: 'bootstrap', label: 'Bootstrap' },
  { key: 'tailwind', label: 'Tailwind' },
  { key: 'radix-tailwind', label: 'Radix + Tailwind' },
  { key: 'headless', label: 'Headless / 无样式' },
  { key: 'enterprise', label: '企业级' },
  { key: 'design-system', label: '设计系统' },
  { key: 'other', label: '其他' },
];

const FRAMEWORKS = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Web Components', 'CSS', 'Multi', 'Qwik'];

export default function Components() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFramework, setActiveFramework] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    let list = allComponents;

    if (activeCategory !== 'all') {
      list = list.filter(c => c.category === activeCategory);
    }

    if (activeFramework !== 'all') {
      list = list.filter(c =>
        c.framework.some(fw => fw === activeFramework || fw.includes(activeFramework))
      );
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      list = list.filter(c =>
        c.searchText.includes(lower) ||
        c.name.toLowerCase().includes(lower)
      );
    }

    return list;
  }, [activeCategory, activeFramework, searchText]);

  return (
    <div className="container components-page">
      <div className="gallery-hero" style={{ paddingBottom: 'var(--space-md)' }}>
        <div className="gallery-hero__label">开发资源</div>
        <h1 className="gallery-hero__title" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
          组件库索引
        </h1>
        <p className="gallery-hero__desc">
          {allComponents.length} 个组件库，按框架和风格分类。这些是开发资源，不是视觉灵感。
        </p>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-md)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`filter-chip ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <button
          className={`filter-chip ${activeFramework === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFramework('all')}
        >
          全部框架
        </button>
        {FRAMEWORKS.map(fw => (
          <button
            key={fw}
            className={`filter-chip ${activeFramework === fw ? 'active' : ''}`}
            onClick={() => setActiveFramework(fw)}
          >
            {fw}
          </button>
        ))}
        <input
          type="text"
          placeholder="搜索组件…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            marginLeft: 'auto',
            width: 200,
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            fontSize: 13,
          }}
        />
      </div>

      <span className="filter-bar__count" style={{ display: 'block', marginBottom: 'var(--space-md)' }}>
        {filtered.length} / {allComponents.length} 个组件库
      </span>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="components-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>框架</th>
              <th>分类</th>
              <th>组件</th>
              <th>开源</th>
              <th>文档</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(comp => (
              <tr key={comp.id}>
                <td className="components-table__name">{comp.name}</td>
                <td>
                  {comp.framework.map(fw => (
                    <span key={fw} className="components-table__fw" style={{ marginRight: 4 }}>
                      {fw}
                    </span>
                  ))}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {comp.categoryLabel}
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {comp.components.slice(0, 5).join(', ')}
                  {comp.components.length > 5 && ` +${comp.components.length - 5}`}
                </td>
                <td>
                  {comp.repoUrl ? (
                    <a href={comp.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>
                      GitHub ↗
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  <a href={comp.documentationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>
                    访问 ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="site-footer" style={{ marginTop: 'var(--space-2xl)' }}>
        <p>组件库资源 · {allComponents.length} 项 · 按框架和分类索引</p>
      </footer>
    </div>
  );
}
