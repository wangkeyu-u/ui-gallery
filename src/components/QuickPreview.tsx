import { useEffect } from 'react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { UIProject } from '../types';
import { canOpenOriginal, getLinkState, linkStateCopy } from '../utils/projectQuality';

export default function QuickPreview({ project, onClose }: { project: UIProject; onClose: () => void }) {
  const linkState = getLinkState(project);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="quick-preview" role="dialog" aria-modal="true" aria-label={`${project.name} 桌面 UI 预览`} onMouseDown={event => event.currentTarget === event.target && onClose()}>
      <div className="quick-preview__panel">
        <header>
          <div><span>1280 × 820 桌面快照</span><h2>{project.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="关闭预览"><X size={22} /></button>
        </header>
        <div className="quick-preview__canvas">
          <img src={`./${project.previewImage}`} alt={`${project.name} 完整桌面 UI 快照`} />
        </div>
        <footer>
          <p><strong>{project.styleFamilyNameZh}</strong> · {project.description || project.styleDescription}<br /><span>{linkStateCopy[linkState]}</span></p>
          <div>
            {canOpenOriginal(project) && <a href={project.originalUrl} target="_blank" rel="noreferrer">原站 <ArrowUpRight size={15} /></a>}
            <Link to={`/detail/${project.id}`}>拆解与复刻包 <ArrowUpRight size={15} /></Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
