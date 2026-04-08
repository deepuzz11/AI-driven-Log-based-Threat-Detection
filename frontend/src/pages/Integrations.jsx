import React from 'react'
import { Webhook, Database, Slack, Cloud, Link2 } from 'lucide-react'

const integrations = [
    {
        name: 'AWS CloudTrail',
        icon: Cloud,
        iconColor: '#FF9900',
        description: 'Ingest IAM and network logs directly from your AWS environments in real-time.',
        status: 'connected',
        action: 'Configure'
    },
    {
        name: 'Splunk Forwarder',
        icon: Database,
        iconColor: 'var(--accent-blue)',
        description: 'Push validated threats and learned rules to your Splunk SIEM for centralized tracking.',
        status: 'disconnected',
        action: 'Connect'
    },
    {
        name: 'Slack Webhooks',
        icon: Slack,
        iconColor: '#E01E5A',
        description: 'Send automated critical alerts to your SOC team\'s Slack channels.',
        status: 'disconnected',
        action: 'Connect'
    },
    {
        name: 'Custom Webhook',
        icon: Webhook,
        iconColor: 'var(--text-muted)',
        description: 'Build a generic JSON webhook stream for any external orchestration tool.',
        status: 'disconnected',
        action: 'Create Endpoint'
    }
]

export default function Integrations() {
    return (
        <div className="page fade-in-scale stagger-1" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

            {/* ── PAGE HEADER (standard pattern) ── */}
            <div style={{ padding: '0 0 24px 0', marginBottom: '32px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Link2 size={32} color="var(--accent-purple)" />
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>System Integrations</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.8 }}>
                    Connect ThreatEngine OS to your existing security and operations infrastructure
                </p>
            </div>

            {/* ── INTEGRATION CARDS GRID ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {integrations.map((item, idx) => {
                    const Icon = item.icon
                    const isConnected = item.status === 'connected'
                    return (
                        <div
                            key={idx}
                            className={`card glass-panel slide-up stagger-${idx + 2}`}
                            style={{
                                padding: '28px',
                                borderRadius: '16px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'default'
                            }}
                        >
                            {/* Status badge */}
                            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 12px',
                                    borderRadius: '999px',
                                    letterSpacing: '0.03em',
                                    background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.04)',
                                    color: isConnected ? 'var(--accent-green)' : 'var(--text-muted)',
                                    border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`
                                }}>
                                    {isConnected ? '● Connected' : '○ Disconnected'}
                                </span>
                            </div>

                            {/* Icon */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <Icon size={24} style={{ color: item.iconColor }} />
                            </div>

                            {/* Text */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', margin: 0 }}>
                                    {item.name}
                                </h3>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    margin: '8px 0 0 0',
                                    lineHeight: '1.5'
                                }}>
                                    {item.description}
                                </p>
                            </div>

                            {/* Action */}
                            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                        borderRadius: '10px',
                                        padding: '8px 18px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        background: 'rgba(59, 130, 246, 0.12)',
                                        color: 'var(--accent-blue)',
                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {item.action}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
