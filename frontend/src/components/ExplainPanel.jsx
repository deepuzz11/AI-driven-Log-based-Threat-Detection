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
                        {result.feature_importance?.length > 0 && (
                            <div className="feature-list">
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                                    Top Contributing Features
                                </div>
                                {result.feature_importance.map((f, i) => {
                                    const maxImp = result.feature_importance[0].importance
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
                        {result.class_probabilities && Object.keys(result.class_probabilities).length > 0 && (
                            <div className="prob-grid">
                                {Object.entries(result.class_probabilities)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([cls, prob]) => (
                                        <div className="prob-item" key={cls}>
                                            <span className="prob-name">{cls}</span>
                                            <span className="prob-value" style={{
                                                color: prob > 30 ? 'var(--accent-red)' : 'var(--text-secondary)'
                                            }}>{prob}%</span>
                                            <div className="prob-bar">
                                                <div className="prob-bar-fill" style={{
                                                    width: `${prob}%`,
                                                    background: prob > 30 ? 'var(--accent-red)' : 'var(--accent-blue)'
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
