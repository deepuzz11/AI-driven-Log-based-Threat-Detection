import React from 'react';
import { FileText, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ExecutiveSummary({ result }) {
    if (!result) return null;

    const isAttack = result.decision === 'ATTACK';
    const confidence = result.confidence || 0;
    
    // Natural language summarization logic
    const getSummaryText = () => {
        if (!isAttack) {
            return `The system analyzed the log entry and determined it to be normal, benign traffic. No malicious patterns were identified by either the rule-based engine or the machine learning model.`;
        }

        const ruleHit = result.rule_hits && result.rule_hits.length > 0;
        const mlDetected = result.ml_details && result.ml_details.confidence > 50;
        
        let text = `A potential threat has been identified as **${result.prediction}**. `;
        
        if (ruleHit && mlDetected) {
            text += `This detection is highly reliable as it was cross-verified by both our signature-based rules (matching "${result.rule_hits[0].rule}") and our advanced machine learning model with ${confidence}% confidence. `;
        } else if (ruleHit) {
            text += `The activity was flagged by our signature-based engine matching a known attack pattern: "${result.rule_hits[0].rule}". `;
        } else {
            text += `Our AI engine detected anomalous behavior consistent with ${result.prediction} with ${confidence}% confidence, despite no direct signature match. `;
        }

        if (result.cluster) {
            text += `The event is classified under **${result.cluster.label}**, which typically involves ${result.cluster.description.toLowerCase()} `;
        }

        return text;
    };

    return (
        <div className="card glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${isAttack ? 'var(--accent-red)' : 'var(--accent-green)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <FileText size={18} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Security Executive Summary</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.6', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        opacity: 0.9 
                    }}>
                        {getSummaryText()}
                    </p>
                </div>
                
                <div style={{ 
                    width: '120px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Risk Level</div>
                    {isAttack ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <AlertTriangle size={24} color="var(--accent-red)" />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-red)', marginTop: '4px' }}>HIGH</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CheckCircle size={24} color="var(--accent-green)" />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '4px' }}>LOW</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Analysis Method: <strong style={{ color: 'var(--text-primary)' }}>{result.method}</strong>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={14} color="var(--accent-purple)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Ground Truth: <strong style={{ color: 'var(--text-primary)' }}>{result.ground_truth || 'Unknown'}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
