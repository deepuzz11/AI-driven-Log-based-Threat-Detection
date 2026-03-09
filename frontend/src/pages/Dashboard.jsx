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

const API = '/api'

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [sample, setSample] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [pipelineState, setPipelineState] = useState('idle')
    const [category, setCategory] = useState('ALL')
    const [rowIndex, setRowIndex] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    const [ruleForm, setRuleForm] = useState({ name: '', regex: '', category: '', severity: 'HIGH', remedy: '' })

    useEffect(() => {
        fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(console.error)
    }, [])

    const pickRandom = useCallback(async () => {
        setLoading(true); setResult(null); setPipelineState('idle')
        try {
            const r = await fetch(`${API}/sample/random?cat=${category}`)
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
    }, [category])

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
            await new Promise(r => setTimeout(r, 500)) // brief visual delay for step1
            const r = await fetch(`${API}/analyze`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row: sample.row })
            })
            const data = await r.json()

            if (data.method === 'rule-based') {
                setPipelineState('rule-hit')
            } else {
                setPipelineState('step2')
                await new Promise(r => setTimeout(r, 400)) // brief visual delay for step2
                setPipelineState(data.decision === 'ATTACK' ? 'ml-attack' : 'ml-benign')
            }

            setResult(data)

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
                            <div className="custom-toast-title">Rule Saved</div>
                            <div className="custom-toast-message">"{ruleForm.name}" added to rules.txt</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                    </div>
                ), { duration: 3000 })
                if (stats) setStats({ ...stats, rules_count: data.rules_count })
            } else {
                toast.custom((t) => (
                    <div className="custom-toast error slide-down">
                        <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Duplicate Rule</div>
                            <div className="custom-toast-message">A rule with this pattern already exists.</div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                    </div>
                ))
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
        <div className="main-layout layout-pro">

            {/* ── LEFT PANEL ── */}
            <div className="side-panel fade-in-scale stagger-1">
                <SamplePicker
                    stats={stats} category={category} setCategory={setCategory}
                    rowIndex={rowIndex} setRowIndex={setRowIndex}
                    pickRandom={pickRandom} pickByIndex={pickByIndex}
                    runAnalysis={runAnalysis} loading={loading} analyzing={analyzing}
                    sample={sample}
                />
                <LogViewer sample={sample} />
            </div>

            {/* ── CENTER PANEL ── */}
            <div className="center-panel fade-in-scale stagger-2">
                <PipelineTracker state={pipelineState} result={result} />

                {result ? (
                    <div className="slide-up stagger-3" style={{ marginTop: 24 }}>
                        {/* ── TABS NAVIGATION ── */}
                        <div className="tab-list">
                            <button
                                className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'deepdive' ? 'active' : ''}`}
                                onClick={() => setActiveTab('deepdive')}
                            >
                                Deep Dive
                            </button>
                            {result.decision === 'ATTACK' && (
                                <button
                                    className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('rules')}
                                >
                                    Rule Tuning
                                </button>
                            )}
                        </div>

                        {/* ── TABS CONTENT ── */}
                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="results-grid fade-in-scale">
                                    <VerdictCard result={result} />
                                    <ClusterCard result={result} />
                                </div>
                            )}

                            {activeTab === 'deepdive' && (
                                <div className="results-grid fade-in-scale">
                                    <ExplainPanel result={result} />
                                    <SuggestPanel result={result} sample={sample} />
                                </div>
                            )}

                            {activeTab === 'rules' && result.decision === 'ATTACK' && (
                                <div className="fade-in-scale">
                                    <RuleAddPanel
                                        ruleForm={ruleForm} setRuleForm={setRuleForm}
                                        addRule={addRule} ruleMsg={null}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card glass-panel slide-up stagger-3" style={{ padding: '64px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                        <h2 className="text-gradient" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Awaiting Data</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                            Select a sample from the left panel and run the hybrid analysis to see the detection pipeline in action.
                        </p>
                    </div>
                )}
            </div>

        </div>
    )
}
