import React from 'react'
import { Search, AlertTriangle, Shield, Activity } from 'lucide-react'
import '../styles/SequenceExplainability.css'

function SequenceExplainability({ explainability, correlationStats }) {
    if (!explainability) {
        return (
            <div className="card">
                <div className="card-header">
                    <Search size={16} className="icon" style={{ marginRight: 6 }} />
                    Sequence Explainability
                </div>
                <div className="card-body">
                    <div className="placeholder">No explainability data available</div>
                </div>
            </div>
        )
    }

    const getThreatColor = () => {
        switch (explainability.threat_level) {
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

    const getActionText = () => {
        switch (explainability.threat_level) {
            case 'CRITICAL':
                return `Block IP ${explainability.who} immediately. Isolate host. Initiate incident response. Escalate to Tier-1 SOC.`
            case 'HIGH':
                return `Block IP ${explainability.who}. Monitor ${explainability.what} activity. Alert Tier-2 analyst. Review connections.`
            case 'MEDIUM':
                return `Log activity from ${explainability.who}. Track pattern evolution. Prepare firewall rules. Monitor for escalation.`
            case 'LOW':
                return `Monitor IP ${explainability.who}. Log event. Add to watchlist. Correlate with other events.`
            default:
                return 'No action required. Traffic appears benign.'
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <Search size={16} className="icon" style={{ marginRight: 6 }} />
                Sequence Explainability
            </div>
            <div className="card-body">
                {/* Threat Summary */}
                <div className="threat-summary" style={{ borderLeftColor: getThreatColor() }}>
                    <div className="threat-header">
                        <div className="threat-icon" style={{ color: getThreatColor() }}>
                            <AlertTriangle size={28} />
                        </div>
                        <div className="threat-text">
                            <div className="threat-title">
                                {explainability.threat_level} Risk Detected
                            </div>
                            <div className="threat-subtitle">
                                {explainability.attack_count || 0} malicious entries in sequence of {(correlationStats?.attacks_detected || 0) + (correlationStats?.benign_entries || 0) || 10}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SOC Model: WHO, WHERE, WHAT */}
                <div className="soc-analysis">
                    <div className="soc-section">
                        <div className="soc-header">
                            <div className="soc-question">WHO?</div>
                            <div className="soc-hint">Source of Attack</div>
                        </div>
                        <div className="soc-answer">
                            <div className="soc-value" style={{ fontFamily: "'Monaco', 'Courier', monospace" }}>
                                {explainability.who}
                            </div>
                            <div className="soc-meta">
                                Identified as primary threat actor in {explainability.attack_count} of sequence
                            </div>
                        </div>
                    </div>

                    <div className="soc-section">
                        <div className="soc-header">
                            <div className="soc-question">WHERE?</div>
                            <div className="soc-hint">Target / Destination</div>
                        </div>
                        <div className="soc-answer">
                            <div className="soc-value" style={{ fontFamily: "'Monaco', 'Courier', monospace" }}>
                                {explainability.where}
                            </div>
                            <div className="soc-meta">
                                Asset or service under attack
                            </div>
                        </div>
                    </div>

                    <div className="soc-section">
                        <div className="soc-header">
                            <div className="soc-question">WHAT?</div>
                            <div className="soc-hint">Attack Type / Category</div>
                        </div>
                        <div className="soc-answer">
                            <div className="soc-value" style={{ textTransform: 'capitalize' }}>
                                {explainability.what}
                            </div>
                            <div className="soc-meta">
                                Classification of threat
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attack Timeline */}
                {explainability.top_attacks && explainability.top_attacks.length > 0 && (
                    <div className="timeline-section">
                        <div className="timeline-title">Attack Pattern in Sequence</div>
                        <div className="timeline">
                            {explainability.top_attacks.map((attack, idx) => (
                                <div key={idx} className="timeline-entry">
                                    <div className="timeline-marker">
                                        <Activity size={14} />
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-attack">
                                            {attack.attack}
                                        </div>
                                        <div className="timeline-count">
                                            Detected {attack.count} time{attack.count > 1 ? 's' : ''} in sequence
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DL Probability Indicator */}
                <div className="dl-probability-meter" style={{ marginBottom: '24px' }}>
                    <div className="meter-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Neural Correlation Probability (Transformer)</span>
                        <span style={{ color: getThreatColor(), fontWeight: 800 }}>{explainability.dl_probability || '0.00'}%</span>
                    </div>
                    <div className="meter-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                            className="meter-bar" 
                            style={{ 
                                height: '100%', 
                                width: `${explainability.dl_probability || 0}%`, 
                                background: getThreatColor(),
                                boxShadow: `0 0 10px ${getThreatColor()}`,
                                transition: 'width 1s ease-out'
                            }} 
                        />
                    </div>
                </div>

                {/* WHY ANALYSIS (from DL Engine) */}
                {explainability.why_analysis && explainability.why_analysis.length > 0 && (
                    <div className="why-analysis-section" style={{ marginBottom: '24px' }}>
                        <div className="section-title" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            🧠 WHY Analysis (Neural Insights)
                        </div>
                        <div className="why-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {explainability.why_analysis.map((reason, idx) => (
                                <div key={idx} className="why-item" style={{ fontSize: '14px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', borderLeft: '2px solid var(--accent-blue)' }}>
                                    {reason}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended Action */}
                <div className="action-panel" style={{
                    borderLeftColor: getThreatColor(),
                    background: getThreatColor() === 'var(--accent-red)' 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : getThreatColor() === 'var(--accent-orange)'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(16, 185, 129, 0.1)',
                    marginBottom: '24px'
                }}>
                    <div className="action-header">
                        <Shield size={18} style={{ color: getThreatColor() }} />
                        <span style={{ color: getThreatColor(), fontWeight: 700 }}>
                            Recommended Actions
                        </span>
                    </div>
                    <div className="action-text">
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
                            {explainability.recommended_actions ? explainability.recommended_actions.map((action, idx) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>{action}</li>
                            )) : (
                                <li>{getActionText()}</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Rule Correlation Info */}
                <div className="correlation-info">
                    <div className="info-title">Hybrid Correlation Strategy</div>
                    <div className="info-content">
                        <div className="info-item">
                            <span className="info-label">Detection System:</span>
                            <span className="info-value">
                                {explainability.dl_probability > 70 ? 'Transformer Neural Engine (Primary)' : 'Hybrid Signature + DL Engine'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Confidence:</span>
                            <span className="info-value">
                                {explainability.dl_probability > 90 ? 'Critical Neural Certainty' 
                                : explainability.dl_probability > 50 ? 'High Confidence (Sequence Match)'
                                : 'Medium Confidence (Behavioral Anomaly)'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Learning Status:</span>
                            <span className="info-value" style={{ color: 'var(--accent-green)' }}>
                                Auto-generated Rule available for this vector
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SequenceExplainability
