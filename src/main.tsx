import '@fontsource-variable/manrope/wght.css';
import '@fontsource-variable/noto-sans-sc/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ReconstructionApp } from './reconstructions/ReconstructionApp';
import './styles.css';

const visualMode = new URLSearchParams(window.location.search).has('visual');
if (visualMode) document.documentElement.dataset.visualTest = 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.startsWith('/reconstructions/') ? <ReconstructionApp /> : <App />}
  </StrictMode>,
);
