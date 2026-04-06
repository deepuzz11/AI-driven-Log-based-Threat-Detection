import React from 'react'
import { Webhook, Database, Slack, Cloud, Terminal, Code2, Copy, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Integrations() {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard', {
            style: { background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid var(--border)' }
        })
    }

    const apiEndpoints = [
        {
            method: 'POST',
            path: '/api/sentinel/analyze',
            desc: 'Primary forensic analysis engine. Processes raw log data and returns hybrid (ML + Rule) insights.',
            sample: `fetch('/api/sentinel/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    row: {
      "proto": "tcp",
      "service": "http",
      "sbytes": 1200,
      "dbytes": 5000
    }
  })
})`
        },
        {
            method: 'GET',
            path: '/api/sentinel/stats',
            desc: 'System health and ingestion statistics. Returns total logs, threat counts, and category distribution.',
            sample: `fetch('/api/sentinel/stats')
  .then(res => res.json())
  .then(data => console.log(data))`
        },
        {
            method: 'GET',
            path: '/api/stream',
            desc: 'Real-time Server-Sent Events (SSE) stream for live traffic monitoring and correlated analysis.',
            sample: `const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (e) => {
  const analysis = JSON.parse(e.data);
  processThreat(analysis);
};`
        }
    ]

    return (
        <div className="page-full fade-in-scale">
            
            {/* ── EXTERNAL CONNECTORS ── */}
            <div className="card glass-panel slide-up stagger-1" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                        Platform Integrations
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Connect ThreatEngine Sentinel to your existing cloud, SIEM, and notification infrastructure.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {/* AWS */}
                    <div className="card glass-panel" style={{ padding: '24px', position: 'relative', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                            <span className="glass-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Connected</span>
                        </div>
                        <Cloud size={32} style={{ color: '#FF9900', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AWS CloudTrail</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}> Ingest IAM and network logs via direct IAM-role authentication. </p>
                        <button className="btn btn-secondary btn-sm">Manage Role</button>
                    </div>

                    {/* Splunk */}
                    <div className="card glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <Database size={32} style={{ color: 'var(--accent-blue)', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Splunk / HEC</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}> Push validated threats to HEC endpoints for secondary visualization. </p>
                        <button className="btn btn-secondary btn-sm">Connect Token</button>
                    </div>

                    {/* Slack */}
                    <div className="card glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <Slack size={32} style={{ color: '#E01E5A', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Slack Webhooks</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}> Send automated critical alerts to your SOC team's Slack channels. </p>
                        <button className="btn btn-secondary btn-sm">Add Webhook</button>
                    </div>
                </div>
            </div>

            {/* ── BACKEND API & DOCUMENTATION ── */}
            <div className="card glass-panel slide-up stagger-2" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px' }}>
                        <Terminal size={24} style={{ color: 'var(--accent-cyan)' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>Developer Interface (RESTful API)</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Programmatically interface with the Sentinel investigation core.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {apiEndpoints.map((api, idx) => (
                        <div key={idx} style={{ borderBottom: idx !== apiEndpoints.length -1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span className="glass-badge" style={{ 
                                    background: api.method === 'POST' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: api.method === 'POST' ? 'var(--accent-blue)' : 'var(--accent-green)',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    border: 'none',
                                    padding: '4px 10px'
                                }}>{api.method}</span>
                                <code style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>{api.path}</code>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '800px' }}>{api.desc}</p>
                            
                            <div className="form-group" style={{ position: 'relative', background: '#0e1525', borderRadius: '8px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => copyToClipboard(api.sample)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        title="Copy request sample"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                    <Code2 size={14} style={{ color: 'var(--accent-amber)' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Request (Fetch/JS)</span>
                                </div>
                                <pre style={{ 
                                    margin: 0, 
                                    fontSize: '13px', 
                                    color: '#e2e8f0', 
                                    fontFamily: "'JetBrains Mono', monospace", 
                                    overflowX: 'auto',
                                    padding: '4px 0'
                                }}>
                                    {api.sample}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-blue)' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}> All endpoints require <code style={{ color: 'var(--accent-amber)' }}>X-SENTINEL-KEY</code> header for production environments. </p>
                </div>
            </div>
        </div>
    )
}
