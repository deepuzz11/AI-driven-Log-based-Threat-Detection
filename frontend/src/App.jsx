import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Shield, Home, BarChart3, Activity, FileText, Blocks, Settings, Sun, Moon, Menu, X, ChevronLeft, ChevronRight, Zap, LayoutDashboard, TrendingUp, Share2, Waypoints, Eye, FileSearch, ShieldAlert, Cloud } from 'lucide-react'
import './index.css'

function App() {
  const location = useLocation()

  // Theme state
  const [theme, setTheme] = useState('dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const mouseGlowRef = useRef(null)

  // Mouse-following gradient — direct DOM for 60fps
  const handleMouseMove = useCallback((e) => {
    if (mouseGlowRef.current) {
      mouseGlowRef.current.style.left = `${e.clientX}px`
      mouseGlowRef.current.style.top = `${e.clientY}px`
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Auto-close sidebar on route change
  useEffect(() => {
    window.scrollTo(0, 0)
    setSidebarOpen(false) // Close mobile sidebar on navigation
  }, [location.pathname])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Update header text based on active route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'SOC Dashboard'
      case '/analytics': return 'Security Insights'
      case '/correlation': return 'Threat Correlation'
      case '/realtime': return 'Behavioral Ops'
      case '/reports': return 'Incident Forensics'
      case '/rules': return 'Detection Rules'
      case '/integrations': return 'Cloud Connectors'
      case '/settings': return 'System Settings'
      case '/live': return 'Real-Time Traffic'
      default: return 'ThreatEngine Dashboard'
    }
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'black' } },
          error: { iconTheme: { primary: 'var(--accent-red)', secondary: 'black' } },
        }}
      />

      {/* ── ANIMATED GRADIENT BACKGROUND ───────────────────── */}
      <div className="animated-background">
        <div className="bg-grid"></div>
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
        <div className="aurora aurora-4"></div>
        <div className="flare"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      {/* ── CURSOR-FOLLOWING GLOW ──────────────────────────── */}
      <div className="mouse-glow" ref={mouseGlowRef}></div>

      {/* ── APP SHELL ──────────────────────────────────────── */}
      <div className="app-container" onMouseMove={handleMouseMove}>

        {/* ── SIDEBAR OVERLAY (mobile) ────────────────────── */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── SIDEBAR ───────────────────────────────────────── */}
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header" style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span className="sidebar-logo" style={{ fontSize: '18px', gap: '10px', display: 'flex', alignItems: 'center' }}>
              <Shield size={24} className="text-accent-blue" strokeWidth={2.5} style={{ color: 'var(--accent-blue)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                <span style={{ letterSpacing: '0.05em', fontWeight: 800 }}>PHANTOM ID</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>SENTINEL CONSOLE</span>
              </div>
            </span>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ margin: 0, padding: '4px', background: 'transparent', border: 'none' }}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="sidebar-nav">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '12px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Core</div>
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} title="SOC Dashboard">
              <LayoutDashboard size={20} /> <span>SOC Dashboard</span>
            </Link>
            <Link to="/analytics" className={`nav-item ${location.pathname === '/analytics' ? 'active' : ''}`} title="Security Insights">
              <TrendingUp size={20} /> <span>Security Insights</span>
            </Link>
            <Link to="/correlation" className={`nav-item ${location.pathname === '/correlation' ? 'active' : ''}`} title="Threat Correlation">
              <Share2 size={20} /> <span>Threat Correlation</span>
            </Link>
            <Link to="/realtime" className={`nav-item ${location.pathname === '/realtime' ? 'active' : ''}`} title="Behavioral Ops">
              <Waypoints size={20} /> <span>Behavioral Ops</span>
            </Link>
            <Link to="/live" className={`nav-item ${location.pathname === '/live' ? 'active' : ''}`} title="Real-Time Traffic">
              <Eye size={20} /> <span>Real-Time Traffic</span>
            </Link>

            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '24px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Operations</div>
            <Link to="/reports" className={`nav-item ${location.pathname === '/reports' ? 'active' : ''}`} title="Incident Forensics">
              <FileSearch size={20} /> <span>Incident Forensics</span>
            </Link>
            <Link to="/rules" className={`nav-item ${location.pathname === '/rules' ? 'active' : ''}`} title="Detection Rules">
              <ShieldAlert size={20} /> <span>Detection Rules</span>
            </Link>
            <Link to="/integrations" className={`nav-item ${location.pathname === '/integrations' ? 'active' : ''}`} title="Cloud Connectors">
              <Cloud size={20} /> <span>Cloud Connectors</span>
            </Link>

            <div style={{ marginTop: 'auto' }}></div>
            <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`} title="System Settings">
              <Settings size={20} /> <span>System Settings</span>
            </Link>
          </nav>

        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <main className="app-content">

          {/* ── HEADER ────────────────────────────────────────── */}
          <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="hamburger-btn" onClick={() => setSidebarOpen(prev => !prev)} title="Toggle Sidebar">
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <div className="header-breadcrumbs">
                <span>Infrastructure</span>
                <ChevronRight size={10} style={{ opacity: 0.3 }} />
                <span>Security</span>
                <ChevronRight size={10} style={{ opacity: 0.3 }} />
                <span style={{ color: 'var(--accent-cyan)' }}>{getPageTitle()}</span>
              </div>
            </div>
            <div className="header-actions">
              <span className="glass-badge" style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px', background: 'var(--bg-surface)', border: '1px solid var(--border)', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>PRO MODE</span>
              <div className="glass-status" style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <span className="status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span> System Online
              </div>
              <button
                onClick={toggleTheme}
                title="Toggle Dark/Light Mode"
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px', borderRadius: '50%', transition: 'all 0.2s'
                }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* ── SCROLLABLE WORKSPACE ──────────────────────────── */}
          <div className="app-main">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}

export default App
