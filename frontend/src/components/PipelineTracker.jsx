import React from 'react';
import { ShieldCheck, Cpu, Activity, Repeat } from 'lucide-react'

function PipelineTracker({ state, result }) {
    const steps = [
        { key: 'rule', icon: <ShieldCheck size={20} />, title: 'Step 1', sub: 'Rule-Based Engine' },
        { key: 'ml', icon: <Cpu size={20} />, title: 'Step 2', sub: 'ML Engine' },
        { key: 'out', icon: <Activity size={20} />, title: 'Final Result', sub: 'Output' },
    ]

    const getStepClass = (key) => {
        if (state === 'idle') return ''
        
        // Rule Engine Logic
        if (key === 'rule') {
            if (result && result.rule_hits && result.rule_hits.length > 0) return 'hit'
            if (state === 'step1') return 'active'
            if (state === 'step2' || state === 'ml-attack' || state === 'ml-benign') return 'pass'
        }

        // ML Engine Logic
        if (key === 'ml') {
            if (state === 'step2') return 'active'
            if (state === 'rule-hit') return 'active'
            if (state === 'ml-attack') return 'hit'
            if (state === 'ml-benign') return 'pass'
        }

        // Output Logic
        if (key === 'out') {
            if (state === 'ml-attack' || ((state === 'step2' || state === 'ml-attack' || state === 'ml-benign') && result?.rule_hits?.length > 0)) return 'hit'
            if (state === 'ml-benign') return 'pass'
        }
        
        return ''
    }

    const getStatus = (key) => {
        if (state === 'idle') return 'STANDBY'
        if (state === 'step1' && key === 'rule') return 'SCANNING...'
        
        // Rule Engine Check
        if (key === 'rule') {
            if (result && result.rule_hits && result.rule_hits.length > 0) return '✕ HIT DETECTED'
            if (state === 'step1') return 'SCANNING...'
            if (state === 'idle') return 'STANDBY'
            return '✓ CLEAR'
        }

        // ML Engine Check
        if (key === 'ml') {
            if (state === 'rule-hit') return '🔄 ANALYZING...'
            if (state === 'step2') return 'ELABORATING...'
            if (state === 'ml-attack') return '✕ ATTACK MATCH'
            if (state === 'ml-benign') return '✓ BENIGN'
            return 'READY'
        }

        // Output Check
        if (key === 'out') {
            if (state === 'rule-hit' || state === 'ml-attack') return '🚨 ALERT RAISED'
            if (state === 'ml-benign') return '✓ AUTHORIZED'
            return 'READY'
        }
        
        return 'READY'
    }

    const getTime = (key) => {
        if (!result) return ''
        if (key === 'rule' && result.rule_time_ms) return `${result.rule_time_ms}ms`
        if (key === 'ml' && result.ml_time_ms) return `${result.ml_time_ms}ms`
        if (key === 'out' && result.total_time_ms) return `Process: ${result.total_time_ms}ms`
        return ''
    }

    return (
        <div className="card">
            <div className="card-header">
                <Repeat size={14} className="icon" style={{ color: 'var(--accent-blue)' }} /> 
                <span>Detection Pipeline</span>
            </div>
            <div className="card-body">
                <div className="pipeline-container">
                    <div className="pipeline">
                        {steps.map((s, i) => (
                            <React.Fragment key={s.key}>
                                <div className={`pipeline-step ${getStepClass(s.key)}`}>
                                    <div className="pipeline-icon">{s.icon}</div>
                                    <div className="pipeline-info">
                                        <div className="pipeline-title">{s.title}</div>
                                        <div className="pipeline-sub">{s.sub}</div>
                                    </div>
                                    <div className="pipeline-status-badge">{getStatus(s.key)}</div>
                                    <div className="pipeline-time">{getTime(s.key)}</div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`pipeline-connector ${getStepClass(steps[i+1].key) ? 'active-flow' : ''}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PipelineTracker;


