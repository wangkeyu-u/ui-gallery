import { Link } from 'react-router-dom';
import type { UIProject } from '../types';
import { useFavorites } from '../hooks/useFavorites';

const CARD_SIZES = ['card-size-large', 'card-size-medium', 'card-size-small', 'card-size-tall', 'card-size-wide', 'card-size-full'];

export default function GalleryCard({ project, index }: { project: UIProject; index: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(project.id);

  // Assign card size based on index for magazine rhythm
  const sizeClass = (() => {
    const pattern = [
      'card-size-large',   // 0: hero
      'card-size-medium',  // 1
      'card-size-tall',    // 2: tall mobile shot
      'card-size-medium',  // 3
      'card-size-medium',  // 4
      'card-size-wide',    // 5: wide editorial
      'card-size-small',   // 6
      'card-size-small',   // 7
      'card-size-small',   // 8
      'card-size-full',    // 9: full-width feature
      'card-size-medium',  // 10
      'card-size-medium',  // 11
    ];
    return pattern[index % pattern.length];
  })();

  return (
    <article className={`gallery-card ${sizeClass}`}>
      <Link to={`/detail/${project.id}`}>
        <div className="gallery-card__image-wrap">
          {project.projectType === 'award' && (
            <span className="gallery-card__badge">获奖</span>
          )}
          <button
            className={`gallery-card__favorite ${fav ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(project.id);
            }}
            aria-label={fav ? '取消收藏' : '收藏'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <img
            className="gallery-card__image"
            src={project.previewImage.replace('previews/', './previews/')}
            alt={`${project.name} — ${project.styleFamilyNameZh}`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="400" height="250" fill="%23eeede9"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239b9b9b" font-size="14">预览加载失败</text></svg>';
            }}
          />
          <div className="gallery-card__overlay">
            <span className="gallery-card__overlay-text">查看详情 →</span>
          </div>
        </div>
      </Link>
      <div className="gallery-card__info">
        <h3 className="gallery-card__name">{project.name}</h3>
        <div className="gallery-card__tags">
          <span className="gallery-card__tag">{project.styleFamilyNameZh}</span>
          {project.mood.slice(0, 2).map(m => (
            <span key={m} className="gallery-card__tag">{m}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
