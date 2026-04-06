import React from 'react'
import toast from 'react-hot-toast'
import { Shield, Bell, Key, CheckCircle2, X } from 'lucide-react'

export default function Settings() {
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

    return (
        <div className="page-full fade-in-scale stagger-1">
            <div className="card glass-panel slide-up stagger-2" style={{ padding: '28px' }}>
                <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                    System Settings
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
                    Manage your ThreatEngine OS preferences, API keys, and notification channels.
                </p>

                <div style={{ display: 'grid', gap: '20px' }}>

                    {/* API Config */}
                    <div className="card slide-up stagger-3" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Key size={18} style={{ color: 'var(--accent-blue)' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>API Configuration</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Backend URL Endpoint</label>
                            <input type="text" className="form-input" defaultValue="http://localhost:8000/api" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Threat Intelligence API Key</label>
                            <input type="password" className="form-input" defaultValue="xxxxxxxxxxxxxxxxxxxx" style={{ width: '100%', boxSizing: 'border-box' }} />
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Used for crowdsourced zero-day intelligence.
                            </p>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="card slide-up stagger-4" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Bell size={18} style={{ color: 'var(--accent-purple)' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Notification Preferences</h3>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked />
                            <span style={{ fontSize: '14px' }}>Email alerts for 'ATTACK' level threats</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" />
                            <span style={{ fontSize: '14px' }}>Slack Webhook Integration</span>
                        </label>
                    </div>

                    {/* Security */}
                    <div className="card slide-up stagger-5" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Shield size={18} style={{ color: 'var(--accent-green)' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Security & Model</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Default ML Model</label>
                            <select className="form-input" defaultValue="random_forest" style={{ width: '100%', boxSizing: 'border-box' }}>
                                <option value="random_forest">Random Forest</option>
                                <option value="xgboost">XGBoost</option>
                                <option value="decision_tree">Decision Tree</option>
                            </select>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked />
                            <span style={{ fontSize: '14px' }}>Enable hybrid (ML + Rule) detection pipeline</span>
                        </label>
                    </div>

                </div>

                <div style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-secondary">Discard Changes</button>
                    <button className="btn btn-success" onClick={handleSave}>Save Settings</button>
                </div>

            </div>
        </div>
    )
}
