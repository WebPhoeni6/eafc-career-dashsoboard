import React, { useEffect } from 'react';
import { AuthPage } from '../../features/auth/pages/AuthPage';
import { useSessionStore } from '../../store/session.store';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bootstrap = useSessionStore((s) => s.bootstrap);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (isBootstrapping) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;
  return <>{children}</>;
};
