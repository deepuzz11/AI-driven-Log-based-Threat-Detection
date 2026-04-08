import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toastSuccess, toastError, toastConfirmAction } from '../utils/toastHelpers.jsx'
import {
    Activity, Shield, ShieldAlert, Zap, Clock,
    ArrowRight, Terminal, Search, Trash2,
    Play, Square, AlertTriangle, ShieldCheck, Loader2, Network,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react'

const API = '/api'
const LOGS_PER_PAGE = 50
const STORAGE_KEY = 'livetraffic_history'

// Load persisted history from localStorage
const loadPersistedHistory = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
    } catch (e) { console.warn('Failed to load LiveTraffic history:', e) }
    return null
}

export default function LiveTraffic() {
    const persisted = useRef(loadPersistedHistory())
    const [logs, setLogs] = useState(() => persisted.current?.logs || [])
    const [isScanning, setIsScanning] = useState(false)
    const [totalEvents, setTotalEvents] = useState(() => persisted.current?.totalEvents || 0)
    const [threatCount, setThreatCount] = useState(() => persisted.current?.threatCount || 0)
    const [eventRate, setEventRate] = useState('5')
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const logContainerRef = useRef(null)
    const eventSourceRef = useRef(null)
    const logCounterRef = useRef(persisted.current?.totalEvents || 0)
    const threatCounterRef = useRef(persisted.current?.threatCount || 0)

    // Pagination calculations
    const totalPages = useMemo(() => Math.max(1, Math.ceil(logs.length / LOGS_PER_PAGE)), [logs.length])
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * LOGS_PER_PAGE
        return logs.slice(start, start + LOGS_PER_PAGE)
    }, [logs, currentPage])

    // Auto-go to page 1 when new logs arrive (newest first)
    const autoPageRef = useRef(true)

    // Start real-time log generation
    const startScan = useCallback(async (isAutoConnect = false) => {
        if (isScanning && !isAutoConnect) return
        
        if (!isAutoConnect) setIsLoading(true)
        try {
            const eps = parseInt(eventRate) || 5
            
            // Start backend log generation if not auto-connecting
            if (!isAutoConnect) {
                const response = await fetch(`${API}/realtime/start?eps=${eps}`, { 
                    method: 'POST'
                })
                
                if (!response.ok) {
                    throw new Error('Failed to start real-time generation')
                }
                
                toastSuccess('Stream Active', `Live traffic started at ${eps} events/sec`)
            }

            setIsScanning(true)
            // DO NOT clear logs here anymore to retain history
            // We only clear if the user explicitly clicks the Trash icon or 'clear' param is true
            
            autoPageRef.current = true
            
            // Connect to SSE stream
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }

            eventSourceRef.current = new EventSource(`${API}/stream`)

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const analysis = JSON.parse(event.data)
                    handleNewLog(analysis)
                } catch (e) {
                    console.error('Error parsing stream data:', e)
                }
            }

            eventSourceRef.current.onerror = () => {
                console.error("SSE connection error")
                setIsScanning(false)
                eventSourceRef.current?.close()
                if (!isAutoConnect) {
                    toastError('Connection Lost', 'SSE stream disconnected unexpectedly')
                }
            }

        } catch (e) {
            if (!isAutoConnect) {
                toastError('Start Failed', 'Could not initiate live traffic scan')
            }
            console.error(e)
            setIsScanning(false)
        } finally {
            if (!isAutoConnect) setIsLoading(false)
        }
    }, [eventRate, isScanning])

    // Stop real-time log generation
    const stopScan = useCallback(async () => {
        try {
            await fetch(`${API}/realtime/stop`, { method: 'POST' })
            
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
            
            setIsScanning(false)
            autoPageRef.current = false
            toastSuccess('Stream Stopped', `Analyzed ${logCounterRef.current} events successfully`)
        } catch (e) {
            toastError('Stop Failed', 'Could not terminate the live traffic stream')
            console.error(e)
        }
    }, [])

    const handleNewLog = useCallback((analysis) => {
        logCounterRef.current += 1
        setTotalEvents(logCounterRef.current)

        const isAttack = analysis.decision === 'ATTACK'
        if (isAttack) {
            threatCounterRef.current += 1
            setThreatCount(threatCounterRef.current)
        }

        const newLog = {
            id: Date.now() + Math.random(),
            index: logCounterRef.current,
            timestamp: new Date().toLocaleTimeString(),
            ...analysis
        }

        // Retain ALL logs — no slicing
        setLogs(prev => [newLog, ...prev])

        // Keep user on page 1 while streaming (newest first)
        if (autoPageRef.current) {
            setCurrentPage(1)
        }
    }, [])


    const clearLogs = () => {
        toastConfirmAction(
            "Clear Log History",
            "Are you sure you want to permanently delete all historical live traffic logs?",
            "Clear History",
            async () => {
                try {
                    await fetch(`${API}/realtime/clear`, { method: 'POST' })
                    setLogs([])
                    setThreatCount(0)
                    setTotalEvents(0)
                    threatCounterRef.current = 0
                    logCounterRef.current = 0
                    setCurrentPage(1)
                    localStorage.removeItem(STORAGE_KEY)
                    toastSuccess('Logs Cleared', 'Historical traffic data purged from system')
                } catch (e) {
                    toastError('Clear Failed', 'Could not purge backend logs')
                }
            }
        )
    }

    // Page navigation
    const goToPage = (page) => {
        autoPageRef.current = false
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    // Persist history to localStorage whenever logs change
    useEffect(() => {
        try {
            // Cap at 2000 logs for storage to avoid exceeding localStorage limits
            const toSave = { logs: logs.slice(0, 2000), totalEvents, threatCount }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
        } catch (e) { console.warn('Failed to persist LiveTraffic history:', e) }
    }, [logs, totalEvents, threatCount])

    // Initial load: history and status
    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            try {
                // 1. Fetch backend status
                const sTab = await fetch(`${API}/realtime/status`)
                const sData = await sTab.json()
                if (sData.is_running) {
                    setEventRate(String(sData.event_rate))
                    startScan(true) // Auto-reconnect SSE
                }

                // 2. Fetch backend history (more reliable than localStorage)
                const hTab = await fetch(`${API}/realtime/history?limit=1000`)
                const hData = await hTab.json()
                
                if (hData.logs && hData.logs.length > 0) {
                    // Combine with localStorage to be safe, but backend is priority
                    setLogs(hData.logs)
                    
                    const tTotal = hData.logs.length
                    const tThreats = hData.logs.filter(l => l.decision === 'ATTACK').length
                    
                    setTotalEvents(tTotal)
                    setThreatCount(tThreats)
                    logCounterRef.current = tTotal
                    threatCounterRef.current = tThreats
                }
            } catch (e) {
                console.warn('Sync failed, falling back to local state:', e)
            } finally {
                setIsLoading(false)
            }
        }
        
        init()

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1)
        }
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="live-traffic-page live-monitor-page" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: '100%'
        }}>

            {/* ── HEADER ── */}
            <div className="live-header card glass-panel slide-down" style={{
                flexShrink: 0,
                padding: '24px',
                background: 'rgba(5, 5, 7, 0.85)',
                backdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div className={`status-pill ${isScanning ? 'active' : ''}`}>
                                <div className="status-dot-inner" />
                                <span>{isScanning ? 'LIVE MONITOR ACTIVE' : 'MONITOR STANDBY'}</span>
                            </div>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                                Live Edge Security Monitor
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, opacity: 0.8 }}>
                            Hybrid Rule + ML detection engine processing real-time telemetry
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', padding: '1px', borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="stat-pill">
                                <span className="stat-label">TOTAL TRAFFIC</span>
                                <span className="stat-value">{totalEvents.toLocaleString()}</span>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border)' }} />
                            <div className="stat-pill">
                                <span className="stat-label">THREATS</span>
                                <span className="stat-value" style={{ color: threatCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                    {threatCount}
                                </span>
                            </div>
                        </div>

                        <div className="btn-group" style={{ display: 'flex', gap: '12px' }}>
                            {!isScanning ? (
                                <button 
                                    className="btn-neo btn-neo-primary" 
                                    onClick={() => startScan(false)}
                                    disabled={isLoading}
                                    style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                                >
                                    {isLoading ? <Loader2 size={14} className="spinner" /> : <Play size={14} fill="currentColor" />}
                                    {isLoading ? 'STARTING...' : 'START SCAN'}
                                </button>
                            ) : (
                                <button className="btn-neo btn-neo-danger" onClick={stopScan}>
                                    <Square size={14} fill="currentColor" /> STOP SCAN
                                </button>
                            )}
                            <button className="btn-neo btn-neo-secondary" onClick={clearLogs} title="Clear logs">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONFIGURATION PANEL ── */}
            <div className="config-panel card glass-panel slide-up" style={{
                padding: '20px',
                background: 'rgba(5, 5, 7, 0.5)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%',
                opacity: isScanning ? 0.5 : 1,
                pointerEvents: isScanning ? 'none' : 'auto',
                transition: 'opacity 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            Events Per Second (EPS)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={eventRate}
                            onChange={(e) => setEventRate(e.target.value)}
                            disabled={isScanning}
                            style={{
                                padding: '10px 14px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                color: '#fff',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                fontFamily: '"JetBrains Mono", monospace',
                                width: '100px'
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <p style={{ margin: '0 0 4px 0' }}>⚡ Higher EPS = More events/sec (1-50 recommended)</p>
                        <p style={{ margin: '0' }}>💡 Start with 5-10 EPS for balanced analysis</p>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="live-content slide-up stagger-1" style={{ flex: 1, maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* ── LOG TERMINAL ── */}
                <div className="log-terminal card glass-panel slide-up stagger-2" style={{
                    background: 'rgba(5, 5, 5, 0.6)',
                    border: '1px solid var(--border-bright)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '600px',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
                }}>
                    {/* Log Header */}
                    <div style={{
                        padding: '14px 24px',
                        background: 'rgba(255,255,255,0.06)',
                        borderBottom: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: '80px 90px 90px 140px 120px 1fr',
                        gap: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <span>Event #</span>
                        <span>Verdict</span>
                        <span>Protocol</span>
                        <span>Service</span>
                        <span>Detection</span>
                        <span>Raw Industrial Log Event</span>

                    </div>

                    {/* Log List */}
                    <div className="log-rows" style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '4px 0',
                        fontSize: '12.5px',
                        fontFamily: '"JetBrains Mono", monospace',
                        lineHeight: 1.6
                    }}>
                        {logs.length === 0 ? (
                            <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div className="terminal-empty-icon"><Network size={40} /></div>
                                <p style={{ fontSize: '15px', fontWeight: 500 }}>Awaiting incoming traffic stream...</p>
                                <p style={{ fontSize: '13px', opacity: 0.6 }}>Click "START SCAN" to begin real-time monitoring</p>
                            </div>
                        ) : (
                            paginatedLogs.map((log) => (
                                <div key={log.id} style={{
                                    padding: '12px 24px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: 'grid',
                                    gridTemplateColumns: '80px 90px 90px 140px 120px 1fr',
                                    gap: '12px',
                                    alignItems: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    backgroundColor: log.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                                    borderLeft: log.decision === 'ATTACK' ? '3px solid var(--accent-red)' : '3px solid transparent'
                                }} className="log-row">

                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
                                        #{log.index}
                                    </span>

                                    <div>
                                        <span className={`status-pill ${log.decision === 'ATTACK' ? 'danger' : 'success'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                            {log.decision === 'ATTACK' ? '🚨 DENY' : '✓ ALLOW'}
                                        </span>
                                    </div>

                                    <span style={{ color: 'var(--accent-blue)', opacity: 0.9, fontWeight: 500 }}>
                                        {log.row?.proto?.toUpperCase() || 'TCP'}
                                    </span>

                                    <span style={{ color: 'var(--text-primary)', opacity: 0.9, fontSize: '12px' }}>
                                        {log.row?.service || 'HTTP'}
                                    </span>

                                    <div>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            background: log.method?.includes('rule') 
                                                ? 'rgba(168, 85, 247, 0.15)' 
                                                : 'rgba(59, 130, 246, 0.15)',
                                            color: log.method?.includes('rule') 
                                                ? 'var(--accent-purple)' 
                                                : 'var(--accent-blue)',
                                            border: `1px solid ${log.method?.includes('rule') 
                                                ? 'rgba(168, 85, 247, 0.3)' 
                                                : 'rgba(59, 130, 246, 0.3)'}`
                                        }}>
                                            {log.method?.includes('rule') ? '📋 RULE' : '🤖 ML'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <div className="payload-box" style={{
                                            padding: '6px 14px',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: log.decision === 'ATTACK' ? 'var(--accent-red)' : 'var(--accent-cyan)',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            border: `1px solid ${log.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.2)'}`,
                                            flex: 1,
                                            letterSpacing: '0.02em',
                                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                                        }} title={log.raw_log}>
                                            <span style={{ opacity: 0.5, marginRight: '8px' }}>[RAW]</span>
                                            {log.raw_log || 'N/A'}
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                    {/* ── PAGINATION BAR ── */}
                    {logs.length > LOGS_PER_PAGE && (
                        <div className="pagination-bar" style={{
                            padding: '12px 24px',
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono", monospace' }}>
                                Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1}–{Math.min(currentPage * LOGS_PER_PAGE, logs.length)} of {logs.length.toLocaleString()} events
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button className="pg-btn" onClick={() => goToPage(1)} disabled={currentPage === 1} title="First page">
                                    <ChevronsLeft size={14} />
                                </button>
                                <button className="pg-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Previous page">
                                    <ChevronLeft size={14} />
                                </button>

                                {getPageNumbers().map(page => (
                                    <button
                                        key={page}
                                        className={`pg-btn pg-num ${currentPage === page ? 'pg-active' : ''}`}
                                        onClick={() => goToPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button className="pg-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Next page">
                                    <ChevronRight size={14} />
                                </button>
                                <button className="pg-btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} title="Last page">
                                    <ChevronsRight size={14} />
                                </button>
                            </div>

                            {isScanning && currentPage !== 1 && (
                                <button
                                    className="pg-btn pg-live"
                                    onClick={() => { autoPageRef.current = true; setCurrentPage(1) }}
                                >
                                    ● LIVE
                                </button>
                            )}
                            {(!isScanning || currentPage === 1) && <div style={{ width: '60px' }} />}
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .live-traffic-page {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-secondary);
                    letter-spacing: 0.04em;
                }

                .status-pill.active {
                    color: var(--accent-green);
                    border-color: rgba(16, 185, 129, 0.3);
                    background: rgba(16, 185, 129, 0.05);
                }

                .status-pill.success { 
                    color: var(--accent-green); 
                    background: rgba(16, 185, 129, 0.1); 
                    border-color: rgba(16, 185, 129, 0.2); 
                }

                .status-pill.danger { 
                    color: var(--accent-red); 
                    background: rgba(239, 68, 68, 0.1); 
                    border-color: rgba(239, 68, 68, 0.2); 
                }

                .status-dot-inner {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #52525b;
                }

                .active .status-dot-inner {
                    background: var(--accent-green);
                    box-shadow: 0 0 10px var(--accent-green);
                    animation: pulse 2s infinite;
                }

                .stat-pill {
                    padding: 8px 20px;
                    background: var(--bg-app);
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 120px;
                }

                .stat-label { 
                    font-size: 10px; 
                    font-weight: 700; 
                    color: var(--text-muted); 
                    letter-spacing: 0.05em; 
                }

                .stat-value { 
                    font-size: 16px; 
                    font-weight: 800; 
                    font-family: 'JetBrains Mono', monospace; 
                }

                .btn-neo {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-bright);
                    color: #fff;
                    padding: 10px 18px;
                    border-radius: var(--radius);
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                    letter-spacing: 0.02em;
                }

                .btn-neo-primary { 
                    background: #fff; 
                    color: #000; 
                    border: none; 
                }

                .btn-neo-primary:hover:not(:disabled) { 
                    transform: translateY(-1px); 
                    box-shadow: 0 4px 20px rgba(255,255,255,0.2); 
                }

                .btn-neo-danger { 
                    color: var(--accent-red); 
                    border-color: rgba(239, 68, 68, 0.3); 
                }

                .btn-neo-danger:hover { 
                    background: rgba(239, 68, 68, 0.1); 
                }

                .btn-neo-secondary:hover { 
                    background: var(--bg-surface-hover); 
                }

                .log-row:hover {
                    background: rgba(255,255,255,0.04) !important;
                }

                .terminal-empty-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: var(--text-muted);
                }

                .config-panel {
                    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                /* ── Pagination Styles ── */
                .pg-btn {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--text-secondary);
                    padding: 6px 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    font-size: 12px;
                    font-family: 'JetBrains Mono', monospace;
                    min-width: 32px;
                    height: 32px;
                }

                .pg-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.2);
                    color: #fff;
                }

                .pg-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .pg-btn.pg-active {
                    background: rgba(59, 130, 246, 0.25);
                    border-color: rgba(59, 130, 246, 0.5);
                    color: #60a5fa;
                    font-weight: 700;
                }

                .pg-btn.pg-live {
                    background: rgba(16, 185, 129, 0.15);
                    border-color: rgba(16, 185, 129, 0.4);
                    color: var(--accent-green);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    padding: 6px 12px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}} />
        </div>
    )
}
