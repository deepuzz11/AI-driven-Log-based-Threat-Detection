import React from 'react';
import { Search, ShieldAlert, ShieldCheck, ChevronRight } from 'lucide-react'

function ExplainPanel({ result }) {
    const isAttack = result.decision === 'ATTACK' || (result.prediction && result.prediction !== 'Benign' && result.prediction !== 'Normal')
    const decisionColor = isAttack ? 'var(--accent-red)' : 'var(--accent-green)'

    return (
        <div className="card">
            <div className="card-header">
                <Search size={14} className="icon" style={{ color: decisionColor }} /> 
                <span>AI INTERPRETABILITY REPORT</span>
            </div>
            <div className="card-body">
                {/* ── NARRATIVE SUMMARY ── */}
                <div style={{ 
                    padding: '16px', 
                    background: isAttack ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                    border: `1px solid ${isAttack ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`,
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {isAttack ? <ShieldAlert size={16} color="var(--accent-red)" /> : <ShieldCheck size={16} color="var(--accent-green)" />}
                        <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: decisionColor }}>
                            {isAttack ? 'Threat Vector Identified' : 'Operational Baseline Match'}
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        {isAttack ? (
                            <>
                                The hybrid intelligence engine has flagged this traffic as <strong style={{ color: 'var(--accent-red)' }}>MALICIOUS</strong>. 
                                Analysis of high-entropy features indicates an active <strong style={{ color: 'var(--text-primary)' }}>{result.prediction || 'Attack Pattern'}</strong>.
                                The detection is anchored on significant deviations in the feature set below.
                            </>
                        ) : (
                            <>
                                This traffic stream aligns with known <strong style={{ color: 'var(--accent-green)' }}>SAFE BASELINES</strong>. 
                                No anomalous correlations or malicious signatures were identified during the multi-stage inspection.
                                Class probabilities remain within the nominal operational thresholds.
                            </>
                        )}
                    </div>
                </div>

                {result.feature_importance?.length > 0 && (
                    <div className="feature-list" style={{ marginBottom: result.ml_details?.class_probabilities && Object.keys(result.ml_details.class_probabilities).length > 0 ? '20px' : '0' }}>
                        <div style={{ 
                            fontSize: 10, 
                            fontWeight: 800, 
                            color: 'var(--text-muted)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <ChevronRight size={10} /> Feature Impact Weights (SHAP)
                        </div>
                        {result.feature_importance.map((f, i) => {
                            const maxImp = result.feature_importance[0].importance
                            const pct = maxImp > 0 ? (f.importance / maxImp) * 100 : 0
                            return (
                                <div className="feature-item" key={i}>
                                    <span className="feature-name">{f.feature}</span>
                                    <div className="feature-bar-track">
                                        <div className="feature-bar-fill" style={{ 
                                            width: `${pct}%`,
                                            background: isAttack ? 'var(--accent-red)' : 'var(--accent-blue)',
                                            opacity: 0.3 + (pct / 100) * 0.7
                                        }} />
                                    </div>
                                    <span className="feature-value">{f.importance.toFixed(4)}</span>
                                </div>
                            )
                        })}
                    </div>
                )}

                {result.ml_details?.class_probabilities && Object.keys(result.ml_details.class_probabilities).length > 0 && (
                    <div className="prob-grid" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px 4px' }}>
                            Neural Net Confidence Spectrum
                        </div>
                        {Object.entries(result.ml_details.class_probabilities)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 4) // Show top 4
                            .map(([cls, prob]) => (
                                <div className="prob-item" key={cls}>
                                    <span className="prob-name">{cls}</span>
                                    <span className="prob-value" style={{
                                        color: prob > 70 && isAttack ? 'var(--accent-red)' : 'var(--text-secondary)'
                                    }}>{prob}%</span>
                                    <div className="prob-bar">
                                        <div className="prob-bar-fill" style={{
                                            width: `${prob}%`,
                                            background: prob > 70 && isAttack ? 'var(--accent-red)' : 'var(--accent-blue)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExplainPanel;

