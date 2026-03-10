import React from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react'

function SuggestPanel({ result, sample }) {
    const gt = sample?.row?.attack_cat || ''
    const pred = result.prediction || ''
    const matches = gt && (pred.toLowerCase().includes(gt.toLowerCase()) ||
        gt.toLowerCase().includes(pred.toLowerCase()) ||
        (gt === 'Normal' && result.decision === 'BENIGN'))

    return (
        <div className="card">
            <div className="card-header"><Lightbulb size={16} className="icon" style={{ marginRight: 6 }} /> Suggestions</div>
            <div className="card-body">
                <div className="suggestion-text">
                    {result.suggestion || 'No specific suggestions.'}
                </div>
                {gt && (
                    <div className={`ground-truth ${matches ? 'match' : 'mismatch'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {matches ? <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--accent-orange)' }} />}
                        <span>Ground Truth: <strong>{gt}</strong></span>
                        <span style={{ marginLeft: 'auto', fontSize: 11 }}>
                            {matches ? 'Prediction matches!' : `Differs from prediction (${pred})`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SuggestPanel;
