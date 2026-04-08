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
        if (state === 'step1' && key === 'rule') return 'active'
        if (state === 'step2' && key === 'ml') return 'active'
        
        if (state === 'rule-hit' || (result && result.rule_hits && result.rule_hits.length > 0)) {
            if (key === 'rule') return 'hit'
            if (state === 'rule-hit') {
                if (key === 'ml') return 'skip'
                if (key === 'out') return 'hit'
            }
        }
        
        if (state === 'ml-attack') {
            if (key === 'ml') return 'hit'
            if (key === 'out') return 'hit'
        }
        if (state === 'ml-benign') {
            if (key === 'ml') return 'pass'
            if (key === 'out') return 'pass'
        }
        
        if (key === 'rule' && (state === 'step2' || state === 'ml-attack' || state === 'ml-benign')) return 'pass'
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
            if (state === 'step1') return 'READY'
            if (state === 'step2') return 'ELABORATING...'
            if (state === 'rule-hit') return '⏭ SKIPPED'
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


