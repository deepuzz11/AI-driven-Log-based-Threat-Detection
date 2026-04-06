import React from 'react';
import { FileCode, FileText, ChevronRight } from 'lucide-react'

function LogViewer({ sample }) {
    if (!sample) return (
        <div className="card glass-panel" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={14} className="icon" style={{ opacity: 0.6 }} /> 
                <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>Log Sequence Artifact</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                    <FileText size={40} style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: '12px' }}>Awaiting log ingestion...</div>
                </div>
            </div>
        </div>
    )

    // Filter out Ground Truth for the investigation overview
    const filteredEntries = Object.entries(sample.row).filter(([k]) => {
        const key = k.toLowerCase().trim()
        return key !== 'attack_cat' && key !== 'label'
    })

    return (
        <div className="card glass-panel fade-in" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={14} className="icon" style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Log Entry Source — ID#{sample.index}
                </span>
            </div>
            
            <div style={{ padding: '12px' }}>
                <div style={{ 
                    background: 'rgba(15, 23, 42, 0.4)', 
                    borderRadius: '8px', 
                    padding: '8px',
                    border: '1px solid var(--glass-border)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredEntries.map(([k, v]) => (
                            <div className="log-line" key={k} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '6px 12px',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                fontSize: '13px',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                <ChevronRight size={10} style={{ opacity: 0.2 }} />
                                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', width: '80px', flexShrink: 0, opacity: 0.8 }}>{k}</span>
                                <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>❯</span>
                                <span style={{ color: '#fff', wordBreak: 'break-all' }}>{String(v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Forensic Artifact Integrity: OK</span>
                <span style={{ fontSize: '10px', color: 'rgba(6, 182, 212, 0.5)', fontWeight: 800 }}>RAW SOURCE</span>
            </div>
        </div>
    )
}

export default LogViewer;
