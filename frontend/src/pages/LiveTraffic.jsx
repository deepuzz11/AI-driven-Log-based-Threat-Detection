import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Activity, Shield, ShieldAlert, Zap, Clock,
    ArrowRight, Terminal, Search, Trash2,
    Play, Square, AlertTriangle, ShieldCheck
} from 'lucide-react'

export default function LiveTraffic() {
    const [logs, setLogs] = useState([])
    const [isScanning, setIsScanning] = useState(false)
    const [totalEvents, setTotalEvents] = useState(0)

    const logContainerRef = useRef(null)
    const eventSourceRef = useRef(null)
    const logCounter = useRef(0)

    // Helper to generate consistent fake IPs for IDs
    const getFakeIPs = (id) => {
        const hash = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i) | 0;
            return Math.abs(h);
        }
        const h = hash(String(id));
        const src = `192.168.1.${(h % 254) + 1}`;
        const dst = `10.0.0.${((h >> 8) % 254) + 1}`;
        const sPort = (h % 64512) + 1024;
        const dPort = [80, 443, 8080, 22, 53, 3306, 5432][h % 7];
        return { src: `${src}:${sPort}`, dst: `${dst}:${dPort}` };
    }

    const startScan = () => {
        if (isScanning) return
        setIsScanning(true)

        // Use standard polling if SSE isn't implemented on backend yet, 
        // or attempt EventSource if envisioned in plan.
        // For now, let's simulate the arrival of logs if we were connected to SSE.
        // The implementation plan mentions /api/stream.
        const eventSource = new EventSource('/api/stream')
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data)
            handleNewLog(data)
        }
        eventSource.onerror = () => {
            console.error("SSE connection error")
            eventSource.close()
            setIsScanning(false)
        }
        eventSourceRef.current = eventSource
    }

    const stopScan = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }
        setIsScanning(false)
    }

    const handleNewLog = useCallback((data) => {
        const ips = getFakeIPs(data.index || Math.random())
        const newLog = {
            ...data,
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            src_ip: ips.src,
            dst_ip: ips.dst
        }

        setLogs(prev => {
            const updated = [newLog, ...prev]
            return updated.slice(0, 100) // Keep last 100
        })

        setTotalEvents(prev => prev + 1)
    }, [])

    const clearLogs = () => setLogs([])

    return (
        <div className="live-traffic-page" style={{
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
                borderRadius: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
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
                        </div>

                        <div className="btn-group" style={{ display: 'flex', gap: '12px' }}>
                            {!isScanning ? (
                                <button className="btn-neo btn-neo-primary" onClick={startScan}>
                                    <Play size={14} fill="currentColor" /> START SCAN
                                </button>
                            ) : (
                                <button className="btn-neo btn-neo-danger" onClick={stopScan}>
                                    <Square size={14} fill="currentColor" /> STOP SCAN
                                </button>
                            )}
                            <button className="btn-neo btn-neo-secondary" onClick={clearLogs} title="Clear Terminal">
                                <Trash2 size={16} />
                            </button>
                        </div>
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
                        background: 'rgba(255,255,255,0.04)',
                        borderBottom: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: '140px 100px 90px 150px 1fr',
                        gap: '16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <span>Timestamp</span>
                        <span>Verdict</span>
                        <span>Protocol</span>
                        <span>Source IP</span>
                        <span>Activity / Payload Details</span>
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
                                <div className="terminal-empty-icon"><Terminal size={40} /></div>
                                <p style={{ fontSize: '15px', fontWeight: 500 }}>Awaiting incoming traffic stream...</p>
                                <p style={{ fontSize: '13px', opacity: 0.6 }}>Start the scan to begin real-time analysis</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} style={{
                                    padding: '12px 24px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: 'grid',
                                    gridTemplateColumns: '140px 100px 90px 150px 1fr',
                                    gap: '16px',
                                    alignItems: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    backgroundColor: log.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    borderLeft: log.decision === 'ATTACK' ? '2px solid var(--accent-red)' : '2px solid transparent'
                                }} className="log-row">

                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{log.timestamp}</span>

                                    <div>
                                        <span className={`status-pill ${log.decision === 'ATTACK' ? 'danger' : 'success'}`} style={{ fontSize: '10px', padding: '1px 8px' }}>
                                            {log.decision === 'ATTACK' ? 'DENY' : 'ALLOW'}
                                        </span>
                                    </div>

                                    <span style={{ color: 'var(--accent-blue)', opacity: 0.9, fontWeight: 500 }}>{log.row?.proto?.toUpperCase() || 'TCP'}</span>

                                    <span style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{log.src_ip.split(':')[0]}</span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>
                                            <span>{log.src_ip}</span>
                                            <ArrowRight size={10} />
                                            <span>{log.dst_ip}</span>
                                        </div>
                                        <div className="payload-box" style={{
                                            padding: '4px 12px',
                                            background: log.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: log.decision === 'ATTACK' ? 'var(--accent-red)' : 'var(--text-secondary)',
                                            fontWeight: log.decision === 'ATTACK' ? 600 : 400,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            border: '1px solid transparent',
                                            borderColor: log.decision === 'ATTACK' ? 'rgba(239, 68, 68, 0.2)' : 'transparent'
                                        }}>
                                            {log.decision === 'ATTACK' ? `DETECTION: ${log.prediction} | MITIGATED` : `Processed segment ${log.id.toString().slice(-4)} | Normal traffic`}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .live-traffic-page {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
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
                .status-pill.success { color: var(--accent-green); background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
                .status-pill.danger { color: var(--accent-red); background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }

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
                .stat-label { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; }
                .stat-value { font-size: 16px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }

                .btn-neo {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-bright);
                    color: #fff;
                    padding: 10px 18px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                    letter-spacing: 0.02em;
                }
                .btn-neo-primary { background: #fff; color: #000; border: none; }
                .btn-neo-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,255,255,0.2); }
                .btn-neo-danger { color: var(--accent-red); border-color: rgba(239, 68, 68, 0.3); }
                .btn-neo-danger:hover { background: rgba(239, 68, 68, 0.1); }
                .btn-neo-secondary:hover { background: var(--bg-surface-hover); }

                .icon-box-blue {
                    padding: 8px;
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--accent-blue);
                    border-radius: 8px;
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

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}} />
        </div>
    )
}

