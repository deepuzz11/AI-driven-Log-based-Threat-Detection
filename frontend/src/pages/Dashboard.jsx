import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Shield, Loader2, X, Activity } from 'lucide-react'

import SamplePicker from '../components/SamplePicker'
import LogViewer from '../components/LogViewer'
import PipelineTracker from '../components/PipelineTracker'
import VerdictCard from '../components/VerdictCard'
import ClusterCard from '../components/ClusterCard'
import ExplainPanel from '../components/ExplainPanel'
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

            // Notify if auto-rule was added
            if (data.auto_rule_added) {
                toast.custom((t) => (
                    <div className="custom-toast success slide-down">
                        <div className="custom-toast-icon"><Shield size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Rule Auto-Generated</div>
                            <div className="custom-toast-message">New signature "{data.new_rule_name}" added to rules.txt based on ML detection.</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '4s' }} />
                    </div>
                ), { duration: 4000 })
                
                // Update stats if available
                if (stats) {
                    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(console.error)
                }
            }

            if (data.decision === 'ATTACK') {
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

    }, [sample, stats])



    return (
        <div className="page-full fade-in-scale stagger-1">
            <div className="layout-apex">
                
                {/* ── COMMAND PANE 1: DEEP FORENSICS ── */}
                <div className="command-pane">
                    <SamplePicker
                        stats={stats}
                        rowIndex={rowIndex} setRowIndex={setRowIndex}
                        pickRandom={pickRandom} pickByIndex={pickByIndex}
                        runAnalysis={runAnalysis} loading={loading} analyzing={analyzing}
                        sample={sample}
                    />
                    <LogViewer sample={sample} />
                </div>

                {/* ── COMMAND PANE 2: INTELLIGENCE CORE ── */}
                <div className="command-pane">
                    <PipelineTracker state={pipelineState} result={result} />

                    {result ? (
                        <div className="analysis-report slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                                <div className="card-header" style={{ color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>APEX INTELLIGENCE BRIEFING — {result.prediction ? result.prediction.toUpperCase() : result.decision}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.4 }}>NODE-01 EXECUTION</span>
                                </div>
                                <div className="card-body">
                                    <ExecutiveSummary result={result} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <VerdictCard result={result} />
                                <ClusterCard result={result} />
                            </div>

                            <ExplainPanel result={result} />
                            
                            {result.rule_hits && result.rule_hits.length > 0 && (
                                <RuleHitsPanel ruleHits={result.rule_hits} />
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '80px 40px', textAlign: 'center', minHeight: '640px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.03), transparent)' }}>
                            <Activity size={64} style={{ color: 'var(--accent-blue)', opacity: 0.1, margin: '0 auto 32px' }} />
                            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Awaiting Operational Stream</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', maxWidth: '380px', margin: '0 auto', lineHeight: '1.6' }}>
                                Initialise the APEX intelligence pipeline by selecting a target log cluster from the forensics pane. 
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
