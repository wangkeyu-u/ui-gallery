import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import projectsData from '../data/ui-projects.json';
import styleFamiliesData from '../data/style-families.json';
import type { UIProject, StyleFamily, SearchResult } from '../types';
import SearchBar from '../components/SearchBar';
import GalleryCard from '../components/GalleryCard';
import ChatPanel from '../components/ChatPanel';
import { search, getAdjacentDirections } from '../utils/search';

const projects = projectsData as UIProject[];
const styleFamilies = styleFamiliesData as StyleFamily[];

// Curated first-screen selection — most visually distinct projects
const FEATURED_IDS = [
  'awd-immersive-cartier',
  'awd-cuberto',
  'proj-bruno-folio-2025',
  'awd-cupra',
  'awd-apple',
  'awd-louisvuitton',
  'proj-2023-obys',
  'awd-activetheory',
  'awd-locomotive',
  'awd-fashionawards',
  'awd-verve',
  'awd-volvo',
];

export default function Gallery() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchExplanation, setSearchExplanation] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Run search when query param changes
  useEffect(() => {
    if (queryParam) {
      const { results, explanation } = search(queryParam);
      setSearchResults(results);
      setSearchExplanation(explanation);
    } else {
      setSearchResults(null);
      setSearchExplanation('');
    }
  }, [queryParam]);

  // Get display projects
  const displayProjects = useMemo(() => {
    if (searchResults) {
      return searchResults.map(r => r.project);
    }

    let list = projects;

    // Apply style family filter
    if (activeFilter !== 'all') {
      list = list.filter(p => p.styleFamily === activeFilter);
    }

    // If no filter, show curated selection first, then the rest
    if (activeFilter === 'all') {
      const featured = FEATURED_IDS
        .map(id => list.find(p => p.id === id))
        .filter(Boolean) as UIProject[];
      const rest = list.filter(p => !FEATURED_IDS.includes(p.id));
      return [...featured, ...rest];
    }

    return list;
  }, [searchResults, activeFilter]);

  // Get style families that actually have projects
  const availableFamilies = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.styleFamily] = (counts[p.styleFamily] || 0) + 1;
    });
    return styleFamilies.filter(f => (counts[f.key] || 0) > 0);
  }, []);

  // Adjacent directions for no-results
  const adjacentDirs = useMemo(() => {
    if (searchResults && searchResults.length === 0) {
      // Pick a random project to find adjacent directions
      const random = projects[Math.floor(Math.random() * projects.length)];
      return getAdjacentDirections(random.id);
    }
    return [];
  }, [searchResults]);

  return (
    <div className="container">
      {/* Hero — Locomotive style: centered, massive serif, minimal */}
      <section className="gallery-hero">
        <div className="gallery-hero__label">UI 发现引擎</div>
        <h1 className="gallery-hero__title">
          UI Gallery
        </h1>
        <p className="gallery-hero__desc">
          {projects.length} 个精选方向。用自然语言描述你想要的，不用懂设计术语。
        </p>
        <div className="gallery-hero__search">
          <SearchBar />
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowChat(!showChat)}
            style={{ fontSize: 13 }}
          >
            {showChat ? '收起 AI 对话' : '与 AI 设计总监对话 →'}
          </button>
        </div>
      </section>

      {/* AI Chat Panel — collapsible */}
      {showChat && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <ChatPanel />
        </section>
      )}

      {/* Search results or gallery */}
      {searchResults ? (
        <section className="search-results">
          <div className="search-results__header">
            <h2 className="search-results__query">「{queryParam}」</h2>
            <p
              className="search-results__explanation"
              dangerouslySetInnerHTML={{ __html: searchExplanation }}
            />
          </div>

          {searchResults.length > 0 ? (
            <>
              <div className="gallery-grid">
                {searchResults.map((result, i) => (
                  <GalleryCard key={result.project.id} project={result.project} index={i} />
                ))}
              </div>
              {searchResults.map((result, i) => result.reasons.length > 0 && (
                <div key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: '-12px', marginBottom: '20px', padding: '0 2px' }}>
                  {result.project.name}：{result.reasons.join('；')}
                </div>
              ))}
            </>
          ) : (
            <div className="search-results__empty">
              <h2>没有完全匹配的结果</h2>
              <p>但这不代表不存在。试试调整描述，或者从以下方向开始探索：</p>
              <div className="search-results__suggestions">
                <Link to="/?q=创意" className="filter-chip">创意机构</Link>
                <Link to="/?q=奢华" className="filter-chip">奢侈品</Link>
                <Link to="/?q=3D" className="filter-chip">3D / WebGL</Link>
                <Link to="/?q=极简" className="filter-chip">极简</Link>
                <Link to="/?q=汽车" className="filter-chip">汽车</Link>
              </div>
              {adjacentDirs.length > 0 && (
                <div className="adjacent-directions">
                  <div className="adjacent-directions__title">相邻方向</div>
                  <div className="adjacent-directions__list">
                    {adjacentDirs.map(p => (
                      <Link key={p.id} to={`/detail/${p.id}`} className="filter-chip">
                        {p.name} · {p.styleFamilyNameZh}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Style family filter */}
          <div className="filter-bar">
            <button
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              全部
            </button>
            {availableFamilies.map(f => (
              <button
                key={f.key}
                className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.nameZh}
              </button>
            ))}
            <span className="filter-bar__count">
              {displayProjects.length} 个方向
            </span>
          </div>

          {/* Gallery grid */}
          <div className="gallery-grid">
            {displayProjects.map((project, i) => (
              <GalleryCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </>
      )}

      <footer className="site-footer">
        <p>UI Gallery — 数据来源 {projects.length} 个 UI 项目 + 177 个组件库</p>
      </footer>
    </div>
  );
}
