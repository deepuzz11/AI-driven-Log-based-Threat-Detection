import React from 'react'
import { Search, Download, AlertTriangle, ShieldAlert, Bug, Wifi } from 'lucide-react'

export default function Reports() {
    const reports = [
        { id: 'REP-1049', date: '2026-03-09', type: 'Exploits', severity: 'Critical', status: 'Mitigated', icon: ShieldAlert },
        { id: 'REP-1048', date: '2026-03-08', type: 'Fuzzers', severity: 'High', status: 'Under Review', icon: Bug },
        { id: 'REP-1047', date: '2026-03-08', type: 'DoS', severity: 'Medium', status: 'Closed', icon: Wifi },
        { id: 'REP-1046', date: '2026-03-07', type: 'Reconnaissance', severity: 'Low', status: 'Closed', icon: AlertTriangle },
        { id: 'REP-1045', date: '2026-03-07', type: 'Backdoor', severity: 'Critical', status: 'Mitigated', icon: ShieldAlert },
        { id: 'REP-1044', date: '2026-03-06', type: 'Worms', severity: 'High', status: 'Closed', icon: Bug },
    ]

    const severityColor = (s) => {
        if (s === 'Critical') return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)' }
        if (s === 'High') return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }
        if (s === 'Medium') return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }
        return { bg: 'var(--bg-surface)', color: 'var(--text-secondary)' }
    }

    return (
        <div className="page-full fade-in-scale stagger-1">
            <div className="card glass-panel slide-up stagger-2" style={{ padding: '24px 28px' }}>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                    <div className="slide-up stagger-3">
                        <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                            Incident Reports
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Detailed logs of previously intercepted zero-day threats and anomalies.
                        </p>
                    </div>
                    <button className="btn btn-secondary slide-up stagger-3">
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                <div className="slide-up stagger-4" style={{ position: 'relative', marginBottom: '24px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-input" placeholder="Search report ID or threat type..." style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }} />
                </div>

                <div className="slide-up stagger-5 table-responsive" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Report ID</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Detected</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Threat Category</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Severity</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resolution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r, i) => {
                                const Icon = r.icon
                                const sev = severityColor(r.severity)
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.id}</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{r.date}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Icon size={14} style={{ color: 'var(--accent-red)' }} /> {r.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className="glass-badge" style={{ backgroundColor: sev.bg, color: sev.color }}>
                                                {r.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: r.status === 'Mitigated' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{r.status}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
