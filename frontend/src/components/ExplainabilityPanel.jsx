/**
 * Unified Explainability Component
 * Merges ExplainPanel & SequenceExplainability into single reusable component
 * Supports both single-log and sequence-level analysis
 */

import React from 'react'
import { Search, AlertTriangle, Lightbulb, TrendingUp, Database } from 'lucide-react'
import {
    THREAT_LEVELS,
    getThreatColor,
    getThreatBgColor,
    getThreatBorderColor,
    getRecommendedAction,
    DETECTION_METHODS,
    formatConfidence,
    getAttackTypeInfo
} from '../utils/threatLevelUtils'

export default function ExplainabilityPanel({ 
    result, 
    isSequence = false, 
    correlationStats = null,
    expandedView = false 
}) {
    if (!result) {
        return (
            <div className="card">
                <div className="card-header">
                    <Search size={16} className="icon" style={{ marginRight: 6 }} />
                    Explainability Analysis
                </div>
                <div className="card-body">
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        <p>No analysis data available. Run analysis to generate explainability report.</p>
                    </div>
                </div>
            </div>
        )
    }

    // ─── SINGLE LOG ANALYSIS ───
    if (!isSequence) {
        return (
            <div className="card">
                <div className="card-header">
                    <Search size={16} className="icon" style={{ marginRight: 6 }} />
                    Log Analysis - Explainability
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Detection Verdict */}
                    <div style={{
                        padding: '16px',
                        background: result.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        border: `1px solid ${result.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: '4px',
                                background: result.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: result.decision === 'ATTACK' ? 'var(--accent-red)' : 'var(--accent-green)'
                            }}>
                                {result.decision === 'ATTACK' ? '🚨 THREAT' : '✓ SAFE'}
                            </div>
                            <div style={{ fontWeight: 600 }}>
                                {result.decision === 'ATTACK' ? `${result.prediction} Detected` : 'Normal Traffic'}
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Confidence: {formatConfidence(result.confidence)} | Method: {result.detection_method}
                        </div>
                    </div>

                    {/* Rule Hits */}
                    {result.rule_hits && result.rule_hits.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Database size={14} /> MATCHED RULES ({result.rule_hits.length})
                            </div>
                            {result.rule_hits.map((h, i) => (
                                <div key={i} style={{
                                    padding: '12px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    marginBottom: i < result.rule_hits.length - 1 ? '8px' : '0'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{h.rule}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Category: {h.category} • Severity: {h.severity}
                                    </div>
                                    <div style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                        <Lightbulb size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-blue)' }} />
                                        <span>{h.remedy}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Feature Importance */}
                    {result.feature_importance && result.feature_importance.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <TrendingUp size={14} /> TOP CONTRIBUTING FEATURES
                            </div>
                            {result.feature_importance.slice(0, 5).map((f, i) => {
                                const maxImp = result.feature_importance[0].importance
                                const pct = maxImp > 0 ? (f.importance / maxImp) * 100 : 0
                                return (
                                    <div key={i} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 500 }}>{f.feature}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{f.importance.toFixed(4)}</span>
                                        </div>
                                        <div style={{ background: 'var(--bg-surface)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Class Probabilities */}
                    {result.class_probabilities && Object.keys(result.class_probabilities).length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>
                                MODEL PROBABILITIES
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {Object.entries(result.class_probabilities).map(([cls, prob]) => (
                                    <div key={cls} style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{cls}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: cls === 'Attack' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                            {(prob * 100).toFixed(1)}%
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

    // ─── SEQUENCE ANALYSIS ───
    const threatLevel = result.explainability?.threat_level || 'NONE'
    const threatInfo = THREAT_LEVELS[threatLevel] || THREAT_LEVELS.NONE

    return (
        <div className="card">
            <div className="card-header">
                <Search size={16} className="icon" style={{ marginRight: 6 }} />
                Sequence Explainability & Recommendations
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Threat Summary */}
                <div style={{
                    padding: '16px',
                    background: threatInfo.bgColor,
                    border: `2px solid ${threatInfo.borderColor}`,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${threatInfo.color}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ color: threatInfo.color, fontSize: '24px' }}>
                            {threatLevel === 'CRITICAL' ? '⚠️' : threatLevel === 'HIGH' ? '🔴' : threatLevel === 'MEDIUM' ? '🟡' : '🟢'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: threatInfo.color, marginBottom: '4px' }}>
                                {threatInfo.label} THREAT DETECTED
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {(result.explainability?.attack_count || 0)} malicious entries in sequence of {(correlationStats?.total_logs || 10)} logs • Threat: {threatInfo.description}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SOC Analysis: WHO/WHERE/WHAT */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.1em' }}>
                        🔍 SOC ANALYSIS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: expandedView ? '1fr' : '1fr 1fr', gap: '16px' }}>
                        
                        {/* WHO */}
                        <div style={{
                            padding: '14px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>WHO (Source)</div>
                            <div style={{
                                fontSize: '14px',
                                fontFamily: "'Monaco', 'Courier', monospace",
                                fontWeight: 600,
                                color: 'var(--accent-blue)',
                                marginBottom: '6px'
                            }}>
                                {result.explainability?.who || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Primary threat actor identified in {result.explainability?.attack_count || 0} events
                            </div>
                        </div>

                        {/* WHERE */}
                        <div style={{
                            padding: '14px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>WHERE (Target)</div>
                            <div style={{
                                fontSize: '14px',
                                fontFamily: "'Monaco', 'Courier', monospace",
                                fontWeight: 600,
                                color: 'var(--accent-cyan)',
                                marginBottom: '6px'
                            }}>
                                {result.explainability?.where || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Destination or target service being attacked
                            </div>
                        </div>

                        {/* WHAT */}
                        <div style={{
                            padding: '14px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>WHAT (Attack Type)</div>
                            <div style={{
                                fontSize: '14px',
                                fontFamily: "'Monaco', 'Courier', monospace",
                                fontWeight: 600,
                                color: 'var(--accent-orange)',
                                marginBottom: '6px'
                            }}>
                                {result.explainability?.what || 'Generic'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Classification of observed malicious behavior
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommended Actions */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: threatInfo.color, marginBottom: '12px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lightbulb size={14} /> RECOMMENDED ACTIONS
                    </div>
                    <div style={{
                        padding: '14px',
                        background: threatInfo.bgColor,
                        border: `1px solid ${threatInfo.borderColor}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: '1.6'
                    }}>
                        {getRecommendedAction(
                            threatLevel,
                            result.explainability?.who || 'Unknown IP',
                            result.explainability?.what || 'Unknown attack'
                        )}
                    </div>
                </div>

                {/* Summary Statistics */}
                {correlationStats && (
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.1em' }}>
                            📊 CORRELATION STATISTICS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: expandedView ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attack Rate</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>
                                    {correlationStats.total_logs > 0 ? 
                                        ((correlationStats.attacks_detected / correlationStats.total_logs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Benign</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green)' }}>
                                    {correlationStats.benign_entries}
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Logs</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>
                                    {correlationStats.total_logs}
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Detection Method</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                    {result.explainability?.detection_method || 'Hybrid'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
