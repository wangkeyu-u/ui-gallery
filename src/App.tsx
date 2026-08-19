import { memo, useEffect, useMemo, useState } from 'react';
import { galleryItems } from './gallery-data';
import type { GalleryItem, GalleryKind } from './gallery-schema';
import { countBy, DEFAULT_FILTERS, filterItems, readStoredSelection, type Filters } from './gallery-utils';

const SELECTION_KEY = 'uihub-sel-v2';
const KIND_LABEL: Record<'all' | GalleryKind, string> = { all: '全部', item: '组件库', proj: '获奖项目' };
const FRAMEWORK_CLASS: Record<string, string> = {
  React: 'fw-react', Vue: 'fw-vue', Angular: 'fw-angular', Svelte: 'fw-svelte', Solid: 'fw-solid',
  'Web Components': 'fw-wc', CSS: 'fw-css', Multi: 'fw-multi', Qwik: 'fw-qwik',
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;opacity:0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

function FilterSelect({ label, value, values, counts, onChange }: {
  label: string;
  value: string;
  values: string[];
  counts: Record<string, number>;
  onChange: (value: string) => void;
}) {
  return (
    <label>{label}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部{label}</option>
        {values.map((entry) => <option key={entry} value={entry}>{entry} ({counts[entry]})</option>)}
      </select>
    </label>
  );
}

const GalleryCard = memo(function GalleryCard({ item, number, selected, onToggle }: {
  item: GalleryItem;
  number: number;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const project = item.kind === 'proj';
  const tags = project ? item.tech : item.chips;
  const subtitle = project
    ? [item.agency, item.year].filter(Boolean).join(' · ')
    : [item.vendor, item.theme].filter(Boolean).join(' · ');

  const copyPrompt = async () => {
    if (!item.prompt) return;
    try {
      await copyText(item.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('复制下面的提示词：', item.prompt);
    }
  };

  return (
    <article
      className={`item in${selected ? ' sel' : ''}`}
      data-id={item.id}
      aria-label={item.name}
      aria-pressed={selected}
      role="button"
      tabIndex={0}
      onClick={() => onToggle(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(item.id);
        }
      }}
    >
      <div className="frame">
        <span className={`kind${project ? ' proj' : ''}`}>{project ? '获奖' : '库'}</span>
        <span className="pick" aria-hidden="true">{selected ? '✓' : '+'}</span>
        <img src={item.img} alt="" loading={number <= 8 ? 'eager' : 'lazy'} decoding="async" />
        <span className="no">{String(number).padStart(2, '0')}</span>
      </div>
      <div className="body">
        <h3>{item.name}</h3>
        <div className="vendor">{subtitle}</div>
        {project && <div className="award">★ {item.award}</div>}
        {tags.length > 0 && <div className="chips2">{tags.slice(0, 6).map((tag) => <span className="ctag" key={tag}>{tag}</span>)}</div>}
        {item.fw.length > 0 && <div className="fw">{item.fw.map((fw) => <span className={`ftag ${FRAMEWORK_CLASS[fw] ?? 'fw-multi'}`} key={fw}>{fw}</span>)}</div>}
        {item.prompt && (
          <div className="vrow">
            {item.hifiPassed === true && <span className="vb ok">✓ 复现通过</span>}
            {item.hifiPassed === false && <span className="vb fail">✕ 未复现</span>}
            {item.hifiPassed === undefined && <span className="vb pend">· 待验证</span>}
            {item.animOk === true && <span className="vb anim">✦ 动画还原</span>}
          </div>
        )}
        <a className="open" href={item.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>打开 ↗</a>
        {item.prompt && (
          <button className={`cprompt${copied ? ' done' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); void copyPrompt(); }}>
            {copied ? '✓ 已复制' : '复制提示词 ⧉'}
          </button>
        )}
      </div>
    </article>
  );
});

function GallerySection({ number, title, note, items, selected, onToggle }: {
  number: string;
  title: string;
  note?: string;
  items: GalleryItem[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="sec">
      <div className="sec-h"><span className="sec-no">{number}</span><h2>{title}</h2><span className="sec-count">{items.length}</span></div>
      {note && <p className="sec-note">{note}</p>}
      {items.length > 0
        ? <div className="grid">{items.map((item, index) => <GalleryCard key={item.id} item={item} number={index + 1} selected={selected.has(item.id)} onToggle={onToggle} />)}</div>
        : <div className="empty">没有匹配项。</div>}
    </section>
  );
}

export function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(() => readStoredSelection(localStorage, SELECTION_KEY));
  const [showToTop, setShowToTop] = useState(false);
  const [selectionCopied, setSelectionCopied] = useState(false);

  const frameworks = useMemo(() => [...new Set(galleryItems.flatMap((item) => item.fw))].sort(), []);
  const themes = useMemo(() => [...new Set(galleryItems.map((item) => item.theme))].sort(), []);
  const frameworkCounts = useMemo(() => countBy(galleryItems.flatMap((item) => item.fw)), []);
  const themeCounts = useMemo(() => countBy(galleryItems.map((item) => item.theme)), []);
  const visible = useMemo(() => filterItems(galleryItems, filters, selected), [filters, selected]);
  const libraries = visible.filter((item) => item.kind === 'item');
  const projects = visible.filter((item) => item.kind === 'proj');

  useEffect(() => {
    const handleScroll = () => setShowToTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    localStorage.setItem(SELECTION_KEY, JSON.stringify([...next]));
    return next;
  });
  const hasFilters = filters.kind !== 'all' || !!filters.framework || !!filters.theme || filters.onlySelected;
  const context = [
    filters.kind !== 'all' && `类型=${KIND_LABEL[filters.kind]}`,
    filters.framework && `框架=${filters.framework}`,
    filters.theme && `主题=${filters.theme}`,
    filters.onlySelected && '仅看已选',
  ].filter(Boolean).join(' · ');

  const copySelection = async () => {
    const text = galleryItems.filter((item) => selected.has(item.id)).map((item) => `${item.name} — ${item.link}`).join('\n');
    try {
      await copyText(text);
      setSelectionCopied(true);
      window.setTimeout(() => setSelectionCopied(false), 1500);
    } catch {
      window.prompt('复制下面的链接：', text);
    }
  };

  return (
    <>
      <main className="wrap">
        <header className="masthead">
          <div className="kicker">Curated Index · 2024—2026</div>
          <h1 className="mast">UI <em>Gallery</em></h1>
          <p className="dek">一个收录主流组件库 / 设计系统与世界级获奖网站的策展式索引。点击收藏，离线可用，运行时零外部调用。</p>
          <div className="colophon" aria-label="画廊统计">
            {[
              [galleryItems.length, '索引项'],
              [galleryItems.filter((item) => item.kind === 'item').length, '组件库'],
              [galleryItems.filter((item) => item.kind === 'proj').length, '获奖项目'],
              [frameworks.length, '框架生态'],
              [themes.length, '主题'],
            ].map(([value, label]) => <div className="col" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
        </header>

        <nav className="controls" aria-label="画廊筛选">
          <div className="controls-in">
            <div className="seg">
              {(['all', 'item', 'proj'] as const).map((kind) => (
                <button key={kind} type="button" className={filters.kind === kind ? 'active' : ''} aria-pressed={filters.kind === kind} onClick={() => updateFilter('kind', kind)}>{KIND_LABEL[kind]}</button>
              ))}
            </div>
            <div className="filters">
              <FilterSelect label="框架" value={filters.framework} values={frameworks} counts={frameworkCounts} onChange={(value) => updateFilter('framework', value)} />
              <FilterSelect label="主题" value={filters.theme} values={themes} counts={themeCounts} onChange={(value) => updateFilter('theme', value)} />
            </div>
          </div>
        </nav>

        <div className="ctxbar">
          <div className="lbl">{context && <>{context} ｜ </>}命中 <b data-testid="visible-count">{visible.length}</b> 项</div>
          {hasFilters && <button className="clear" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>清除筛选</button>}
        </div>

        {filters.kind === 'all' ? (
          <>
            <GallerySection number="01" title="组件库与设计系统" note="复制即用 · 覆盖 React / Vue / Angular / Svelte / Solid / Web Components / CSS / 大厂设计系统" items={libraries} selected={selected} onToggle={toggle} />
            <GallerySection number="02" title="世界级获奖项目" note="Awwwards / FWA / CSSDA 等获奖网站，含可运行源码与真实预览" items={projects} selected={selected} onToggle={toggle} />
          </>
        ) : (
          <GallerySection number="·" title={filters.kind === 'proj' ? '获奖项目' : '组件库'} items={filters.kind === 'proj' ? projects : libraries} selected={selected} onToggle={toggle} />
        )}
        <footer>共 <b>{galleryItems.length}</b> 项 · React + TypeScript 数据驱动画廊</footer>
      </main>

      {selected.size > 0 && (
        <aside className="bar on" aria-label="已选项目操作">
          <span className="cnt">已选 <b>{selected.size}</b></span>
          <button type="button" onClick={() => void copySelection()}>{selectionCopied ? '✓ 已复制' : '复制已选'}</button>
          <button className="ghost" type="button" aria-pressed={filters.onlySelected} onClick={() => updateFilter('onlySelected', !filters.onlySelected)}>仅看已选</button>
          <button className="ghost" type="button" onClick={() => { setSelected(new Set()); localStorage.removeItem(SELECTION_KEY); }}>清空</button>
        </aside>
      )}
      <button className={`totop${showToTop ? ' on' : ''}`} type="button" aria-label="回到顶部" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
    </>
  );
}
