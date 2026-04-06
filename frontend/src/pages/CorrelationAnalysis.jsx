import React, { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Zap, Loader2, AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react'
import SequenceViewer from '../components/SequenceViewer'
import CorrelationInsights from '../components/CorrelationInsights'
import SequenceExplainability from '../components/SequenceExplainability'
import '../styles/CorrelationAnalysis.css'

const API = '/api'

export default function CorrelationAnalysis() {
    const [startIndex, setStartIndex] = useState('')
    const [seqLength, setSeqLength] = useState('10')
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [correlationData, setCorrelationData] = useState(null)
    const [advancedOpen, setAdvancedOpen] = useState(false)

    const runCorrelationAnalysis = useCallback(async () => {
        if (!startIndex) {
            toast.error('Please enter a starting log index')
            return
        }

        setAnalyzing(true)
        setCorrelationData(null)

        const toastId = toast.custom((t) => (
            <div className="custom-toast loading slide-down">
                <div className="custom-toast-icon"><Loader2 size={18} className="spinner" /></div>
                <div className="custom-toast-content">
                    <div className="custom-toast-title">Analyzing Sequence</div>
                    <div className="custom-toast-message">Correlating logs across sequence...</div>
                </div>
            </div>
        ), { duration: Infinity })

        try {
            const response = await fetch(
                `${API}/correlate-sequence/${startIndex}?seq_len=${seqLength}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            )

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const data = await response.json()
            setCorrelationData(data)

            const threatLevel = data.explainability.threat_level
            const isAttack = threatLevel !== 'NONE'

            if (isAttack) {
                toast.custom((t) => (
                    <div className="custom-toast error slide-down">
                        <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
                        <div className="custom-toast-content">
                            <div className="custom-toast-title">Threat Detected</div>
                            <div className="custom-toast-message">
                                {threatLevel} threat level - {data.explainability.attack_count} malicious entries
                            </div>
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
                            <div className="custom-toast-title">Analysis Complete</div>
                            <div className="custom-toast-message">Sequence analyzed - No threats detected</div>
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
                        <div className="custom-toast-message">Could not analyze sequence. {e.message}</div>
                    </div>
                    <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
                </div>
            ), { id: toastId })
        } finally {
            setAnalyzing(false)
        }
    }, [startIndex, seqLength])

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !analyzing) {
            runCorrelationAnalysis()
        }
    }

    return (
        <div className="page correlation-analysis-page correlation-page">
            <div className="page-header" style={{ padding: '0 0 24px 0', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div className="page-title-section">
                    <Zap size={28} className="page-icon" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>Log Sequence Correlation</h1>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '13px' }}>Analyze sequences of logs to detect correlated threats and attack patterns</p>
                    </div>
                </div>
            </div>

            <div className="page-content">
                {/* Input Section */}
                <div className="card input-card" style={{ marginBottom: '24px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                    <div className="card-header" style={{ background: 'var(--bg-surface)', padding: '12px 20px' }}>Sequence Selection</div>
                    <div className="card-body">
                        <div className="input-grid">
                            <div className="input-group">
                                <label>Starting Log Index</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={startIndex}
                                    onChange={(e) => setStartIndex(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="e.g., 100"
                                    disabled={analyzing}
                                    className="input-field"
                                />
                                <p className="input-help">
                                    Enter the index of the first log in the sequence
                                </p>
                            </div>

                            <div className="input-group">
                                <label>Sequence Length (Advanced)</label>
                                <div className="sequence-length-input">
                                    <input
                                        type="number"
                                        min="2"
                                        max="50"
                                        value={seqLength}
                                        onChange={(e) => setSeqLength(e.target.value)}
                                        placeholder="10"
                                        disabled={analyzing}
                                        className="input-field"
                                    />
                                    <span className="preset-buttons">
                                        <button
                                            onClick={() => setSeqLength('5')}
                                            disabled={analyzing}
                                            className={seqLength === '5' ? 'active' : ''}
                                        >
                                            5
                                        </button>
                                        <button
                                            onClick={() => setSeqLength('10')}
                                            disabled={analyzing}
                                            className={seqLength === '10' ? 'active' : ''}
                                        >
                                            10
                                        </button>
                                        <button
                                            onClick={() => setSeqLength('20')}
                                            disabled={analyzing}
                                            className={seqLength === '20' ? 'active' : ''}
                                        >
                                            20
                                        </button>
                                    </span>
                                </div>
                                <p className="input-help">
                                    Default is 10. Longer sequences may take more time to analyze.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={runCorrelationAnalysis}
                            disabled={analyzing || !startIndex}
                            className="btn btn-primary"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} />
                                    Analyze Sequence
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {correlationData && (
                    <div className="results-section fade-in">
                        {/* Correlation Insights */}
                        <CorrelationInsights
                            explainability={correlationData.explainability}
                            correlationStats={correlationData.correlation_stats}
                            ruleHits={correlationData.all_rule_hits}
                        />

                        {/* Sequence Explainability */}
                        <SequenceExplainability
                            explainability={correlationData.explainability}
                            correlationStats={correlationData.correlation_stats}
                        />

                        {/* Sequence Viewer */}
                        <SequenceViewer
                            sequenceLogs={correlationData.sequence_logs}
                            explainability={correlationData.explainability}
                        />
                    </div>
                )}

                {/* Empty State */}
                {!correlationData && !analyzing && (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Zap size={48} />
                        </div>
                        <h3>No Analysis Yet</h3>
                        <p>Select a log index and run correlation analysis to begin</p>
                    </div>
                )}
            </div>
        </div>
    )
}
