import React from 'react';
import { FileCode, Database } from 'lucide-react'

function LogViewer({ sample }) {
    if (!sample) return (
        <div className="card slide-up stagger-2">
            <div className="card-header">
                <FileCode size={16} style={{ marginRight: '10px', color: 'var(--text-muted)' }} /> 
                <span>Capture Buffer</span>
            </div>
            <div className="card-body" style={{ minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                    <Database size={48} style={{ marginBottom: '16px', margin: '0 auto' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Ingestion</div>
                </div>
            </div>
        </div>
    )

    const entries = Object.entries(sample.row)
    return (
        <div className="card slide-up stagger-2">
            <div className="card-header">
                <FileCode size={16} style={{ marginRight: '10px', color: 'var(--accent-green)' }} />
                <span>Analysis Captured Data — PROBE #{sample.index}</span>
            </div>
            <div className="card-body" style={{ padding: '0' }}>
                <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', fontFamily: '"JetBrains Mono", monospace' }}>
                        <tbody>
                            {entries.map(([k, v], idx) => (
                                <tr key={k} style={{ 
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                                }}>
                                    <td style={{ 
                                        padding: '12px 20px', 
                                        color: 'var(--text-muted)', 
                                        width: '160px', 
                                        borderRight: '1px solid rgba(255,255,255,0.03)',
                                        fontWeight: 500
                                    }}>
                                        {k}
                                    </td>
                                    <td style={{ padding: '12px 20px', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                                        {String(v)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default LogViewer;
