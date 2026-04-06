import React, { useState } from 'react';
import { FileText, Shield, AlertTriangle, CheckCircle, Info, Activity, Zap, ClipboardList } from 'lucide-react';

export default function ExecutiveSummary({ result }) {
    const [activeTab, setActiveTab] = useState('narrative');

    if (!result) return null;

    const isAttack = result.decision === 'ATTACK';
    const confidence = result.confidence || 0;
    
    // Cleanup prediction for display (remove markdown if any)
    const cleanPrediction = (result.prediction || '').replace(/\*\*/g, '');
    const cleanCluster = (result.cluster?.label || '').replace(/\*\*/g, '');

    const tabs = [
        { id: 'narrative', label: 'Primary Narrative', icon: FileText },
        { id: 'forensics', label: 'Forensic Context', icon: Activity },
        { id: 'remediation', label: 'Response Strategy', icon: Zap },
    ];

    const getNarrative = () => {
        if (!isAttack) {
            return `The system analyzed the log entry and determined it to be normal, benign traffic. No malicious patterns were identified by either the rule-based engine or the machine learning model. Operational integrity remains optimal.`;
        }

        const ruleHit = result.rule_hits && result.rule_hits.length > 0;
        
        let text = `A potential threat has been identified as ${cleanPrediction}. `;
        
        if (ruleHit && confidence > 80) {
            text += `This detection is verified by both our signature-based rules (matching "${result.rule_hits[0].rule}") and our advanced machine learning model with ${confidence}% confidence. `;
        } else if (ruleHit) {
            text += `The activity was flagged by our signature-based engine matching a known attack pattern: "${result.rule_hits[0].rule}". `;
        } else {
            text += `Our AI engine detected anomalous behavior consistent with ${cleanPrediction} with ${confidence}% confidence, despite no direct signature match. `;
        }

        if (result.cluster) {
            text += `The event is classified under ${cleanCluster}, which typically involves ${result.cluster.description.toLowerCase()} `;
        }

        return text;
    };

    return (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${isAttack ? 'var(--accent-red)' : 'var(--accent-green)'}` }}>
            
            {/* ── TAB NAVIGATION ── */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                background: active ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                                border: 'none',
                                borderBottom: active ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                                color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ padding: '24px', display: 'flex', gap: '32px' }}>
                <div style={{ flex: 1 }}>
                    {activeTab === 'narrative' && (
                        <div className="slide-up">
                            <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Investigation Narrative</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)', margin: 0, opacity: 0.9 }}>
                                {getNarrative()}
                            </p>
                        </div>
                    )}

                    {activeTab === 'forensics' && (
                        <div className="slide-up">
                            <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Intelligence Context</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="card" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Classification</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: isAttack ? 'var(--accent-red)' : 'var(--accent-green)' }}>{cleanPrediction || 'N/A'}</div>
                                </div>
                                <div className="card" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vector Group</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{cleanCluster || 'Generic Cluster'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'remediation' && (
                        <div className="slide-up">
                            <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Response strategy</h4>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <Zap size={16} color="var(--accent-red)" style={{ marginTop: '2px' }} />
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                        {result.suggestion || 'Initiate manual triage and quarantine affected host segment immediately.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* ── RISK SCORECARD ── */}
                <div style={{ 
                    width: '160px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid var(--glass-border)'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Confidence</div>
                    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle cx="40" cy="40" r="36" fill="none" 
                                stroke={isAttack ? 'var(--accent-red)' : 'var(--accent-green)'} 
                                strokeWidth="6" 
                                strokeDasharray={`${(confidence / 100) * 226} 226`}
                                strokeLinecap="round"
                                transform="rotate(-90 40 40)"
                            />
                        </svg>
                        <div style={{ position: 'absolute', fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(confidence)}%</div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER METADATA ── */}
            <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={12} color="var(--accent-cyan)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MODEL: <span style={{ color: 'var(--text-primary)' }}>{result.method || 'HYBRID-SENTINEL'}</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClipboardList size={12} color="var(--accent-purple)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS: <span style={{ color: isAttack ? 'var(--accent-red)' : 'var(--accent-green)' }}>{isAttack ? 'MALICIOUS_LOG_DETECTED' : 'TRAFFIC_VALIDATED_CLEAN'}</span></span>
                    </div>
                </div>
                {/* Ground Truth removed as requested */}
            </div>
        </div>
    );
}
