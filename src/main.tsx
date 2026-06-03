import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './services/httpClient'; // installe l'intercepteur fetch (token + 401) avant tout appel API
import './i18n/index';
import App from './App';
import './styles/index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
