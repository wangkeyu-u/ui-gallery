import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import projectsData from '../data/ui-projects.json';
import componentsData from '../data/components.json';
import type { UIProject, ComponentLibrary } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { usePreference } from '../hooks/usePreference';
import { findSimilar, getAdjacentDirections } from '../utils/search';

const projects = projectsData as UIProject[];
const allComponents = componentsData as ComponentLibrary[];

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find(p => p.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { likeProject, dislikeProject, preference } = usePreference();
  const [showPrompt, setShowPrompt] = useState(false);

  if (!project) {
    return (
      <div className="container detail-page">
        <Link to="/" className="detail-back">← 返回画廊</Link>
        <p>项目未找到。</p>
      </div>
    );
  }

  const fav = isFavorite(project.id);
  const liked = preference.likedProjectIds.includes(project.id);
  const similar = findSimilar(project.id);
  const adjacent = getAdjacentDirections(project.id);

  // Extract design DNA from prompt
  const promptLines = (project.prompt || '').split('\n').filter(Boolean);
  const designSpec = promptLines.filter(l =>
    /color|font|background|layout|spacing|radius|animation|hex|#/i.test(l)
  );

  // Find related components
  const relatedComponents = allComponents
    .filter(c => c.styleFamily === project.styleFamily)
    .slice(0, 4);

  const copyPrompt = () => {
    navigator.clipboard?.writeText(project.prompt || '');
  };

  return (
    <div className="container detail-page">
      <Link to="/" className="detail-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        返回画廊
      </Link>

      {/* Header */}
      <div className="detail-header">
        <div>
          <h1 className="detail-header__title">{project.name}</h1>
          <div className="detail-header__meta">
            <span>风格：{project.styleFamilyNameZh}</span>
            <span>来源：{project.author || project.source}</span>
            {project.originalUrl && (
              <a href={project.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                原始链接 ↗
              </a>
            )}
          </div>
          <p className="detail-header__desc">{project.description}</p>
          <div className="detail-actions">
            <button
              className={`btn ${liked ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => likeProject(project.id)}
            >
              {liked ? '✓ 已喜欢' : '喜欢这个方向'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => dislikeProject(project.id)}
            >
              不接近
            </button>
            <button
              className={`btn btn-secondary ${fav ? 'active' : ''}`}
              onClick={() => toggleFavorite(project.id)}
            >
              {fav ? '★ 已收藏' : '☆ 收藏'}
            </button>
          </div>
        </div>
        <div>
          <img
            className="detail-image"
            src={project.previewImage.replace('previews/', './previews/')}
            alt={project.name}
          />
        </div>
      </div>

      {/* Style DNA */}
      <section className="detail-section">
        <h2 className="detail-section__title">设计 DNA</h2>
        <div className="detail-dna-grid">
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">风格家族</div>
            <div className="detail-dna-item__value">{project.styleFamilyNameZh}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">情绪</div>
            <div className="detail-dna-item__value">{project.mood.join('、') || '—'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">材质</div>
            <div className="detail-dna-item__value">{project.materials.join('、') || '—'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">行业</div>
            <div className="detail-dna-item__value">{project.industry.join('、') || '—'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">明暗</div>
            <div className="detail-dna-item__value">{project.isDark ? '暗色' : '浅色'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">内容密度</div>
            <div className="detail-dna-item__value">{project.density}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">交互特征</div>
            <div className="detail-dna-item__value">{project.interactions.join('、') || '—'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">动画类型</div>
            <div className="detail-dna-item__value">{project.animations.join('、') || '—'}</div>
          </div>
          <div className="detail-dna-item">
            <div className="detail-dna-item__label">布局特征</div>
            <div className="detail-dna-item__value">{project.layoutTraits.join('、') || '—'}</div>
          </div>
          {project.fontFamily && (
            <div className="detail-dna-item">
              <div className="detail-dna-item__label">字体</div>
              <div className="detail-dna-item__value">{project.fontFamily}</div>
            </div>
          )}
          {project.colors.bg && (
            <div className="detail-dna-item">
              <div className="detail-dna-item__label">背景色</div>
              <div className="detail-dna-item__value">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: project.colors.bg, marginRight: 6, verticalAlign: 'middle', border: '1px solid var(--border)' }} />
                {project.colors.bg}
              </div>
            </div>
          )}
          {project.colors.accent && (
            <div className="detail-dna-item">
              <div className="detail-dna-item__label">强调色</div>
              <div className="detail-dna-item__value">
                <span style={{ display: 'inline-block', width: 12, height: 12, background: project.colors.accent, marginRight: 6, verticalAlign: 'middle', border: '1px solid var(--border)' }} />
                {project.colors.accent}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Capabilities */}
      <section className="detail-section">
        <h2 className="detail-section__title">可用能力</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {project.capabilities.map(cap => (
            <span key={cap} className="filter-chip active" style={{ cursor: 'default' }}>
              {cap === 'prompt' ? '有构建提示词' :
               cap === 'design-spec' ? '有设计规范' :
               cap === 'verified' ? '已验证' : cap}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {project.prompt && (
            <>
              <button className="btn btn-primary" onClick={copyPrompt}>
                复制构建提示词
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPrompt(!showPrompt)}>
                {showPrompt ? '隐藏' : '查看'}提示词详情
              </button>
            </>
          )}
          <Link to="/themes" className="btn btn-secondary">
            提取为主题
          </Link>
        </div>
        {showPrompt && project.prompt && (
          <pre style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--card-radius)',
            fontSize: 13,
            lineHeight: 1.6,
            overflow: 'auto',
            maxHeight: 400,
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono)',
          }}>
            {project.prompt}
          </pre>
        )}
      </section>

      {/* Related components */}
      {relatedComponents.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section__title">推荐组件</h2>
          <div className="detail-dna-grid">
            {relatedComponents.map(comp => (
              <div key={comp.id} className="detail-dna-item">
                <div className="detail-dna-item__label">{comp.name}</div>
                <div className="detail-dna-item__value" style={{ fontSize: 13, fontWeight: 400 }}>
                  {comp.framework.join(', ')} · {comp.components.slice(0, 4).join(', ')}
                  {comp.repoUrl && (
                    <><br /><a href={comp.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', fontSize: 12 }}>仓库 ↗</a></>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar and adjacent */}
      {(similar.length > 0 || adjacent.length > 0) && (
        <section className="detail-section">
          <h2 className="detail-section__title">继续探索</h2>
          {similar.length > 0 && (
            <>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>同风格</h3>
              <div className="gallery-grid" style={{ marginBottom: 32 }}>
                {similar.slice(0, 4).map((p, i) => (
                  <Link key={p.id} to={`/detail/${p.id}`} className="gallery-card card-size-medium reveal visible">
                    <div className="gallery-card__image-wrap">
                      <img
                        className="gallery-card__image"
                        src={p.previewImage.replace('previews/', './previews/')}
                        alt={p.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="gallery-card__info">
                      <h3 className="gallery-card__name">{p.name}</h3>
                      <div className="gallery-card__tags">
                        <span className="gallery-card__tag">{p.styleFamilyNameZh}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          {adjacent.length > 0 && (
            <>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>不同方向</h3>
              <div className="gallery-grid">
                {adjacent.slice(0, 4).map((p, i) => (
                  <Link key={p.id} to={`/detail/${p.id}`} className="gallery-card card-size-medium reveal visible">
                    <div className="gallery-card__image-wrap">
                      <img
                        className="gallery-card__image"
                        src={p.previewImage.replace('previews/', './previews/')}
                        alt={p.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="gallery-card__info">
                      <h3 className="gallery-card__name">{p.name}</h3>
                      <div className="gallery-card__tags">
                        <span className="gallery-card__tag">{p.styleFamilyNameZh}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
