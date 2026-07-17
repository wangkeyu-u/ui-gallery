import { ArrowUpRight, CheckCircle, Pause, Play } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import projectsData from '../data/ui-projects.json';
import type { UIProject } from '../types';

const REEL_IDS = ['demo-dashboard', 'new-raycast', 'new-rijksmuseum'];
const projects = projectsData as UIProject[];
const reelProjects = REEL_IDS
  .map(id => projects.find(project => project.id === id))
  .filter(Boolean) as UIProject[];
const REEL_TITLES: Record<string, string> = {
  'demo-dashboard': 'Pulse Analytics',
  'new-raycast': 'Raycast',
  'new-rijksmuseum': 'Rijksmuseum',
};

function displayName(project: UIProject) {
  return REEL_TITLES[project.id] || project.name;
}

function previewPath(path: string) {
  return path.startsWith('previews/') ? `./${path}` : path;
}

function sourceLabel(project: UIProject) {
  return project.projectType === 'demo' ? '自包含复刻 · SSIM 0.9996' : '真实来源 · 快照已验收';
}

export default function ShowcaseReel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeProject = reelProjects[activeIndex] || reelProjects[0];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || reelProjects.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % reelProjects.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  if (!activeProject) return null;

  return (
    <section className={`showcase-reel${paused ? ' is-paused' : ''}`} aria-label="真实 UI 快照轮播">
      <header className="showcase-reel__header">
        <div>
          <span className="showcase-reel__status"><i aria-hidden="true" /> LIVE ARCHIVE</span>
          <p>用真实快照证明，不用概念图充数</p>
        </div>
        <button
          type="button"
          className="showcase-reel__toggle"
          aria-label={paused ? '播放快照轮播' : '暂停快照轮播'}
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
        >
          {paused ? <Play size={15} weight="fill" /> : <Pause size={15} weight="fill" />}
          {paused ? '播放' : '暂停'}
        </button>
      </header>

      <Link className="showcase-reel__stage" to={`/detail/${activeProject.id}`} aria-label={`查看 ${activeProject.name} 完整档案`}>
        <div className="showcase-reel__browser" aria-hidden="true">
          <span /><span /><span />
          <div>{activeProject.originalUrl || `${displayName(activeProject).toLowerCase().replace(/\s+/g, '-')}.local`}</div>
        </div>
        <div className="showcase-reel__screen">
          <img
            key={activeProject.id}
            src={previewPath(activeProject.previewImage)}
            alt=""
            loading="eager"
          />
          <span className="showcase-reel__proof"><CheckCircle size={15} weight="fill" /> {sourceLabel(activeProject)}</span>
        </div>
        <div className="showcase-reel__caption">
          <div><strong>{displayName(activeProject)}</strong><span>{activeProject.styleFamilyNameZh}</span></div>
          <span>查看完整档案 <ArrowUpRight size={16} /></span>
        </div>
      </Link>

      <div className="showcase-reel__nav" role="tablist" aria-label="选择快照">
        {reelProjects.map((project, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`显示 ${project.name}`}
            key={project.id}
            className={index === activeIndex ? 'active' : ''}
            onClick={() => setActiveIndex(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {displayName(project)}
          </button>
        ))}
      </div>
      {!paused && !reducedMotion && (
        <div className="showcase-reel__progress" aria-hidden="true"><span key={activeProject.id} /></div>
      )}
    </section>
  );
}
