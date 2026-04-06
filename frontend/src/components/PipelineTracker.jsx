import React from 'react';
import { Zap, Bot, ClipboardCheck, Repeat } from 'lucide-react'

function PipelineTracker({ state, result }) {
    const steps = [
        { key: 'rule', icon: <Zap size={24} />, title: 'Step 1', sub: 'Rule Engine' },
        { key: 'ml', icon: <Bot size={24} />, title: 'Step 2', sub: 'ML Model' },
        { key: 'out', icon: <ClipboardCheck size={24} />, title: 'Output', sub: 'Decision' },
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
        
        // Pass remains for rule step if it wasn't a hit but state passed step 1
        if (key === 'rule' && (state === 'step2' || state === 'ml-attack' || state === 'ml-benign')) return 'pass'
        return ''
    }

    const getStatus = (key) => {
        if (state === 'idle') return '⏳ Idle'
        if (state === 'step1' && key === 'rule') return '🔍 Scanning...'
        if (state === 'step2') {
            if (key === 'rule') return '✓ No match'
            if (key === 'ml') return '🔍 Classifying...'
        }
        if (state === 'rule-hit' || (result && result.rule_hits && result.rule_hits.length > 0)) {
            if (key === 'rule') return '✕ ATTACK HIT'
            if (state === 'rule-hit') {
                if (key === 'ml') return '⏭ Skipped (Signature Match)'
                if (key === 'out') return '🚨 ATTACK DETECTED'
            }
        }
        
        if (state === 'ml-attack') {
            if (key === 'ml') return '✕ ATTACK HIT'
            if (key === 'out') return '🚨 ATTACK DETECTED'
            if (key === 'rule') return '✓ No Signature match'
        }
        if (state === 'ml-benign') {
            if (key === 'ml') return '✓ Benign'
            if (key === 'out') return '✓ BENIGN'
            if (key === 'rule') return '✓ Clear'
        }
        return ''
    }

    const getTime = (key) => {
        if (!result) return ''
        if (key === 'rule' && result.rule_time_ms) return `${result.rule_time_ms} ms`
        if (key === 'ml' && result.ml_time_ms) return `${result.ml_time_ms} ms`
        if (key === 'out' && result.total_time_ms) return `${result.total_time_ms} ms`
        return ''
    }

    return (
        <div className="card">
            <div className="card-header"><Repeat size={16} className="icon" style={{ marginRight: 6 }} /> Detection Pipeline</div>
            <div className="card-body">
                <div className="pipeline">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                            {i > 0 && <span className={`pipeline-arrow ${getStepClass(s.key) === 'active' || getStepClass(s.key) === 'hit' || getStepClass(s.key) === 'pass' ? 'active-flow' : ''}`} key={`arrow-${i}`}></span>}
                            <div className={`pipeline-step ${getStepClass(s.key)}`} key={`step-${s.key}`}>
                                <div className="pipeline-icon">{s.icon}</div>
                                <div className="pipeline-title">{s.title}</div>
                                <div className="pipeline-sub">{s.sub}</div>
                                <div className="pipeline-status">{getStatus(s.key)}</div>
                                <div className="pipeline-time">{getTime(s.key)}</div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PipelineTracker;
