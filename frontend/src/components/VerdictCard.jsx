import React from 'react';
import { Target, AlertTriangle, CheckCircle, Zap, Bot } from 'lucide-react'

function VerdictCard({ result }) {
    const isAttack = result.decision === 'ATTACK'
    return (
        <div className="card">
            <div className="card-header"><Target size={16} className="icon" style={{ marginRight: 6 }} /> Verdict</div>
            <div className="verdict">
                <div className="verdict-icon">{isAttack ? <AlertTriangle size={48} color="var(--accent-red)" /> : <CheckCircle size={48} color="var(--accent-green)" />}</div>
                <div className={`verdict-label ${isAttack ? 'attack' : 'benign'}`}>
                    {isAttack ? 'ATTACK DETECTED' : 'BENIGN TRAFFIC'}
                </div>
                <div className="verdict-info">
                    <span className="verdict-tag" style={{ alignSelf: 'center' }}>
                        {result.prediction}
                    </span>
                    <span className={`verdict-tag ${result.method === 'rule-based' ? 'method-rule' : 'method-ml'}`}
                        style={{ alignSelf: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{result.method === 'rule-based' ? <Zap size={14} /> : <Bot size={14} />} {result.method === 'rule-based' ? 'Rule-Based' : 'ML Model'}</div>
                    </span>
                </div>
                {result.confidence != null && (
                    <div className="confidence-bar">
                        <div className="confidence-text">
                            <span>Confidence</span>
                            <span>{result.confidence}%</span>
                        </div>
                        <div className="confidence-track">
                            <div className="confidence-fill"
                                style={{
                                    width: `${result.confidence}%`,
                                    background: isAttack ? 'var(--gradient-danger)' : 'var(--gradient-success)'
                                }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerdictCard;
