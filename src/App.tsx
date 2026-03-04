import React from 'react'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardMonth } from './pages/DashboardMonth'
import { TemplateEditor } from './pages/TemplateEditor'
import { ImportExport } from './pages/ImportExport'
import { StatsDashboard } from './pages/StatsDashboard'
import { SavingsDashboard } from './pages/SavingsDashboard'
import { SettingsPage } from './pages/SettingsPage'
import { useAppStore, selectSortedMonths, formatYearMonth } from './store/appStore'
import { getCurrentYearMonth } from './utils/dateUtils'

// ─── Smart redirect ────────────────────────────────────────────────────────────
// First ever access → go to template so the user sets up Standard Month first.
// Subsequent accesses → go to the most recent month.
const RootRedirect: React.FC = () => {
  const months = useAppStore(selectSortedMonths)

  if (months.length === 0) {
    return <Navigate to="/template" replace />
  }

  const target = formatYearMonth(months[0].year, months[0].month)
  return <Navigate to={`/month/${target}`} replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'month/:yearMonth', element: <DashboardMonth /> },
      { path: 'template', element: <TemplateEditor /> },
      { path: 'stats', element: <StatsDashboard /> },
      { path: 'savings', element: <SavingsDashboard /> },
      { path: 'settings', element: <SettingsPage /> },
      // Keep legacy import-export route for backwards compat
      { path: 'import-export', element: <ImportExport /> },
      // Catch-all: redirect home
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export const App: React.FC = () => <RouterProvider router={router} />
