import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

function RuleHitsPanel({ ruleHits }) {
    if (!ruleHits || ruleHits.length === 0) {
        return (
            <div className="card fade-in" style={{ marginTop: 12 }}>
                <div className="card-header"><Shield size={16} className="icon" style={{ marginRight: 6 }} /> Rule-Based Detection</div>
                <div className="card-body" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '14px' }}>No rule matches detected</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>ML model will be used for detection</div>
                </div>
            </div>
        )
    }

    // Categorize rule hits by severity
    const bySeverity = {
        'CRITICAL': [],
        'HIGH': [],
        'MEDIUM': [],
        'LOW': []
    }

    ruleHits.forEach(hit => {
        const severity = hit.severity || 'MEDIUM'
        if (bySeverity[severity]) {
            bySeverity[severity].push(hit)
        }
    })

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'var(--accent-red)'
            case 'HIGH': return 'var(--accent-orange)'
            case 'MEDIUM': return 'var(--accent-yellow)'
            case 'LOW': return 'var(--accent-blue)'
            default: return 'var(--text-secondary)'
        }
    }

    const getSeverityBg = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'rgba(248,81,73,0.1)'
            case 'HIGH': return 'rgba(227,179,65,0.1)'
            case 'MEDIUM': return 'rgba(255,193,7,0.1)'
            case 'LOW': return 'rgba(33,150,243,0.1)'
            default: return 'rgba(128,128,128,0.1)'
        }
    }

    return (
        <div className="card fade-in" style={{ marginTop: 12 }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} className="icon" style={{ color: 'var(--accent-orange)' }} /> 
                    Rule-Based Detection Hits
                    <span className="badge" style={{ marginLeft: '8px', fontSize: '12px' }}>{ruleHits.length}</span>
                </div>
            </div>
            <div className="card-body">
                {Object.entries(bySeverity).map(([severity, hits]) => 
                    hits.length > 0 ? (
                        <div key={severity} style={{ marginBottom: '16px' }}>
                            <div style={{ 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: getSeverityColor(severity),
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {severity} ({hits.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {hits.map((hit, idx) => (
                                    <div key={idx} style={{
                                        background: getSeverityBg(severity),
                                        border: `1px solid ${getSeverityColor(severity)}33`,
                                        borderRadius: '6px',
                                        padding: '12px',
                                        fontSize: '13px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '600', color: getSeverityColor(severity) }}>
                                                {hit.rule}
                                            </span>
                                            <span style={{ 
                                                background: getSeverityColor(severity),
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {hit.category?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        {hit.remedy && (
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: 'var(--text-secondary)',
                                                marginTop: '6px',
                                                fontStyle: 'italic',
                                                lineHeight: '1.4'
                                            }}>
                                                📋 {hit.remedy}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    )
}

export default RuleHitsPanel;
