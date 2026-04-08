import React from 'react'
import { AlertTriangle, TrendingUp, Zap, BarChart3 } from 'lucide-react'
import '../styles/CorrelationInsights.css'

function CorrelationInsights({ explainability, correlationStats, ruleHits }) {
    const getThreatLevelColor = (level) => {
        switch (level) {
            case 'CRITICAL':
                return 'var(--accent-red)'
            case 'HIGH':
                return 'var(--accent-orange)'
            case 'MEDIUM':
                return 'var(--accent-yellow)'
            case 'LOW':
                return 'var(--accent-cyan)'
            default:
                return 'var(--accent-green)'
        }
    }

    const getThreatLevelBg = (level) => {
        switch (level) {
            case 'CRITICAL':
                return 'rgba(239, 68, 68, 0.1)'
            case 'HIGH':
                return 'rgba(245, 158, 11, 0.1)'
            case 'MEDIUM':
                return 'rgba(234, 179, 8, 0.1)'
            case 'LOW':
                return 'rgba(6, 182, 212, 0.1)'
            default:
                return 'rgba(16, 185, 129, 0.1)'
        }
    }

    if (!explainability) {
        return (
            <div className="card">
                <div className="card-header">Correlation Analysis</div>
                <div className="card-body">
                    <div className="placeholder">No correlation data available</div>
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} className="icon" />
                    Correlation & Threat Intelligence
                </div>
            </div>
            <div className="card-body">
                {/* Threat Level Gauge */}
                <div className="threat-gauge" style={{
                    background: getThreatLevelBg(explainability.threat_level),
                    borderLeft: `4px solid ${getThreatLevelColor(explainability.threat_level)}`
                }}>
                    <div className="gauge-header">
                        <div className="gauge-icon" style={{ color: getThreatLevelColor(explainability.threat_level) }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="gauge-content">
                            <div className="gauge-label">Threat Level</div>
                            <div className="gauge-value" style={{ color: getThreatLevelColor(explainability.threat_level) }}>
                                {explainability.threat_level}
                            </div>
                        </div>
                    </div>
                    <div className="gauge-detail">
                        {explainability.attack_count || 0} of {(correlationStats?.benign_entries || 0) + (explainability.attack_count || 0) || 10} logs show malicious patterns
                    </div>
                </div>

                {/* Deduplicated: WHO/WHERE/WHAT/HOW and WHY ANALYSIS are now exclusively in SequenceExplainability */}

                {/* Correlation Multi-layered Stats */}
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-item">
                        <div className="stat-label">Total Sequence Analysis</div>
                        <div className="stat-value">{correlationStats?.total_time_ms}ms</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Transformer Inference</div>
                        <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{correlationStats?.dl_time_ms}ms</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Neural Probability</div>
                        <div className="stat-value" style={{ color: getThreatLevelColor(explainability.threat_level) }}>
                            {explainability.dl_probability || '0.0'}%
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Attack Events</div>
                        <div className="stat-value" style={{ color: 'var(--accent-red)' }}>
                            {explainability.attack_count}
                        </div>
                    </div>
                </div>

                {/* Rules Hit Summary */}
                {ruleHits && ruleHits.length > 0 && (
                    <div className="rules-section">
                        <div className="section-title">
                            <Zap size={14} style={{ marginRight: '6px' }} />
                            Top Triggered Rules
                        </div>
                        <div className="rules-list">
                            {ruleHits.slice(0, 5).map((rule, idx) => (
                                <div key={idx} className="rule-item">
                                    <div className="rule-icon">
                                        <Zap size={12} />
                                    </div>
                                    <div className="rule-details">
                                        <div className="rule-name">{rule.rule}</div>
                                        <div className="rule-info">
                                            {rule.category && (
                                                <span className="rule-badge">{rule.category}</span>
                                            )}
                                            {rule.severity && (
                                                <span className="severity-badge" style={{
                                                    background: rule.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: rule.severity === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-orange)'
                                                }}>
                                                    {rule.severity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CorrelationInsights
