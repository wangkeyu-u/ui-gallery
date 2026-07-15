import { Heart, Moon, Sun } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useTheme } from '../hooks/useTheme';

export default function Header() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { favorites } = useFavorites();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="wordmark" aria-label="UI Gallery 首页">UI GALLERY</Link>
        <nav className="site-nav" aria-label="主要导航">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>浏览</Link>
          <Link to="/components" className={pathname === '/components' ? 'active' : ''}>组件</Link>
          <Link to="/themes" className={pathname === '/themes' ? 'active' : ''}>主题</Link>
        </nav>
        <div className="site-header__tools">
          <Link to="/?saved=1" className="header-tool" aria-label={`查看 ${favorites.length} 个收藏`}>
            <Heart size={17} weight={favorites.length ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{favorites.length}</span>
          </Link>
          <button type="button" className="header-tool header-tool--icon" onClick={toggleTheme} aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
            {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
