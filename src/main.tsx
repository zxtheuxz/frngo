import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Renderizar a aplicação
// StrictMode removido temporariamente para evitar renderizações duplas
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
); 