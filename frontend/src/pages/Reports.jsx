import React, { useState } from 'react'
import { Search, Download, ShieldAlert, Bug, Wifi, AlertTriangle } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import IncidentModal from '../components/IncidentModal'

export default function Reports() {
    const [incidents, setIncidents] = useState([
        { id: 'REP-1049', date: '2026-03-09', type: 'Exploits', severity: 'Critical', status: 'Mitigated', icon: ShieldAlert },
        { id: 'REP-1048', date: '2026-03-08', type: 'Fuzzers', severity: 'High', status: 'Under Review', icon: Bug },
        { id: 'REP-1047', date: '2026-03-08', type: 'DoS', severity: 'Medium', status: 'Closed', icon: Wifi },
        { id: 'REP-1046', date: '2026-03-07', type: 'Reconnaissance', severity: 'Low', status: 'Closed', icon: AlertTriangle },
        { id: 'REP-1045', date: '2026-03-07', type: 'Backdoor', severity: 'Critical', status: 'Mitigated', icon: ShieldAlert },
        { id: 'REP-1044', date: '2026-03-06', type: 'Worms', severity: 'High', status: 'Closed', icon: Bug },
    ])

    const [selectedIncident, setSelectedIncident] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleStatusChange = (id, newStatus) => {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc))
    }

    const openDetails = (incident) => {
        setSelectedIncident(incident)
        setIsModalOpen(true)
    }

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
                            Incident Analysis
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Technical audit trail for intercepted anomalies and high-velocity threats.
                        </p>
                    </div>
                    <button className="btn btn-secondary slide-up stagger-3">
                        <Download size={16} /> Export Analysis Log
                    </button>
                </div>

                <div className="slide-up stagger-4" style={{ position: 'relative', marginBottom: '24px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-pro" placeholder="Search operational audit trail..." style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }} />
                </div>

                <div className="slide-up stagger-5 table-responsive" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Record ID</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Detection Date</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Threat Class</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Severity</th>
                                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Operational Resolution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map((r, i) => {
                                const Icon = r.icon
                                const sev = severityColor(r.severity)
                                return (
                                    <tr key={i} className="rule-row" style={{ borderBottom: '1px solid var(--border)', fontSize: '13px', cursor: 'pointer' }} onClick={() => openDetails(r)}>
                                        <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{r.id}</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{r.date}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                                                <Icon size={14} style={{ color: 'var(--accent-red)' }} /> {r.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className="glass-badge" style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.color}33`, fontSize: '11px', fontWeight: 700 }}>
                                                {r.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <StatusBadge status={r.status} onClick={(e) => { e.stopPropagation(); openDetails(r); }} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

            </div>

            <IncidentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                incident={selectedIncident}
                onStatusChange={handleStatusChange}
            />
        </div>
    )
}
