import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Shield, Loader2, X } from 'lucide-react'

import SamplePicker from '../components/SamplePicker'
import LogViewer from '../components/LogViewer'
import PipelineTracker from '../components/PipelineTracker'
import VerdictCard from '../components/VerdictCard'
import ClusterCard from '../components/ClusterCard'
import ExplainPanel from '../components/ExplainPanel'
import SuggestPanel from '../components/SuggestPanel'
import RuleAddPanel from '../components/RuleAddPanel'
import RuleHitsPanel from '../components/RuleHitsPanel'
import SequenceViewer from '../components/SequenceViewer'
import CorrelationInsights from '../components/CorrelationInsights'
import SequenceExplainability from '../components/SequenceExplainability'
import ExecutiveSummary from '../components/ExecutiveSummary'

const API = '/api/sentinel'

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [sample, setSample] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [pipelineState, setPipelineState] = useState('idle')
    const [rowIndex, setRowIndex] = useState('')
    const [ruleForm, setRuleForm] = useState({ name: '', regex: '', category: '', severity: 'HIGH', remedy: '' })

    useEffect(() => {
        fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(console.error)
    }, [])

    const pickRandom = useCallback(async () => {
        setLoading(true); setResult(null); setPipelineState('idle')
        try {
            const r = await fetch(`${API}/investigate/sample/random`)
            const data = await r.json()
            setSample(data); setRowIndex(String(data.index))
            toast.custom((t) => (
                <div className="custom-toast success slide-down">
                    <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Sample Loaded</div>
                        <div className="custom-toast-message">Random sample #{data.index} acquired.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                    <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                </div>
            ), { duration: 3000 })
        } catch (e) {
            toast.custom((t) => (
                <div className="custom-toast error slide-down">
                    <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Failed</div>
                        <div className="custom-toast-message">Could not load random sample.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                </div>
            ))
            console.error(e)
        }
        setLoading(false)
    }, [])

    const pickByIndex = useCallback(async () => {
        if (!rowIndex) return
        setLoading(true); setResult(null); setPipelineState('idle')
        try {
            const r = await fetch(`${API}/investigate/sample/${rowIndex}`)
            if (!r.ok) throw new Error()
            const data = await r.json()
            setSample(data)
            toast.custom((t) => (
                <div className="custom-toast success slide-down">
                    <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Sample Loaded</div>
                        <div className="custom-toast-message">Row #{data.index} acquired from pipeline.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                    <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                </div>
            ), { duration: 3000 })
        } catch (e) {
            toast.custom((t) => (
                <div className="custom-toast error slide-down">
                    <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Error</div>
                        <div className="custom-toast-message">Sample index not found.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                </div>
            ))
        }
        setLoading(false)
    }, [rowIndex])

    const runAnalysis = useCallback(async () => {
        if (!sample) return
        setAnalyzing(true); setResult(null)
        setPipelineState('step1')

        const toastId = toast.custom((t) => (
            <div className="custom-toast loading slide-down">
                <div className="custom-toast-icon"><Loader2 size={18} className="spinner" /></div>
                <div className="custom-toast-content">
                    <div className="custom-toast-title">Analyzing</div>
                    <div className="custom-toast-message">Running hybrid detection pipeline...</div>
                </div>
            </div>
        ), { duration: Infinity })

        try {
            const r = await fetch(`${API}/investigate/analyze`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row: sample.row })
            })
            const data = await r.json()
            setResult(data) // Inform the pipeline immediately

            if (data.method === 'rule-based') {
                setPipelineState('rule-hit')
            } else {
                setPipelineState('step2')
                await new Promise(r => setTimeout(r, 150)) // Fast visual snap
                setPipelineState(data.decision === 'ATTACK' ? 'ml-attack' : 'ml-benign')
            }

            // Pre-fill rule form for attacks
            if (data.decision === 'ATTACK') {
                const clean = data.prediction.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                setRuleForm({
                    name: `ml_learned_${clean}_${Date.now()}`,
                    regex: `\\b${clean}\\b`,
                    category: data.prediction.split('/')[0].toLowerCase(),
                    severity: 'HIGH',
                    remedy: `Auto-learned from ${data.method} — ${data.prediction}`
                })

                toast.custom((t) => (
                    <div className="custom-toast error slide-down">
                        <div className="custom-toast-icon"><Shield size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Threat Detected</div>
                            <div className="custom-toast-message">{data.prediction} blocked.</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '4s' }} />
                    </div>
                ), { duration: 4000, id: toastId })

            } else {
                toast.custom((t) => (
                    <div className="custom-toast success slide-down">
                        <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Clean Traffic</div>
                            <div className="custom-toast-message">Traffic analyzed as Benign.</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                    </div>
                ), { duration: 3000, id: toastId })
            }
        } catch (e) {
            toast.custom((t) => (
                <div className="custom-toast error slide-down">
                    <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Analysis Failed</div>
                        <div className="custom-toast-message">Engine could not process the sample.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                </div>
            ), { id: toastId })
            setPipelineState('idle')
        } finally {
            setAnalyzing(false)
        }

    }, [sample])

    const addRule = useCallback(async () => {
        try {
            const r = await fetch(`${API}/rules/add`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleForm)
            })
            const data = await r.json()
            if (data.added) {
                toast.custom((t) => (
                    <div className="custom-toast success slide-down">
                        <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Rule Persisted</div>
                            <div className="custom-toast-message">"{ruleForm.name}" permanently added to rules.txt. Rule engine reloaded.</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                    </div>
                ), { duration: 4000 })
                if (stats) setStats({ ...stats, rules_count: data.rules_count })
            } else {
                toast.error(`Rule name "${ruleForm.name}" already exists in rules.txt`)
            }
        } catch (e) {
            toast.custom((t) => (
                <div className="custom-toast error slide-down">
                    <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                    <div className="custom-toast-content">
                        <div className="custom-toast-title">Save Failed</div>
                        <div className="custom-toast-message">Could not save the new rule.</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                </div>
            ))
        }
    }, [ruleForm, stats])


    return (
        <div className="main-layout layout-pro dashboard-page">

            {/* ── LEFT INVESTIGATION PANEL ── */}
            <div className="side-panel fade-in-scale stagger-1">
                <SamplePicker
                    stats={stats}
                    rowIndex={rowIndex} setRowIndex={setRowIndex}
                    pickRandom={pickRandom} pickByIndex={pickByIndex}
                    runAnalysis={runAnalysis} loading={loading} analyzing={analyzing}
                    sample={sample}
                />
                <LogViewer sample={sample} />
            </div>

            {/* ── PRIMARY DISCOVERY CONSOLE ── */}
            <div className="center-panel fade-in-scale stagger-2">
                <PipelineTracker state={pipelineState} result={result} />

                {result ? (
                    <div className="analysis-report slide-up stagger-3" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* ── TIER 1: VERDICT & FORENSIC CONSTRAINTS ── */}
                        <div className="results-grid fade-in-scale">
                            <VerdictCard result={result} />
                            <ClusterCard result={result} />
                        </div>

                        {/* ── TIER 2: EXECUTIVE INTELLIGENCE ── */}
                        <div className="fade-in-scale">
                            <ExecutiveSummary result={result} />
                        </div>

                        {/* ── TIER 3: TECHNICAL EXPLAINABILITY ── */}
                        <div className="results-grid fade-in-scale">
                            <ExplainPanel result={result} />
                            <SuggestPanel result={result} />
                        </div>

                        {/* ── TIER 4: SIGNATURE MATCHING (IF ANY) ── */}
                        {result.rule_hits && result.rule_hits.length > 0 && (
                            <div className="fade-in-scale">
                                <RuleHitsPanel ruleHits={result.rule_hits} />
                            </div>
                        )}

                        {/* ── TIER 5: ADAPTIVE HARDENING ── */}
                        <div className="fade-in-scale">
                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', marginTop: '8px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Shield size={18} color="var(--accent-blue)" />
                                    Security Policy Hardening
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', marginTop: '-8px' }}> 
                                    Update local signatures to permanently block similar traffic patterns across the cluster.
                                </p>
                                <RuleAddPanel
                                    ruleForm={ruleForm} setRuleForm={setRuleForm}
                                    addRule={addRule} ruleMsg={null}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card glass-panel slide-up stagger-3" style={{ padding: '80px 32px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.2 }}>🔍</div>
                        <h2 className="text-gradient" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Awaiting Forensic Data</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '340px', margin: '0 auto', lineHeight: 1.6 }}>
                            Initiate the hybrid analysis pipeline by selecting a log sample from the source manifest on the left.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
