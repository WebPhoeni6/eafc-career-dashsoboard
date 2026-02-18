import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '../../components/ui/Toast';
import { AuthGate } from './AuthGate';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthGate>{children}</AuthGate>
    <Toast />
  </ThemeProvider>
);
