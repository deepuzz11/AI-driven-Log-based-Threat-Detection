import React from 'react'
import { Webhook, Database, Slack, Cloud } from 'lucide-react'

export default function Integrations() {
    return (
        <div className="page-full fade-in-scale stagger-1">
            <div className="card glass-panel slide-up stagger-2" style={{ padding: '32px' }}>

                <div className="slide-up stagger-3" style={{ marginBottom: '32px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                        System Integrations
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Connect ThreatEngine OS to your existing security and operations infrastructure.
                    </p>
                </div>

                <div className="slide-up stagger-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* AWS */}
                    <div className="card glass-panel" style={{ padding: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                            <span className="glass-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Connected</span>
                        </div>
                        <Cloud size={32} style={{ color: '#FF9900', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AWS CloudTrail</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Ingest IAM and network logs directly from your AWS environments in real-time.
                        </p>
                        <button className="btn btn-secondary btn-sm">Configure</button>
                    </div>

                    {/* Splunk */}
                    <div className="card glass-panel slide-up stagger-5" style={{ padding: '24px' }}>
                        <Database size={32} style={{ color: 'var(--accent-blue)', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Splunk Forwarder</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Push validated threats and learned rules to your Splunk SIEM for centralized tracking.
                        </p>
                        <button className="btn btn-secondary btn-sm">Connect</button>
                    </div>

                    {/* Slack */}
                    <div className="card glass-panel slide-up stagger-5" style={{ padding: '24px' }}>
                        <Slack size={32} style={{ color: '#E01E5A', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Slack Webhooks</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Send automated critical alerts to your SOC team's Slack channels.
                        </p>
                        <button className="btn btn-secondary btn-sm">Connect</button>
                    </div>

                    {/* Custom Webhook */}
                    <div className="card glass-panel slide-up stagger-5" style={{ padding: '24px' }}>
                        <Webhook size={32} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Custom Webhook</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Build a generic JSON webhook stream for any external orchestration tool.
                        </p>
                        <button className="btn btn-secondary btn-sm">Create Endpoint</button>
                    </div>

                </div>
            </div>
        </div>
    )
}
