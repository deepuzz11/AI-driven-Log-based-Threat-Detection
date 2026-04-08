import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, X, Cpu, Globe, Zap, Save, RefreshCcw } from 'lucide-react'

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
            <div className="page-header slide-up stagger-2" style={{ padding: '0 0 24px 0', marginBottom: '32px', borderBottom: '1px solid var(--border)' }}>
                <div className="page-title-section">
                    <Cpu size={28} className="page-icon" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>System Configuration</h1>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '13px' }}>
                            Manage your ThreatEngine Sentinel preferences, API keys, and operational parameters.
                        </p>
                    </div>
                </div>
            </div>

            <div className="settings-content-wrapper slide-up stagger-4" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    {/* Cloud API Section */}
                    <div id="api" className="settings-section">
                        <h2 className="settings-section-title">Provisioning Endpoints</h2>
                        <p className="settings-section-desc">Configure your remote endpoints and global sync keys.</p>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="label-pro">Primary Backend API</label>
                            <input type="text" className="input-pro" defaultValue="http://localhost:8000/api" style={{ width: '100%' }} />
                        </div>
                        <div className="form-group">
                            <label className="label-pro">Sentinel IQ API Key</label>
                            <input type="password" className="input-pro" defaultValue="xxxxxxxxxxxxxxxxxxxx" style={{ width: '100%' }} />
                            <p className="help-text" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Used for global threat telemetry synchronization.
                            </p>
                        </div>
                    </div>
                    
                    {/* Security Engine Section */}
                    <div id="security" className="settings-section">
                        <h2 className="settings-section-title">Heuristic Parameters</h2>
                        <p className="settings-section-desc">Adjust the core threat detection intelligence and thresholds.</p>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="label-pro">Neural Inference Model</label>
                            <select className="input-pro" defaultValue="xgboost" style={{ width: '100%' }}>
                                <option value="random_forest">Random Forest Classifier (Balanced)</option>
                                <option value="xgboost">XGBoost (High Velocity)</option>
                                <option value="decision_tree">Decision Tree (Audit-Grade)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Enable DL + Rules Hybrid Engine</span>
                            </label>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Enable BART-CNN Threat Summarisation</span>
                            </label>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Enable Deep Sequence Explainability & SHAP</span>
                            </label>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Enforce Sandbox Validation for Zero-Day payloads</span>
                            </label>
                        </div>
                    </div>
                    
                    {/* Notifications Section */}
                    <div id="notifications" className="settings-section">
                        <h2 className="settings-section-title">Operational Alerts</h2>
                        <p className="settings-section-desc">Configure how and when the SOC team receives system notifications.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Dispatch Email for CRITICAL detections</span>
                            </label>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Webhook Integration (Slack / MS Teams)</span>
                            </label>
                            <label className="checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Browser Push Notifications (Active HUD)</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <button className="btn btn-secondary">Discard Audit</button>
                        <button className="btn-neo btn-neo-primary" onClick={handleSave} style={{ minWidth: '160px' }}>Apply Parameters</button>
                    </div>
                </div>
        </div>
    )
}
