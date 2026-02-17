import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './assets/styles/globals.css';
import { runMigrations } from './services/storage/migrations';

runMigrations();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
