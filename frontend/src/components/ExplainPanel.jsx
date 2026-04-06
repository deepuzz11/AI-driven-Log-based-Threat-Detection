import React from 'react';
import { Search, Lightbulb } from 'lucide-react'

function ExplainPanel({ result }) {
    return (
        <div className="card">
            <div className="card-header"><Search size={16} className="icon" style={{ marginRight: 6 }} /> Explainability</div>
            <div className="card-body">
                {result.rule_hits?.length > 0 ? (
                    <div className="rule-hits-list">
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6 }}>
                            Matched Rules ({result.rule_hits.length})
                        </div>
                        {result.rule_hits.map((h, i) => (
                            <div className="rule-hit" key={i}>
                                <div className="rule-hit-name">{h.rule}</div>
                                <div className="rule-hit-detail">
                                    Category: {h.category} · Severity: {h.severity}
                                </div>
                                <div className="rule-hit-detail" style={{ color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                    <Lightbulb size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-orange)' }} />
                                    <span>{h.remedy}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {(result.feature_importance || result.ml_details?.feature_importance)?.length > 0 && (
                            <div className="feature-list">
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                                    Top Contributing Features
                                </div>
                                {(result.feature_importance || result.ml_details?.feature_importance).map((f, i) => {
                                    const features = (result.feature_importance || result.ml_details?.feature_importance);
                                    const maxImp = features[0].importance
                                    const pct = maxImp > 0 ? (f.importance / maxImp) * 100 : 0
                                    return (
                                        <div className="feature-item" key={i}>
                                            <span className="feature-name">{f.feature}</span>
                                            <div className="feature-bar-track">
                                                <div className="feature-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="feature-value">{f.importance.toFixed(4)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {(result.ml_details?.class_probabilities || result.class_probabilities) && 
                         Object.keys(result.ml_details?.class_probabilities || result.class_probabilities || {}).length > 0 && (
                            <div className="prob-grid" style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 8 }}>
                                    Prediction Confidence (All Classes)
                                </div>
                                {Object.entries(result.ml_details?.class_probabilities || result.class_probabilities || {})
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([cls, prob]) => (
                                        <div className="prob-item" key={cls}>
                                            <span className="prob-name">{cls}</span>
                                            <span className="prob-value" style={{
                                                color: prob > 40 ? 'var(--accent-red)' : 'var(--text-secondary)'
                                            }}>{prob}%</span>
                                            <div className="prob-bar">
                                                <div className="prob-bar-fill" style={{
                                                    width: `${prob}%`,
                                                    background: prob > 40 ? 'var(--accent-red)' : prob > 15 ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ExplainPanel;
