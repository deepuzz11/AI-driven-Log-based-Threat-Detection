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

const API = '/api'

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [sample, setSample] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [pipelineState, setPipelineState] = useState('idle')
    const [rowIndex, setRowIndex] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    const [ruleForm, setRuleForm] = useState({ name: '', regex: '', category: '', severity: 'HIGH', remedy: '' })

    useEffect(() => {
        fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(console.error)
    }, [])

    const pickRandom = useCallback(async () => {
        setLoading(true); setResult(null); setPipelineState('idle')
        try {
            const r = await fetch(`${API}/sample/random`)
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
            const r = await fetch(`${API}/sample/${rowIndex}`)
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

        // Remove the standard toast.promise, as we want custom loading components
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
            const r = await fetch(`${API}/analyze`, {
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
            const r = await fetch(`${API}/add-rule`, {
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
        <div className="page-full fade-in-scale stagger-1">
            <div className="layout-pro" style={{ gridTemplateColumns: '420px 1fr 340px', gap: '28px' }}>
                
                {/* ── PANEL A: OPERATIONAL CORE ── */}
                <div className="side-panel">
                    <SamplePicker
                        stats={stats}
                        rowIndex={rowIndex} setRowIndex={setRowIndex}
                        pickRandom={pickRandom} pickByIndex={pickByIndex}
                        runAnalysis={runAnalysis} loading={loading} analyzing={analyzing}
                        sample={sample}
                    />
                    <LogViewer sample={sample} />
                </div>

                {/* ── PANEL B: INTELLIGENCE MATRIX ── */}
                <div className="center-panel">
                    <PipelineTracker state={pipelineState} result={result} />

                    {result ? (
                        <div className="analysis-report slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="card glass-panel" style={{ padding: '0', borderTop: '2px solid var(--accent-blue)', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
                                <div className="card-header" style={{ background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>MISSION CRITICAL VERDICT — {result.classification.toUpperCase()}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>STRATEGIC AUDIT v2.4</span>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <ExecutiveSummary result={result} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    <VerdictCard result={result} />
                                    <ExplainPanel result={result} />
                                    {result.rule_hits && result.rule_hits.length > 0 && (
                                        <RuleHitsPanel ruleHits={result.rule_hits} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    <ClusterCard result={result} />
                                    <SuggestPanel result={result} />
                                    <div className="card glass-panel" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>Sentinel Rule Hardening</h3>
                                        <RuleAddPanel ruleForm={ruleForm} setRuleForm={setRuleForm} addRule={addRule} ruleMsg={null} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card glass-panel slide-up" style={{ padding: '80px 40px', textAlign: 'center', minHeight: '680px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.03), transparent)' }}>
                            <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 40px' }}>
                                <div className="pulse-glow" style={{ position: 'absolute', inset: '-20px', background: 'var(--accent-blue)', borderRadius: '50%', filter: 'blur(30px)', opacity: 0.1, animation: 'pulse 3s infinite' }} />
                                <Activity size={80} style={{ color: 'var(--accent-blue)', opacity: 0.2 }} />
                            </div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Awaiting Operational Stream</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '440px', margin: '0 auto', lineHeight: '1.6' }}>
                                The intelligence engine is standing by. Initialise the forensic pipeline by selecting a target log cluster from the operational capture buffer.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── PANEL C: TACTICAL METRICS ── */}
                <div className="side-panel">
                    <div className="card glass-panel" style={{ padding: '24px', borderTop: '2px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '24px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={14} /> Sentinel Hub Metrics
                        </h3>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Ingested Logs</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: '"JetBrains Mono"', lineHeight: '1' }}>{stats?.total_logs || 0}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Threat Intercepts</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: '"JetBrains Mono"', lineHeight: '1', color: 'var(--accent-red)' }}>{stats?.malicious_count || 0}</div>
                            </div>
                            
                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Neural Precision</span>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)' }}>99.4%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: '99.4%', height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))', borderRadius: '10px' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', inset: '-4px', border: '2px solid var(--accent-green)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.05em' }}>STATUS: OPTIMAL</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sentinel Node 01-A Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
