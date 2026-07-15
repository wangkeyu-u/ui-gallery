import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react';
import componentsData from '../data/components.json';
import type { ComponentLibrary } from '../types';

const libraries = componentsData as ComponentLibrary[];

export default function Components() {
  const [query, setQuery] = useState('');
  const [framework, setFramework] = useState('all');
  const [visibleCount, setVisibleCount] = useState(36);
  const frameworks = [...new Set(libraries.flatMap(item => item.framework))].sort();
  const results = useMemo(() => libraries.filter(item => {
    const matchesQuery = !query || `${item.name} ${item.description} ${item.components.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (framework === 'all' || item.framework.includes(framework));
  }), [framework, query]);

  useEffect(() => setVisibleCount(36), [framework, query]);

  return (
    <main className="container page-shell">
      <header className="page-heading">
        <span className="eyebrow">第二层：落地资源</span>
        <h1>先定 UI，再拿组件。</h1>
        <p>这里不再和 UI 参考混在一起。确定完整界面方向后，再按框架和所需控件挑实现资源。</p>
      </header>
      <section className="component-toolbar">
        <label className="component-search"><MagnifyingGlass size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索组件、库或能力" aria-label="搜索组件库" /></label>
        <select value={framework} onChange={event => setFramework(event.target.value)} aria-label="按框架筛选"><option value="all">全部框架</option>{frameworks.map(item => <option key={item}>{item}</option>)}</select>
        <span>{results.length} 个资源</span>
      </section>
      <section className="component-grid">
        {results.slice(0, visibleCount).map(library => (
          <article className="component-card" key={library.id}>
            <div className="component-card__top"><span>{library.framework.join(' / ')}</span><span>{library.categoryLabel}</span></div>
            <h2>{library.name}</h2>
            <p>{library.description}</p>
            <div className="component-card__list">{library.components.slice(0, 8).map(component => <span key={component}>{component}</span>)}</div>
            <div className="component-card__links">{library.documentationUrl && <a href={library.documentationUrl} target="_blank" rel="noreferrer">文档 <ArrowUpRight size={15} /></a>}{library.repoUrl && <a href={library.repoUrl} target="_blank" rel="noreferrer">源码 <ArrowUpRight size={15} /></a>}</div>
          </article>
        ))}
      </section>
      {visibleCount < results.length && <div className="load-more"><button type="button" onClick={() => setVisibleCount(count => count + 36)}>再看 {Math.min(36, results.length - visibleCount)} 个 <ArrowRight size={17} /></button></div>}
    </main>
  );
}
