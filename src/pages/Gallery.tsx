import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChatCircleDots, FunnelSimple, ShieldCheck, X } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';
import GalleryCard from '../components/GalleryCard';
import QuickPreview from '../components/QuickPreview';
import SearchBar from '../components/SearchBar';
import ShowcaseReel from '../components/ShowcaseReel';
import projectsData from '../data/ui-projects.json';
import styleFamiliesData from '../data/style-families.json';
import { useFavorites } from '../hooks/useFavorites';
import type { ReproStatus, SearchResult, StyleFamily, UIProject } from '../types';
import { search } from '../utils/search';
import { isVerifiedProject } from '../utils/projectQuality';

const projects = projectsData as UIProject[];
const verifiedProjects = projects.filter(isVerifiedProject);
const styleFamilies = styleFamiliesData as StyleFamily[];
const PAGE_SIZE = 24;

const CURATED_IDS = [
  'demo-dashboard',
  'demo-portfolio',
  'demo-flat',
  'new-raycast',
  'new-rijksmuseum',
  'v4-nintendo',
  'v4-pentagram',
  'v4-mercury',
  'v4-wikipedia',
  'v4-headspace',
  'new-rivian',
  'new-dropbox-brand',
  'new-google-fonts',
  'prod-linear',
  'prod-stripe',
  'extra-anthropic',
  'extra-nike',
  'extra-hoverstats',
  'proj-2021-two-good-co',
  'awd-2025-ottografie',
  'awd-locomotive',
  'webby-2024-suno',
  'studio-brittany',
  'prod-glossier',
  'extra-zara',
];

const EXAMPLES = [
  '金属质感的汽车产品页，但不要太赛博',
  '温暖、可信的教育产品',
  '有纸张质感的文化品牌',
];

function uniqueProjects(list: UIProject[]) {
  return [...new Map(list.map(project => [project.id, project])).values()];
}

export default function Gallery() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() || '';
  const savedOnly = params.get('saved') === '1';
  const [activeFamily, setActiveFamily] = useState('all');
  const [activeRepro, setActiveRepro] = useState<ReproStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewProject, setPreviewProject] = useState<UIProject | null>(null);
  const { favorites } = useFavorites();

  useEffect(() => setVisibleCount(PAGE_SIZE), [query, activeFamily, activeRepro, savedOnly]);

  const familyCounts = useMemo(() => verifiedProjects.reduce<Record<string, number>>((counts, project) => {
    counts[project.styleFamily] = (counts[project.styleFamily] || 0) + 1;
    return counts;
  }, {}), []);

  const reproCounts = useMemo<Record<string, number>>(() => {
    const c: Record<string, number> = { all: verifiedProjects.length };
    for (const s of ['untested', 'passed', 'failed', 'needs-review'] as ReproStatus[]) {
      c[s] = verifiedProjects.filter((p) => p.reproStatus === s).length;
    }
    return c;
  }, []);

  const searchState = useMemo(() => query ? search(query) : null, [query]);

  const orderedProjects = useMemo(() => {
    let list: UIProject[];
    if (searchState) {
      list = searchState.results.map(result => result.project).filter(isVerifiedProject);
    } else {
      const curated = CURATED_IDS.map(id => verifiedProjects.find(project => project.id === id)).filter(Boolean) as UIProject[];
      list = uniqueProjects([...curated, ...verifiedProjects]);
    }
    if (savedOnly) list = list.filter(project => favorites.includes(project.id));
    if (activeFamily !== 'all') list = list.filter(project => project.styleFamily === activeFamily);
    if (activeRepro !== 'all') list = list.filter(project => project.reproStatus === activeRepro);
    return list;
  }, [activeFamily, activeRepro, favorites, savedOnly, searchState]);

  const resultReasons = useMemo(() => {
    const map = new Map<string, string>();
    searchState?.results.forEach((result: SearchResult) => {
      if (result.reasons.length) map.set(result.project.id, result.reasons.join('；'));
    });
    return map;
  }, [searchState]);

  const availableFamilies = styleFamilies.filter(family => familyCounts[family.key]);
  const visibleProjects = orderedProjects.slice(0, visibleCount);

  return (
    <main>
      <section className="discovery-intro container">
        <div className="discovery-intro__copy">
          <span className="discovery-proofline"><ShieldCheck size={17} weight="fill" /> 来源可访问 · 快照已验收</span>
          <h1>先看真实界面，<br />再决定怎么做。</h1>
          <p>默认只展示来源可访问、截图足以判断的桌面 UI。失效、受限和待复核条目不会进入主库。</p>
          <div className="discovery-intro__search">
            <SearchBar initialValue={query} />
            <div className="brief-examples" aria-label="搜索示例">
              {EXAMPLES.map(example => <Link key={example} to={`/?q=${encodeURIComponent(example)}`}>{example}</Link>)}
            </div>
          </div>
          <p className="discovery-trust-note">当前主库：{verifiedProjects.filter(project => project.originalUrl).length} 个可访问来源 + {verifiedProjects.filter(project => project.projectType === 'demo').length} 个自包含验证演示。</p>
        </div>
        <ShowcaseReel />
      </section>

      <section className="assistant-dock container" id="assistant">
        <div className="assistant-dock__intro">
          <ChatCircleDots size={25} weight="light" aria-hidden="true" />
          <div><span className="eyebrow">AI 选图助手 · 本地即可用</span><h2>直接说感觉，我只从验收过的 UI 里找。</h2><p>不用部署 Worker，也不会把失败截图推荐给你。云端 AI 只是可选增强。</p></div>
        </div>
        <ChatPanel />
      </section>

      <section className="archive-toolbar container" aria-label="画廊筛选">
        <div className="archive-toolbar__scroll">
          <FunnelSimple size={16} aria-hidden="true" />
          <button type="button" className={activeFamily === 'all' ? 'active' : ''} onClick={() => setActiveFamily('all')}>全部</button>
          {availableFamilies.map(family => (
            <button
              type="button"
              key={family.key}
              className={activeFamily === family.key ? 'active' : ''}
              onClick={() => setActiveFamily(family.key)}
            >
              {family.nameZh} <span>{familyCounts[family.key]}</span>
            </button>
          ))}
        </div>
        <div className="archive-toolbar__scroll repro-filter">
          {(['all', 'untested', 'passed', 'failed', 'needs-review'] as const).map((s) => (
            <button
              type="button"
              key={s}
              className={activeRepro === s ? 'active' : ''}
              onClick={() => setActiveRepro(s)}
            >
              {s === 'all' ? '全部' : s === 'passed' ? '复刻已验证' : s === 'failed' ? '复刻未通过' : s === 'needs-review' ? '复刻需复核' : '复刻未验证'}
              <span>{reproCounts[s]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="archive container">
        <div className="archive__heading">
          <div>
            <span className="eyebrow">{query ? '匹配档案' : savedOnly ? '我的收藏' : '编辑精选'}</span>
            <h2>{query ? `“${query}”` : savedOnly ? `${orderedProjects.length} 个已保存方向` : '用完整界面判断，不用猜。'}</h2>
          </div>
          <div className="archive__summary">
            <p>{searchState?.explanation || `${verifiedProjects.length} 个已验收桌面 UI；${projects.length - verifiedProjects.length} 个失败、重复或低质量条目已隔离。`}</p>
            {!query && !savedOnly && <span className="quality-note"><ShieldCheck size={15} /> 本轮新增 95 个真实桌面快照</span>}
            {(query || savedOnly) && <Link to="/"><X size={15} aria-hidden="true" /> 清除条件</Link>}
          </div>
        </div>

        {visibleProjects.length ? (
          <>
            <div className="archive-grid">
              {visibleProjects.map((project, index) => (
                <GalleryCard
                  key={project.id}
                  project={project}
                  reason={resultReasons.get(project.id)}
                  featured={!query && !savedOnly && activeFamily === 'all' && index === 0}
                  onPreview={setPreviewProject}
                />
              ))}
            </div>
            {visibleCount < orderedProjects.length && (
              <div className="load-more">
                <button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
                  再看 {Math.min(PAGE_SIZE, orderedProjects.length - visibleCount)} 个
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h2>{savedOnly ? '还没有收藏 UI' : '没有完全相同的界面'}</h2>
            <p>{savedOnly ? '先回到画廊保存几个接近的方向。' : '不让你停在死路。换一种说法，或直接和设计对话继续拆解。'}</p>
            <Link to={savedOnly ? '/' : '/?q=金属 汽车'}>{savedOnly ? '回到画廊' : '查看相邻方向'} <ArrowRight size={17} /></Link>
          </div>
        )}
      </section>

      <footer className="site-footer container">
        <span>UI GALLERY / 2026</span>
        <p>{verifiedProjects.length} 个已验收 UI，{projects.length - verifiedProjects.length} 个隔离条目。只展示能判断的桌面快照。</p>
      </footer>
      {previewProject && <QuickPreview project={previewProject} onClose={() => setPreviewProject(null)} />}
    </main>
  );
}
