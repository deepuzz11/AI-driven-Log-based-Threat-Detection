import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toastSuccess, toastError, toastConfirmAction } from '../utils/toastHelpers.jsx'
import { Play, Square, Zap, BarChart3, TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, X, Loader2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react'
import SequenceViewer from '../components/SequenceViewer'
import CorrelationInsights from '../components/CorrelationInsights'
import SequenceExplainability from '../components/SequenceExplainability'
import '../styles/RealtimeCorrelation.css'

const API = '/api'
const LOGS_PER_PAGE = 40
const THREATS_PER_PAGE = 20
const STORAGE_KEY = 'correlation_history'

// Load persisted history from localStorage
const loadPersistedHistory = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
    } catch (e) { console.warn('Failed to load Correlation history:', e) }
    return null
}

export default function RealtimeCorrelation() {
    const persisted = useRef(loadPersistedHistory())
    const [isRunning, setIsRunning] = useState(false)
    const [logsCount, setLogsCount] = useState(() => persisted.current?.logsCount || 0)
    const [eventRate, setEventRate] = useState('5')
    const [correlationData, setCorrelationData] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recentLogs, setRecentLogs] = useState(() => persisted.current?.recentLogs || [])
    const [threatHistory, setThreatHistory] = useState(() => persisted.current?.threatHistory || [])
    const [autoLearnedRules, setAutoLearnedRules] = useState(() => persisted.current?.autoLearnedRules || [])
    const [activeTab, setActiveTab] = useState('stream')
    const eventSourceRef = useRef(null)
    const logCounterRef = useRef(persisted.current?.logsCount || 0)

    // Pagination state
    const [logsPage, setLogsPage] = useState(1)
    const [threatsPage, setThreatsPage] = useState(1)

    // Logs pagination
    const totalLogsPages = useMemo(() => Math.max(1, Math.ceil(recentLogs.length / LOGS_PER_PAGE)), [recentLogs.length])
    const paginatedLogs = useMemo(() => {
        const start = (logsPage - 1) * LOGS_PER_PAGE
        return recentLogs.slice(start, start + LOGS_PER_PAGE)
    }, [recentLogs, logsPage])

    // Threats pagination
    const totalThreatsPages = useMemo(() => Math.max(1, Math.ceil(threatHistory.length / THREATS_PER_PAGE)), [threatHistory.length])
    const paginatedThreats = useMemo(() => {
        const start = (threatsPage - 1) * THREATS_PER_PAGE
        return threatHistory.slice(start, start + THREATS_PER_PAGE)
    }, [threatHistory, threatsPage])

    // Page number generator
    const getPageNumbers = (current, total) => {
        const pages = []
        const maxVisible = 5
        let start = Math.max(1, current - Math.floor(maxVisible / 2))
        let end = Math.min(total, start + maxVisible - 1)
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1)
        }
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    // Start real-time log generation
    const startRealtimeGeneration = useCallback(async () => {
        if (isRunning) return
        try {
            const eps = parseInt(eventRate) || 5
            await fetch(`${API}/realtime/start?eps=${eps}`, { method: 'POST' })
            setIsRunning(true)
            // Continue from persisted counter (don't reset on new stream)
            setLogsPage(1)
            setThreatsPage(1)
            
            toastSuccess('Stream Started', `Real-time traffic started at ${eps} EPS`)

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

                    // Retain recent logs for visual feed (slice for performance)
                    setRecentLogs(prev => [{
                        count: logCounterRef.current,
                        analysis,
                        timestamp: new Date().toLocaleTimeString()
                    }, ...prev].slice(0, 50))

                    // Retain recent threat events
                    if (analysis.decision === 'ATTACK') {
                        setThreatHistory(prev => [{
                            count: logCounterRef.current,
                            prediction: analysis.prediction,
                            confidence: analysis.confidence,
                            timestamp: new Date().toLocaleTimeString()
                        }, ...prev].slice(0, 50))
                    }
                } catch (e) {
                    console.error('Error parsing stream data:', e)
                }
            }

            eventSourceRef.current.onerror = () => {
                setIsRunning(false)
                eventSourceRef.current?.close()
                toastError('Connection Lost', 'Stream connection lost')
            }

        } catch (e) {
            toastError('Start Failed', 'Failed to start real-time generation')
            console.error(e)
        }
    }, [eventRate])

    // Stop real-time generation
    const stopRealtimeGeneration = useCallback(async () => {
        if (!isRunning) return
        
        setIsRunning(false)
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        
        try {
            const res = await fetch(`${API}/realtime/stop`, { method: 'POST' })
            if (res.ok) {
                toastSuccess('Stream Stopped', `Analyzed ${logCounterRef.current} events. History retained.`)
            }
        } catch (e) {
            console.error('Correlation stop error:', e)
            toastError('Backend Issue', 'Traffic stopped locally, but backend may still be active.')
        }
    }, [isRunning])

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
            setActiveTab('analysis')

            // Show newly learned rules
            if (data.auto_learned_rules && data.auto_learned_rules.length > 0) {
                setAutoLearnedRules(prev => [
                    ...prev,
                    ...data.auto_learned_rules
                ])

                toastSuccess('Rules Auto-Learned', `${data.auto_learned_rules.length} new rules added to rules.txt`)
            }

            const threatLevel = data?.explainability?.threat_level
            if (threatLevel && threatLevel !== 'NONE') {
                toastError(`${threatLevel} Threat Detected`, `${data?.explainability?.attack_count || 0} malicious entries in stream`, 4000)
            }
        } catch (e) {
            toastError('Analysis Failed', 'Correlation analysis failed')
            console.error(e)
        } finally {
            setIsAnalyzing(false)
        }
    }, [])

    // Persist history to localStorage whenever state changes
    useEffect(() => {
        try {
            const toSave = {
                recentLogs: recentLogs.slice(-2000),   // Cap for storage limits
                threatHistory: threatHistory.slice(-500),
                autoLearnedRules: autoLearnedRules.slice(-50),
                logsCount
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
        } catch (e) { console.warn('Failed to persist Correlation history:', e) }
    }, [recentLogs, threatHistory, autoLearnedRules, logsCount])

    // Clear all history
    const clearHistory = useCallback(() => {
        toastConfirmAction(
            "Clear Correlation History",
            "Are you sure you want to permanently delete all correlation history and recent logs?",
            "Clear History",
            () => {
                setRecentLogs([])
                setThreatHistory([])
                setAutoLearnedRules([])
                setLogsCount(0)
                logCounterRef.current = 0
                setLogsPage(1)
                setThreatsPage(1)
                try { localStorage.removeItem(STORAGE_KEY) } catch(e) {}
                toastSuccess('History Cleared', 'Correlation data purged successfully')
            }
        )
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    // Auto-advance logs page to latest when streaming
    useEffect(() => {
        if (isRunning && recentLogs.length > 0) {
            const newTotal = Math.max(1, Math.ceil(recentLogs.length / LOGS_PER_PAGE))
            setLogsPage(newTotal) // Go to last page (latest logs)
        }
    }, [recentLogs.length, isRunning])

    // Auto-advance threats page to latest when streaming
    useEffect(() => {
        if (isRunning && threatHistory.length > 0) {
            const newTotal = Math.max(1, Math.ceil(threatHistory.length / THREATS_PER_PAGE))
            setThreatsPage(newTotal)
        }
    }, [threatHistory.length, isRunning])

    // Pagination component
    const PaginationControls = ({ current, total, onPageChange, label }) => {
        if (total <= 1) return null
        return (
            <div className="corr-pagination" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Page {current} of {total} {label && `· ${label}`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <button className="pg-btn-sm" onClick={() => onPageChange(1)} disabled={current === 1}>
                        <ChevronsLeft size={12} />
                    </button>
                    <button className="pg-btn-sm" onClick={() => onPageChange(current - 1)} disabled={current === 1}>
                        <ChevronLeft size={12} />
                    </button>
                    {getPageNumbers(current, total).map(page => (
                        <button
                            key={page}
                            className={`pg-btn-sm pg-num-sm ${current === page ? 'pg-active-sm' : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button className="pg-btn-sm" onClick={() => onPageChange(current + 1)} disabled={current === total}>
                        <ChevronRight size={12} />
                    </button>
                    <button className="pg-btn-sm" onClick={() => onPageChange(total)} disabled={current === total}>
                        <ChevronsRight size={12} />
                    </button>
                </div>
            </div>
        )
    }

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

                            <button
                                onClick={clearHistory}
                                disabled={isRunning || (recentLogs.length === 0 && threatHistory.length === 0)}
                                className="btn"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px'
                                }}
                                title="Clear all session history"
                            >
                                <Trash2 size={16} />
                                Clear History
                            </button>
                        </div>
                    </div>
                </div>

                <div className="tabs-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="tab-list">
                        <button className={`tab-item ${activeTab === 'stream' ? 'active' : ''}`} onClick={() => setActiveTab('stream')}>Live Stream & History</button>
                        <button className={`tab-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Correlation Results</button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'stream' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Auto-Learned Rules */}
                                {autoLearnedRules.length > 0 && (
                                    <div className="card auto-learned-panel fade-in">
                                        <div className="card-header">
                                            <Zap size={16} style={{ marginRight: '6px' }} />
                                            Auto-Learned Rules ({autoLearnedRules.length} total)
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

                                {/* Threat History with Pagination */}
                                {threatHistory.length > 0 && (
                                    <div className="card threat-history-panel">
                                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <BarChart3 size={16} style={{ marginRight: '6px' }} />
                                                Threat Detection Timeline
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {threatHistory.length} threats detected
                                            </span>
                                        </div>
                                        <div className="card-body" style={{ padding: 0 }}>
                                            <div className="threat-timeline" style={{ maxHeight: 'none', padding: '12px' }}>
                                                {paginatedThreats.map((threat, idx) => (
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
                                            <PaginationControls
                                                current={threatsPage}
                                                total={totalThreatsPages}
                                                onPageChange={setThreatsPage}
                                                label={`${threatHistory.length} threats`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Recent Logs Stream with Pagination */}
                                {recentLogs.length > 0 && (
                                    <div className="card realtime-logs-panel">
                                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <RefreshCw size={16} style={{ marginRight: '6px' }} />
                                                All Streamed Logs
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {recentLogs.length} events captured
                                            </span>
                                        </div>
                                        <div className="card-body" style={{ padding: 0 }}>
                                            <div className="logs-grid" style={{ padding: '12px' }}>
                                                {paginatedLogs.map((log, idx) => (
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
                                            <PaginationControls
                                                current={logsPage}
                                                total={totalLogsPages}
                                                onPageChange={setLogsPage}
                                                label={`${recentLogs.length} events`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Empty State for Stream Tab */}
                                {!isRunning && recentLogs.length === 0 && (
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
                        )}

                        {activeTab === 'analysis' && (
                            <div className="results-section fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {correlationData ? (
                                    <>
                                        {/* Executive Summary Section (NLP Powered) */}
                                        <div className="card summary-card" style={{ 
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
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <TrendingUp size={48} />
                                        </div>
                                        <h3>No Correlation Data</h3>
                                        <p>Click "Analyze Correlation" while streaming to generate deep sequence insights.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
