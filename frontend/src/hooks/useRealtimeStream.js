/**
 * useRealtimeStream Hook
 * Centralizes SSE streaming logic used in both RealtimeCorrelation and LiveTraffic pages
 * Eliminates 150+ lines of duplicate code
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { toastError } from '../utils/toastHelpers'

const API = '/api'

/**
 * Custom hook for real-time log streaming
 * @param {number} initialEps - Initial events per second (default: 5)
 * @returns {object} Stream state and control functions
 */
export const useRealtimeStream = (initialEps = 5) => {
    const [isRunning, setIsRunning] = useState(false)
    const [logsCount, setLogsCount] = useState(0)
    const [eventRate, setEventRate] = useState(String(initialEps))
    const [isLoading, setIsLoading] = useState(false)
    const [recentLogs, setRecentLogs] = useState([])
    const [threatHistory, setThreatHistory] = useState([])

    const eventSourceRef = useRef(null)
    const logCounterRef = useRef(0)
    const threatCounterRef = useRef(0)

    /**
     * Start real-time log generation and establish SSE connection
     */
    const startStream = useCallback(async (onLogReceived) => {
        if (isRunning) return

        setIsLoading(true)
        try {
            const eps = parseInt(eventRate) || 5

            // Start backend log generation
            const response = await fetch(`${API}/realtime/start?eps=${eps}`, {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Failed to start real-time generation')
            }

            setIsRunning(true)
            logCounterRef.current = 0
            threatCounterRef.current = 0
            setLogsCount(0)
            setRecentLogs([])
            setThreatHistory([])

            // Connect to SSE stream
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }

            eventSourceRef.current = new EventSource(`${API}/stream`)

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const analysis = JSON.parse(event.data)
                    handleNewLog(analysis, onLogReceived)
                } catch (e) {
                    console.error('Error parsing stream data:', e)
                }
            }

            eventSourceRef.current.onerror = () => {
                console.error('SSE connection error')
                setIsRunning(false)
                eventSourceRef.current?.close()
                toastError('Connection Lost', 'Stream connection was interrupted')
            }
        } catch (e) {
            toastError('Failed to Start', 'Could not start real-time stream')
            console.error(e)
            setIsRunning(false)
        } finally {
            setIsLoading(false)
        }
    }, [eventRate, isRunning])

    /**
     * Process incoming log and update state
     */
    const handleNewLog = useCallback((analysis, onLogReceived) => {
        logCounterRef.current += 1
        setLogsCount(logCounterRef.current)

        const isAttack = analysis.decision === 'ATTACK'
        if (isAttack) {
            threatCounterRef.current += 1
            // Updates threat count is handled by caller if needed
        }

        const newLog = {
            id: Date.now() + Math.random(),
            index: logCounterRef.current,
            timestamp: new Date().toLocaleTimeString(),
            ...analysis
        }

        // Keep last 20 logs for replay
        setRecentLogs(prev => [...prev.slice(-19), {
            count: logCounterRef.current,
            analysis,
            timestamp: new Date().toLocaleTimeString()
        }])

        // Track threat events
        if (isAttack) {
            setThreatHistory(prev => [...prev.slice(-9), {
                count: logCounterRef.current,
                prediction: analysis.prediction,
                confidence: analysis.confidence,
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        // Call optional callback (for custom handling like chart updates)
        if (onLogReceived) {
            onLogReceived(newLog)
        }
    }, [])

    /**
     * Stop real-time log generation
     */
    const stopStream = useCallback(async () => {
        try {
            await fetch(`${API}/realtime/stop`, { method: 'POST' })

            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }

            setIsRunning(false)
            return logCounterRef.current
        } catch (e) {
            toastError('Failed to Stop', 'Could not stop real-time stream')
            console.error(e)
            return 0
        }
    }, [])

    /**
     * Clear all logs and reset counters
     */
    const clearLogs = useCallback(() => {
        setRecentLogs([])
        setThreatHistory([])
        logCounterRef.current = 0
        threatCounterRef.current = 0
        setLogsCount(0)
    }, [])

    /**
     * Get current threat count
     */
    const getThreatCount = useCallback(() => {
        return threatCounterRef.current
    }, [])

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    return {
        // State
        isRunning,
        logsCount,
        eventRate,
        isLoading,
        recentLogs,
        threatHistory,
        threatCount: threatCounterRef.current,

        // Methods
        startStream,
        stopStream,
        clearLogs,
        getThreatCount,
        setEventRate,
        setLogsCount,
        setThreatHistory,
        setRecentLogs
    }
}

export default useRealtimeStream
