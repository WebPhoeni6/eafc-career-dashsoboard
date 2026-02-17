import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './layout/AppShell';

const DashboardPage    = lazy(() => import('../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const MatchesPage      = lazy(() => import('../features/matches/pages/MatchesPage').then((m) => ({ default: m.MatchesPage })));
const SeasonsPage      = lazy(() => import('../features/seasons/pages/SeasonsPage').then((m) => ({ default: m.SeasonsPage })));
const SkillsPage       = lazy(() => import('../features/skills/pages/SkillsPage').then((m) => ({ default: m.SkillsPage })));
const TransfersPage    = lazy(() => import('../features/transfers/pages/TransfersPage').then((m) => ({ default: m.TransfersPage })));
const InternationalPage= lazy(() => import('../features/international/pages/InternationalPage').then((m) => ({ default: m.InternationalPage })));
const ProfilePage      = lazy(() => import('../features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage     = lazy(() => import('../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const Loading = () => (
  <div style={{ display: 'grid', placeItems: 'center', height: '40vh', color: 'var(--muted)', fontSize: '13px' }}>
    Loading…
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,             element: <Suspense fallback={<Loading />}><DashboardPage /></Suspense> },
      { path: 'matches',         element: <Suspense fallback={<Loading />}><MatchesPage /></Suspense> },
      { path: 'seasons',         element: <Suspense fallback={<Loading />}><SeasonsPage /></Suspense> },
      { path: 'skills',          element: <Suspense fallback={<Loading />}><SkillsPage /></Suspense> },
      { path: 'transfers',       element: <Suspense fallback={<Loading />}><TransfersPage /></Suspense> },
      { path: 'international',   element: <Suspense fallback={<Loading />}><InternationalPage /></Suspense> },
      { path: 'profile',         element: <Suspense fallback={<Loading />}><ProfilePage /></Suspense> },
      { path: 'settings',        element: <Suspense fallback={<Loading />}><SettingsPage /></Suspense> },
    ],
  },
]);

export const Routes: React.FC = () => <RouterProvider router={router} />;
