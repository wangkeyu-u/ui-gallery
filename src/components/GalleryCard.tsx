import { ArrowsOut, ArrowUpRight, Check, Heart, WarningCircle } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import type { ReproStatus, UIProject } from '../types';

interface GalleryCardProps {
  project: UIProject;
  reason?: string;
  featured?: boolean;
  onPreview?: (project: UIProject) => void;
}

function previewPath(path: string) {
  return path.startsWith('previews/') ? `./${path}` : path;
}

const REPRO_LABEL: Record<ReproStatus, string> = {
  untested: '复刻未验证',
  passed: '复刻已验证',
  failed: '未通过',
  'needs-review': '需复核',
};

const REPRO_CLASS: Record<ReproStatus, string> = {
  untested: 'card-repro--untested',
  passed: 'card-repro--passed',
  failed: 'card-repro--failed',
  'needs-review': 'card-repro--review',
};

export default function GalleryCard({ project, reason, featured = false, onPreview }: GalleryCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorite = isFavorite(project.id);
  const rs = project.reproStatus;

  return (
    <article className={`gallery-entry${featured ? ' gallery-entry--featured' : ''}`}>
      <button type="button" className="browser-frame browser-frame--button" aria-label={`放大预览 ${project.name}`} onClick={() => onPreview ? onPreview(project) : navigate(`/detail/${project.id}`)}>
        <div className="browser-frame__bar" aria-hidden="true">
          <span /><span /><span />
          <div className="browser-frame__address">{project.name.toLowerCase().replace(/\s+/g, '-')}.ui</div>
        </div>
        <div className="browser-frame__viewport">
          <img
            src={previewPath(project.previewImage)}
            alt={`${project.name} 的 UI 全貌`}
            loading={featured ? 'eager' : 'lazy'}
          />
          <span className="browser-frame__expand"><ArrowsOut size={16} /> 放大看完整 UI</span>
        </div>
      </button>
      <div className="gallery-entry__meta">
        <div className="gallery-entry__line">
          <span className={`card-repro ${REPRO_CLASS[rs]}`}>
            {rs === 'passed' ? <Check size={13} weight="bold" /> : rs === 'failed' || rs === 'needs-review' ? null : <WarningCircle size={13} />}
            {' '}{REPRO_LABEL[rs]}
          </span>
          <span>{project.styleFamilyNameZh}</span>
        </div>
        <Link to={`/detail/${project.id}`} className="gallery-entry__title">
          {project.name}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <p>{reason || project.description || project.styleDescription}</p>
        <div className="gallery-entry__footer">
          <span>{[...project.materials, ...project.mood].filter(Boolean).slice(0, 3).join(' · ') || '尚未拆解标签'}</span>
          <button
            type="button"
            className="save-button"
            onClick={() => toggleFavorite(project.id)}
            aria-label={favorite ? `取消收藏 ${project.name}` : `收藏 ${project.name}`}
          >
            <Heart size={18} weight={favorite ? 'fill' : 'regular'} aria-hidden="true" />
            {favorite ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </article>
  );
}
