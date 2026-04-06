import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, Bell, Key, CheckCircle2, X, Cpu, Globe, Zap } from 'lucide-react'

export default function Settings() {
    const [activeTab, setActiveTab] = useState('api')

    const handleSave = () => {
        toast.custom((t) => (
            <div className="custom-toast success slide-down">
                <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                <div className="custom-toast-content">
                    <div className="custom-toast-title">Settings Saved</div>
                    <div className="custom-toast-message">Your preferences have been updated.</div>
                </div>
                <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
            </div>
        ), { duration: 3000 })
    }

    const tabs = [
        { id: 'api', label: 'Cloud API', icon: Key },
        { id: 'security', label: 'Detection Engine', icon: Shield },
        { id: 'notifications', label: 'Communications', icon: Bell },
    ]

    return (
        <div className="page-full fade-in-scale stagger-1">
            <div className="card glass-panel slide-up stagger-2" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
                        System Configuration
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Manage your ThreatEngine Sentinel preferences, API keys, and operational parameters.
                    </p>
                </div>

                {/* Cyber Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`btn ${isActive ? 'btn-neo-primary' : 'btn-secondary'}`}
                                style={{ 
                                    padding: '10px 20px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    borderRadius: '10px',
                                    border: isActive ? '1px solid var(--accent-blue)' : '1px solid transparent',
                                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                }}
                            >
                                <Icon size={16} />
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="tab-content slide-up" key={activeTab}>
                    {activeTab === 'api' && (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div className="card glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Globe size={18} className="text-accent-blue" />
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Provisioning Endpoints</h3>
                                </div>
                                <div className="form-group">
                                    <label className="label-pro">Primary Backend API</label>
                                    <input type="text" className="input-pro" defaultValue="http://localhost:8000/api" style={{ width: '100%' }} />
                                </div>
                                <div className="form-group">
                                    <label className="label-pro">Sentinel IQ API Key</label>
                                    <input type="password" className="input-pro" defaultValue="xxxxxxxxxxxxxxxxxxxx" style={{ width: '100%' }} />
                                    <p className="help-text">Used for global threat telemetry synchronization.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div className="card glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Cpu size={18} className="text-accent-purple" />
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Heuristic Parameters</h3>
                                </div>
                                <div className="form-group">
                                    <label className="label-pro">Neural Inference Model</label>
                                    <select className="input-pro" defaultValue="random_forest" style={{ width: '100%' }}>
                                        <option value="random_forest">Random Forest Classifier (Balanced)</option>
                                        <option value="xgboost">XGBoost (High Velocity)</option>
                                        <option value="decision_tree">Decision Tree (Audit-Grade)</option>
                                    </select>
                                </div>
                                <label className="checkbox-wrap">
                                    <input type="checkbox" defaultChecked />
                                    <span>Enable Hybrid Analysis (ML + Pattern Matching)</span>
                                </label>
                                <label className="checkbox-wrap">
                                    <input type="checkbox" defaultChecked />
                                    <span>Enforce Sandbox Validation for Zero-Day payloads</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div className="card glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Zap size={18} className="text-accent-amber" />
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Operational Alerts</h3>
                                </div>
                                <label className="checkbox-wrap" style={{ marginBottom: '16px' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>Dispatch Email for CRITICAL detections</span>
                                </label>
                                <label className="checkbox-wrap" style={{ marginBottom: '16px' }}>
                                    <input type="checkbox" />
                                    <span>Webhook Integration (Slack / MS Teams)</span>
                                </label>
                                <label className="checkbox-wrap">
                                    <input type="checkbox" defaultChecked />
                                    <span>Browser Push Notifications (Active HUD)</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button className="btn btn-secondary">Discard Audit</button>
                    <button className="btn-neo btn-neo-primary" onClick={handleSave} style={{ minWidth: '160px' }}>Apply Parameters</button>
                </div>
            </div>
        </div>
    )
}
