import React, { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import '../styles/SequenceViewer.css'

function SequenceViewer({ sequenceLogs, explainability }) {
    const [expandedIndex, setExpandedIndex] = useState(null)

    if (!sequenceLogs || sequenceLogs.length === 0) {
        return (
            <div className="card">
                <div className="card-header">Log Sequence Analysis</div>
                <div className="card-body">
                    <div className="placeholder">No sequence data available</div>
                </div>
            </div>
        )
    }

    const getLogColor = (decision) => {
        if (decision === 'ATTACK') return 'var(--accent-red)'
        return 'var(--accent-green)'
    }

    const getThreatIcon = (decision) => {
        if (decision === 'ATTACK') {
            return <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
        }
        return <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
    }

    return (
        <div className="card">
            <div className="card-header">Log Sequence Correlation</div>
            <div className="card-body">
                <div className="sequence-timeline">
                    {sequenceLogs.map((log, idx) => (
                        <div key={log.index} className="sequence-item">
                            {/* Sequence connector */}
                            {idx < sequenceLogs.length - 1 && (
                                <div className="sequence-connector" style={{
                                    background: log.analysis.decision === 'ATTACK' 
                                        ? 'var(--accent-red)' 
                                        : 'var(--accent-green)'
                                }} />
                            )}

                            {/* Log entry */}
                            <div 
                                className="sequence-entry"
                                style={{
                                    borderLeftColor: getLogColor(log.analysis.decision),
                                    cursor: 'pointer'
                                }}
                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                            >
                                <div className="sequence-header">
                                    <div className="sequence-index">#{log.index}</div>
                                    <div className="sequence-meta">
                                        {getThreatIcon(log.analysis.decision)}
                                        <span className="sequence-decision" style={{
                                            color: getLogColor(log.analysis.decision)
                                        }}>
                                            {log.analysis.decision}
                                        </span>
                                        <span className="sequence-prediction">
                                            {log.analysis.prediction}
                                        </span>
                                    </div>
                                    <div className="sequence-flow">
                                        <span className="flow-item">
                                            <span className="flow-label">SRC:</span>
                                            <span className="flow-value">{log.src}</span>
                                        </span>
                                        <span className="flow-arrow">→</span>
                                        <span className="flow-item">
                                            <span className="flow-label">DST:</span>
                                            <span className="flow-value">{log.dst}</span>
                                        </span>
                                        <span className="flow-sep">|</span>
                                        <span className="flow-item">
                                            <span className="flow-label">{log.proto}</span>
                                            <span className="flow-value">/{log.service}</span>
                                        </span>
                                    </div>
                                    <div className="sequence-time">
                                        {log.analysis.total_time_ms}ms
                                    </div>
                                    {expandedIndex === idx ? (
                                        <ChevronUp size={18} />
                                    ) : (
                                        <ChevronDown size={18} />
                                    )}
                                </div>

                                {/* Expanded details */}
                                {expandedIndex === idx && (
                                    <div className="sequence-details">
                                        <div className="detail-section">
                                            <div className="detail-title">Detection Method</div>
                                            <div className="detail-content">
                                                <span className="detail-badge" style={{
                                                    background: log.analysis.method === 'rule-based' 
                                                        ? 'rgba(245, 158, 11, 0.2)' 
                                                        : 'rgba(59, 130, 246, 0.2)',
                                                    color: log.analysis.method === 'rule-based' 
                                                        ? 'var(--accent-orange)' 
                                                        : 'var(--accent-blue)'
                                                }}>
                                                    {log.analysis.method}
                                                </span>
                                            </div>
                                        </div>

                                        {log.analysis.rule_hits?.length > 0 && (
                                            <div className="detail-section">
                                                <div className="detail-title">Matched Rules</div>
                                                <div className="detail-content">
                                                    {log.analysis.rule_hits.map((rule, i) => (
                                                        <div key={i} className="detail-rule">
                                                            <span className="rule-name">{rule.rule}</span>
                                                            <span className="rule-cat">{rule.category}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {log.analysis.feature_importance?.length > 0 && (
                                            <div className="detail-section">
                                                <div className="detail-title">Top Features</div>
                                                <div className="detail-content">
                                                    {log.analysis.feature_importance.slice(0, 3).map((feat, i) => (
                                                        <div key={i} className="detail-feature">
                                                            <span>{feat.feature}</span>
                                                            <span className="feature-score">
                                                                {feat.importance.toFixed(4)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="detail-section">
                                            <div className="detail-title">Timing Breakdown</div>
                                            <div className="detail-content timing-breakdown">
                                                <div className="timing-item">
                                                    <span>Rule Engine</span>
                                                    <span className="timing-value">{log.analysis.rule_time_ms}ms</span>
                                                </div>
                                                <div className="timing-item">
                                                    <span>ML Model</span>
                                                    <span className="timing-value">{log.analysis.ml_time_ms}ms</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SequenceViewer
