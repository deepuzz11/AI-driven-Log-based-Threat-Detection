import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import App from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Reports from './pages/Reports.jsx'
import Integrations from './pages/Integrations.jsx'
import Settings from './pages/Settings.jsx'
import LiveTraffic from './pages/LiveTraffic.jsx'
import CorrelationAnalysis from './pages/CorrelationAnalysis.jsx'
import RealtimeCorrelation from './pages/RealtimeCorrelation.jsx'
import Rules from './pages/Rules.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="correlation" element={<CorrelationAnalysis />} />
          <Route path="realtime" element={<RealtimeCorrelation />} />
          <Route path="reports" element={<Reports />} />
          <Route path="rules" element={<Rules />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="live" element={<LiveTraffic />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
