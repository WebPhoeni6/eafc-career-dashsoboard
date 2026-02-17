import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '../../components/ui/Toast';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
    <Toast />
  </ThemeProvider>
);
