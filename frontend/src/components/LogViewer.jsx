import React from 'react';
import { FileCode, FileText } from 'lucide-react'

function LogViewer({ sample }) {
    if (!sample) return (
        <div className="card">
            <div className="card-header"><FileCode size={16} className="icon" style={{ marginRight: 6 }} /> Log Entry</div>
            <div className="card-body">
                <div className="placeholder">
                    <div className="placeholder-icon"><FileText size={40} style={{ opacity: 0.5, marginBottom: 12 }} /></div>
                    No sample loaded
                </div>
            </div>
        </div>
    )

    const entries = Object.entries(sample.row)
    return (
        <div className="card fade-in">
            <div className="card-header">
                <FileCode size={16} className="icon" style={{ marginRight: 6 }} /> Log Entry — Row #{sample.index}
            </div>
            <div className="card-body">
                <div className="log-viewer">
                    {entries.map(([k, v]) => (
                        <div className="log-line" key={k}>
                            <span className="log-key">{k}</span>
                            <span className="log-sep">:</span>
                            <span className="log-value">{String(v)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LogViewer;
