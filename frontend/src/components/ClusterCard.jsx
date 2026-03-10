import React from 'react';
import { Layers, Activity } from 'lucide-react'

function ClusterCard({ result }) {
    const { cluster } = result
    const colors = {
        0: 'var(--accent-green)', 1: 'var(--accent-red)',
        2: 'var(--accent-orange)', 3: 'var(--accent-purple)'
    }
    const c = cluster?.cluster ?? 3
    const col = colors[c] || 'var(--text-secondary)'

    return (
        <div className="card">
            <div className="card-header"><Layers size={16} className="icon" style={{ marginRight: 6 }} /> Attack Cluster</div>
            <div className="cluster-card">
                <div style={{ marginBottom: '12px' }}>
                    <Activity size={40} color={col} />
                </div>
                <div className="cluster-number" style={{ color: col }}>{c}</div>
                <div className="cluster-label" style={{ color: col }}>{cluster?.label || 'Unknown'}</div>
                <div className="cluster-desc">{cluster?.description || ''}</div>
            </div>
        </div>
    )
}

export default ClusterCard;
