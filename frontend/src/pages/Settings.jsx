import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { 
    Shield, Bell, Key, CheckCircle2, X, Globe, Lock, 
    Cpu, Activity, Save, RotateCcw, User, HardDrive, 
    Terminal, Zap, Settings as SettingsIcon 
} from 'lucide-react'

export default function Settings() {
    const [activeSection, setActiveSection] = useState('general')

    const handleSave = () => {
        toast.custom((t) => (
            <div className="custom-toast success slide-down">
                <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                <div className="custom-toast-content">
                    <div className="custom-toast-title">Configuration Authenticated</div>
                    <div className="custom-toast-message">System-wide parameters updated successfully.</div>
                </div>
                <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
            </div>
        ), { duration: 3000 })
    }

    const sections = [
        { id: 'general', label: 'General System', icon: SettingsIcon },
        { id: 'api', label: 'API & Gateway', icon: Globe },
        { id: 'security', label: 'Security & ML', icon: Shield },
        { id: 'notifications', label: 'Alerting Ops', icon: Bell },
        { id: 'performance', label: 'Infrastructure', icon: Cpu },
    ]

    return (
        <div className="page-full fade-in-scale">
            <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', minHeight: '600px', border: '1px solid var(--glass-border)' }}>
                
                {/* ── SIDEBAR NAV ── */}
                <div style={{ width: '280px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)', padding: '32px 16px' }}>
                    <div style={{ padding: '0 16px', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Commander</h2>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Root Console</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sections.map(s => {
                            const Icon = s.icon
                            const active = activeSection === s.id
                            return (
                                <button 
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        background: active ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                                        color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        fontWeight: active ? 600 : 400,
                                        fontSize: '14px'
                                    }}
                                >
                                    <Icon size={18} opacity={active ? 1 : 0.6} />
                                    {s.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── CONTENT AREA ── */}
                <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {activeSection === 'general' && (
                            <div className="slide-up">
                                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>General Configuration</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Global environment parameters and core system behavior.</p>
                                
                                <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Deployment Environment</label>
                                        <select className="form-input" style={{ width: '100%' }} defaultValue="production">
                                            <option value="development">Development / Lab</option>
                                            <option value="staging">Staging / Sandbox</option>
                                            <option value="production">Production Cluster</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">System Verbosity</label>
                                        <select className="form-input" style={{ width: '100%' }} defaultValue="info">
                                            <option value="debug">Debug (Internal Trace)</option>
                                            <option value="info">Info (Standard Ops)</option>
                                            <option value="warn">Warning (Alerts Only)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dashboard Telemetry</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input type="checkbox" defaultChecked />
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Enable real-time WebSocket telemetry stream</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'api' && (
                            <div className="slide-up">
                                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>API & Gateway Control</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Configure external intelligence and ingress gateway parameters.</p>
                                
                                <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Forensic API Key</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="password" password="true" className="form-input" style={{ width: '100%', paddingRight: '40px' }} defaultValue="threat_engine_v2_f8392jk1l0" />
                                            <Key size={16} style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.3 }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">External TI Feed (URL)</label>
                                        <input type="text" className="form-input" style={{ width: '100%' }} defaultValue="https://ti.threatengine.io/v1/feed" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gateway Rate Limiting (Req/s)</label>
                                        <input type="number" className="form-input" style={{ width: '100%' }} defaultValue={500} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="slide-up">
                                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Security & ML Intelligence</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Fine-tune the hybrid detection pipeline and model sensitivity.</p>
                                
                                <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Primary ML Core</label>
                                        <select className="form-input" style={{ width: '100%' }} defaultValue="ensemble">
                                            <option value="rf">Random Forest (Stable)</option>
                                            <option value="xgb">XGBoost (Aggressive)</option>
                                            <option value="ensemble">Hybrid Ensemble (Guardian)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Detection Sensitivity</label>
                                        <input type="range" min="0" max="100" defaultValue="85" style={{ width: '100%', accentColor: 'var(--accent-blue)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <span>MIN (High False-Neg)</span>
                                            <span>85% THRESHOLD</span>
                                            <span>MAX (High False-Pos)</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input type="checkbox" defaultChecked />
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Auto-Correlate Indicators of Compromise (IoC)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="slide-up">
                                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Alerting Operations</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Manage incident response notification channels.</p>
                                
                                <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Integrations</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#4A154B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Zap size={18} color="#fff" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Slack Ops Channels</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connected to #security-alerts</div>
                                                    </div>
                                                </div>
                                                <button className="btn btn-secondary btn-sm">Configure</button>
                                            </div>
                                            <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#2D333B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Terminal size={18} color="#fff" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Forensic Webhooks</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Raw JSON payload delivery</div>
                                                    </div>
                                                </div>
                                                <button className="btn btn-secondary btn-sm">Connect</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'performance' && (
                            <div className="slide-up">
                                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Infrastructure Metrics</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Monitor and tune system resource allocation.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                        <Activity size={24} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Lattice Load</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>1.42ms</div>
                                    </div>
                                    <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                        <HardDrive size={24} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Store Utilization</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>42.1 GB</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ACTIONS ── */}
                    <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RotateCcw size={16} /> Discard
                        </button>
                        <button className="btn btn-success" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> Authenticate & Save
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
