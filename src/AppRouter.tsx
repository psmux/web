import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'

const DocsPage = lazy(() => import('./pages/DocsPage.tsx'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/docs/*"
          element={
            <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
              <DocsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}
