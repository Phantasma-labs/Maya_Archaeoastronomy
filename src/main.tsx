import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Self-hosted webfonts (TECH_DEBT L5). Only the weights actually used in the
// codebase are imported — Cinzel 400/600/700, Plus Jakarta Sans 400/500/600/700,
// JetBrains Mono 400/500 — and only the latin subset (V02_AUDIT V2-2): the
// full @fontsource/*/400.css imports ship every unicode subset (cyrillic,
// greek, vietnamese, latin-ext) for each weight, ~450 KB of font files the
// English UI never uses. latin-*.css cuts that to roughly a third with zero
// visual change.
import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
