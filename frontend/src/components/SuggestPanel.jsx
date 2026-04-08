import React from 'react';
import { Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react'

function SuggestPanel({ result }) {
    return (
        <div className="card">
            <div className="card-header"><Lightbulb size={16} className="icon" style={{ marginRight: 6 }} /> Suggestions</div>
            <div className="card-body">
                <div className="suggestion-text">
                    {result.suggestion || 'No specific suggestions.'}
                </div>
            </div>
        </div>
    )
}

export default SuggestPanel;
