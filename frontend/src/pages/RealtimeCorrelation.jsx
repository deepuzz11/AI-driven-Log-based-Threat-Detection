import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Play, Square, Zap, BarChart3, TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, X, Loader2, Search } from 'lucide-react'
import SequenceViewer from '../components/SequenceViewer'
import CorrelationInsights from '../components/CorrelationInsights'
import SequenceExplainability from '../components/SequenceExplainability'
import '../styles/RealtimeCorrelation.css'

const API = '/api'

export default function RealtimeCorrelation() {
    const [isRunning, setIsRunning] = useState(false)
    const [logsCount, setLogsCount] = useState(0)
    const [eventRate, setEventRate] = useState('5')
    const [correlationData, setCorrelationData] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recentLogs, setRecentLogs] = useState([])
    const [threatHistory, setThreatHistory] = useState([])
    const [autoLearnedRules, setAutoLearnedRules] = useState([])
    const eventSourceRef = useRef(null)
    const logCounterRef = useRef(0)

    // Start real-time log generation
    const startRealtimeGeneration = useCallback(async () => {
        try {
            const eps = parseInt(eventRate) || 5
            await fetch(`${API}/realtime/start?eps=${eps}`, { method: 'POST' })
            setIsRunning(true)
            logCounterRef.current = 0
            setRecentLogs([])
            setThreatHistory([])
            
            toast.success(`Real-time log generation started at ${eps} EPS`)

            // Connect to SSE stream
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }

            eventSourceRef.current = new EventSource(`${API}/stream`)

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const analysis = JSON.parse(event.data)
                    logCounterRef.current += 1
                    setLogsCount(logCounterRef.current)

                    // Keep last 20 logs in memory
                    setRecentLogs(prev => [...prev.slice(-19), {
                        count: logCounterRef.current,
                        analysis,
                        timestamp: new Date().toLocaleTimeString()
                    }])

                    // Track threat events for history
                    if (analysis.decision === 'ATTACK') {
                        setThreatHistory(prev => [...prev.slice(-9), {
                            count: logCounterRef.current,
                            prediction: analysis.prediction,
                            confidence: analysis.confidence,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                    }
                } catch (e) {
                    console.error('Error parsing stream data:', e)
                }
            }

            eventSourceRef.current.onerror = () => {
                setIsRunning(false)
                eventSourceRef.current?.close()
                toast.error('Stream connection lost')
            }

        } catch (e) {
            toast.error('Failed to start real-time generation')
            console.error(e)
        }
    }, [eventRate])

    // Stop real-time generation
    const stopRealtimeGeneration = useCallback(async () => {
        try {
            await fetch(`${API}/realtime/stop`, { method: 'POST' })
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
            setIsRunning(false)
            toast.success('Real-time log generation stopped')
        } catch (e) {
            toast.error('Failed to stop real-time generation')
        }
    }, [])

    // Analyze recent logs with correlation and auto-learning
    const analyzeRealtimeCorrelation = useCallback(async () => {
        setIsAnalyzing(true)

        try {
            const response = await fetch(
                `${API}/realtime/correlate-stream?window_size=10`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            )

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const data = await response.json()
            setCorrelationData(data)

            // Show newly learned rules
            if (data.auto_learned_rules && data.auto_learned_rules.length > 0) {
                setAutoLearnedRules(prev => [
                    ...prev.slice(-(4)),
                    ...data.auto_learned_rules
                ])

                toast.custom((t) => (
                    <div className="custom-toast success slide-down">
                        <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Rules Auto-Learned</div>
                            <div className="custom-toast-message">
                                {data.auto_learned_rules.length} new rules added to rules.txt
                            </div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
                    </div>
                ), { duration: 3000 })
            }

            const threatLevel = data?.explainability?.threat_level
            if (threatLevel && threatLevel !== 'NONE') {
                toast.custom((t) => (
                    <div className="custom-toast error slide-down">
                        <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">{threatLevel} Threat Detected</div>
                            <div className="custom-toast-message">
                                {data?.explainability?.attack_count || 0} malicious entries in stream
                            </div>
                        </div>
                        <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                        <div className="custom-toast-progress" style={{ animationDuration: '4s' }} />
                    </div>
                ), { duration: 4000 })
            }
        } catch (e) {
            toast.error('Correlation analysis failed')
            console.error(e)
        } finally {
            setIsAnalyzing(false)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    return (
        <div className="page realtime-correlation-page realtime-page">
            <div className="page-header" style={{ padding: '0 0 24px 0', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div className="page-title-section">
                    <Zap size={28} className="page-icon active" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>Real-Time Correlation & Auto-Learning</h1>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '13px' }}>Generate live logs, detect threats, and automatically learn new rules</p>
                    </div>
                </div>
            </div>

            <div className="page-content">
                {/* Control Panel */}
                <div className="card control-panel" style={{ marginBottom: '24px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                    <div className="card-header" style={{ background: 'var(--bg-surface)', padding: '12px 20px' }}>Real-Time Configuration</div>
                    <div className="card-body">
                        <div className="control-grid">
                            <div className="control-group">
                                <label>Generation Status</label>
                                <div className="status-display">
                                    <div className={`status-badge ${isRunning ? 'active' : 'inactive'}`}>
                                        <div className="status-dot"></div>
                                        {isRunning ? 'STREAMING' : 'STOPPED'}
                                    </div>
                                </div>
                            </div>

                            <div className="control-group">
                                <label>Logs Generated</label>
                                <div className="log-counter">{logsCount}</div>
                            </div>

                            <div className="control-group">
                                <label>Event Rate (EPS)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={eventRate}
                                    onChange={(e) => setEventRate(e.target.value)}
                                    disabled={isRunning}
                                    className="input-field"
                                />
                            </div>

                            <div className="control-group">
                                <label>Rules Loaded</label>
                                <div className="rules-count">
                                    {correlationData?.rules_count || 0}
                                </div>
                            </div>
                        </div>

                        <div className="control-actions">
                            {!isRunning ? (
                                <button onClick={startRealtimeGeneration} className="btn btn-primary">
                                    <Play size={16} />
                                    Start Streaming
                                </button>
                            ) : (
                                <button onClick={stopRealtimeGeneration} className="btn btn-danger">
                                    <Square size={16} />
                                    Stop Streaming
                                </button>
                            )}

                            <button
                                onClick={analyzeRealtimeCorrelation}
                                disabled={!isRunning || isAnalyzing}
                                className="btn btn-secondary"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 size={16} className="spinner" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp size={16} />
                                        Analyze Correlation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Auto-Learned Rules */}
                {autoLearnedRules.length > 0 && (
                    <div className="card auto-learned-panel fade-in">
                        <div className="card-header">
                            <Zap size={16} style={{ marginRight: '6px' }} />
                            Recently Auto-Learned Rules
                        </div>
                        <div className="card-body">
                            <div className="rules-timeline">
                                {autoLearnedRules.map((rule, idx) => (
                                    <div key={idx} className="rule-timeline-item">
                                        <div className="rule-time-marker"></div>
                                        <div className="rule-content">
                                            <div className="rule-header">
                                                <span className="rule-name">{rule.rule_name}</span>
                                                <span className="rule-source">{rule.source}</span>
                                            </div>
                                            <div className="rule-meta">
                                                Category: <strong>{rule.category}</strong>
                                            </div>
                                            <div className="rule-pattern" title={rule.pattern}>
                                                {(rule.pattern || "").substring(0, 80)}
                                                {(rule.pattern || "").length > 80 ? '...' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Threat History */}
                {threatHistory.length > 0 && (
                    <div className="card threat-history-panel">
                        <div className="card-header">
                            <BarChart3 size={16} style={{ marginRight: '6px' }} />
                            Threat Detection Timeline
                        </div>
                        <div className="card-body">
                            <div className="threat-timeline">
                                {threatHistory.map((threat, idx) => (
                                    <div key={idx} className="threat-entry">
                                        <span className="threat-time">{threat.timestamp}</span>
                                        <span className="threat-log">Log #{threat.count}</span>
                                        <span className="threat-prediction">{threat.prediction}</span>
                                        <span className="threat-confidence">
                                            {threat.confidence}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Logs Stream */}
                {recentLogs.length > 0 && (
                    <div className="card realtime-logs-panel">
                        <div className="card-header">
                            <RefreshCw size={16} style={{ marginRight: '6px' }} />
                            Last 20 Logs
                        </div>
                        <div className="card-body">
                            <div className="logs-grid">
                                {recentLogs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className={`log-item ${log.analysis.decision === 'ATTACK' ? 'attack' : 'benign'}`}
                                    >
                                        <div className="log-number">#{log.count}</div>
                                        <div className="log-prediction">{log.analysis.prediction}</div>
                                        <div className="log-time">{log.timestamp}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Correlation Results */}
                {correlationData && (
                    <div className="results-section fade-in">
                        {/* Executive Summary Section (NLP Powered) */}
                        <div className="card summary-card" style={{ 
                            marginBottom: '24px', 
                            borderLeft: '4px solid var(--accent-purple)',
                            background: 'rgba(15, 23, 42, 0.4)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* Terminal Scanline Effect */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))', backgroundSize: '100% 4px, 3px 100%', pointerEvents: 'none', opacity: 0.3 }} />
                            
                            <div className="card-header" style={{ 
                                background: 'rgba(59, 130, 246, 0.15)', 
                                color: '#60a5fa', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: '8px', 
                                fontSize: '11px', 
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                padding: '10px 20px',
                                textTransform: 'uppercase'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Search size={14} /> NEURAL SEQUENCE AUDIT: LAST {(correlationData?.correlation_stats?.benign_entries || 0) + (correlationData?.correlation_stats?.attacks_detected || 0) || (correlationData?.sequence_logs?.length || 10)} EVENTS
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>[ ENGINE: BART-DISTIL-CNN ]</div>
                            </div>
                            <div className="card-body" style={{ padding: '24px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ 
                                        color: 'var(--accent-pink)', 
                                        fontWeight: 900, 
                                        fontSize: '12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '6px',
                                        background: 'rgba(236, 72, 153, 0.15)',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        <RefreshCw size={14} /> EXECUTIVE SUMMARY
                                    </div>
                                    <div style={{ height: '1px', flexGrow: 1, background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.3), transparent)' }}></div>
                                </div>
                                <div style={{ 
                                    fontSize: '16px', 
                                    lineHeight: '1.8', 
                                    color: 'rgba(255,255,255,0.95)', 
                                    fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
                                    paddingRight: '20px'
                                }}>
                                    {Array.isArray(correlationData.summary) ? correlationData.summary[0] : correlationData.summary}
                                </div>
                            </div>
                        </div>

                        <CorrelationInsights
                            explainability={correlationData.explainability}
                            correlationStats={correlationData.correlation_stats}
                            ruleHits={correlationData.all_rule_hits}
                        />

                        <SequenceExplainability
                            explainability={correlationData.explainability}
                            correlationStats={correlationData.correlation_stats}
                        />

                        <SequenceViewer
                            sequenceLogs={correlationData.sequence_logs}
                            explainability={correlationData.explainability}
                        />
                    </div>
                )}

                {/* Empty State */}
                {!isRunning && !correlationData && (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Zap size={48} />
                        </div>
                        <h3>Start Real-Time Monitoring</h3>
                        <p>Click "Start Streaming" to begin generating and analyzing logs in real-time</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                            The system will automatically learn new rules from high-confidence attacks
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
