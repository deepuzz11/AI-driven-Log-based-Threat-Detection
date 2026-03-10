import React from 'react';
import { Edit3, PlusCircle } from 'lucide-react'

function RuleAddPanel({ ruleForm, setRuleForm, addRule, ruleMsg }) {
    const update = (field, val) => setRuleForm(prev => ({ ...prev, [field]: val }))

    return (
        <div className="card fade-in" style={{ marginTop: 12 }}>
            <div className="card-header"><Edit3 size={16} className="icon" style={{ marginRight: 6 }} /> Add to Rules (Auto-Learned)</div>
            <div className="card-body">
                <div className="add-rule-grid">
                    <div className="form-group">
                        <label className="form-label">Rule Name</label>
                        <input className="form-input" value={ruleForm.name}
                            onChange={e => update('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input className="form-input" value={ruleForm.category}
                            onChange={e => update('category', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Severity</label>
                        <select className="form-select" value={ruleForm.severity}
                            onChange={e => update('severity', e.target.value)}>
                            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Regex Pattern</label>
                        <input className="form-input" value={ruleForm.regex}
                            onChange={e => update('regex', e.target.value)} />
                    </div>
                    <div className="form-group full">
                        <label className="form-label">Remedy / Notes</label>
                        <input className="form-input" value={ruleForm.remedy}
                            onChange={e => update('remedy', e.target.value)} />
                    </div>
                </div>
                <button className="btn btn-success" onClick={addRule} style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PlusCircle size={16} /> Add Rule to rules.txt</div>
                </button>
                {ruleMsg && (
                    <div className="rule-add-success fade-in" style={{
                        color: ruleMsg.type === 'success' ? 'var(--accent-green)' :
                            ruleMsg.type === 'warning' ? 'var(--accent-orange)' : 'var(--accent-red)',
                        background: ruleMsg.type === 'success' ? 'rgba(63,185,80,0.1)' :
                            ruleMsg.type === 'warning' ? 'rgba(227,179,65,0.1)' : 'rgba(248,81,73,0.1)',
                        borderColor: ruleMsg.type === 'success' ? 'rgba(63,185,80,0.2)' :
                            ruleMsg.type === 'warning' ? 'rgba(227,179,65,0.2)' : 'rgba(248,81,73,0.2)'
                    }}>
                        {ruleMsg.text}
                    </div>
                )}
            </div>
        </div>
    )
}

export default RuleAddPanel;
