import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Self-hosted webfonts (TECH_DEBT L5). Only the weights actually used in the
// codebase are imported — Cinzel 400/600/700, Plus Jakarta Sans 400/500/600/700,
// JetBrains Mono 400/500. This replaces a render-blocking Google Fonts <link>
// in index.html and removes weights 300 (Plus Jakarta) and 900 (Cinzel) that
// the UI never requested but the old <link> still shipped.
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
