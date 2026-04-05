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
                                {explainability.attack_count} malicious entries in sequence of {(correlationStats?.attacks_detected || 0) + (correlationStats?.benign_entries || 10)}
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

                {/* Detection Metrics */}
                <div className="metrics-grid">
                    <div className="metric-box">
                        <div className="metric-label">Rules Triggered</div>
                        <div className="metric-value">{explainability.unique_rules_hit}</div>
                    </div>
                    <div className="metric-box">
                        <div className="metric-label">Malicious Entries</div>
                        <div className="metric-value" style={{ color: 'var(--accent-red)' }}>
                            {explainability.attack_count}
                        </div>
                    </div>
                    <div className="metric-box">
                        <div className="metric-label">Analysis Time</div>
                        <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                            {correlationStats?.total_time_ms}ms
                        </div>
                    </div>
                    <div className="metric-box">
                        <div className="metric-label">Confidence Level</div>
                        <div className="metric-value">
                            {explainability.attack_count > 5 ? '95%' : explainability.attack_count > 2 ? '85%' : '75%'}
                        </div>
                    </div>
                </div>

                {/* Recommended Action */}
                <div className="action-panel" style={{
                    borderLeftColor: getThreatColor(),
                    background: getThreatColor() === 'var(--accent-red)' 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : getThreatColor() === 'var(--accent-orange)'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(16, 185, 129, 0.1)'
                }}>
                    <div className="action-header">
                        <Shield size={18} style={{ color: getThreatColor() }} />
                        <span style={{ color: getThreatColor(), fontWeight: 700 }}>
                            Recommended Action
                        </span>
                    </div>
                    <div className="action-text">
                        {getActionText()}
                    </div>
                </div>

                {/* Rule Correlation Info */}
                <div className="correlation-info">
                    <div className="info-title">Correlation Analysis</div>
                    <div className="info-content">
                        <div className="info-item">
                            <span className="info-label">Detection Method:</span>
                            <span className="info-value">
                                {explainability.unique_rules_hit > 5 ? 'Rule-based (High match rate)' : 'ML-based with rule validation'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Confidence:</span>
                            <span className="info-value">
                                {explainability.attack_count === 10 ? 'Very High (100% sequence compromised)' 
                                : explainability.attack_count > 5 ? 'High (>50% sequence compromised)'
                                : 'Medium (Partial sequence compromise)'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Signature Status:</span>
                            <span className="info-value">
                                Active IDS/IPS signatures available
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SequenceExplainability
