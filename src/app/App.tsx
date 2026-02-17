import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { Routes } from './routes';

const App: React.FC = () => (
  <AppProviders>
    <Routes />
  </AppProviders>
);

export default App;
