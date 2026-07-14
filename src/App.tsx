import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Gallery from './pages/Gallery';
import Detail from './pages/Detail';
import Components from './pages/Components';
import Themes from './pages/Themes';
import { ThemeProvider } from './hooks/useTheme';
import { FavoritesProvider } from './hooks/useFavorites';
import { PreferenceProvider } from './hooks/usePreference';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <PreferenceProvider>
          <ScrollToTop />
          <Header />
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/components" element={<Components />} />
            <Route path="/themes" element={<Themes />} />
          </Routes>
        </PreferenceProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
