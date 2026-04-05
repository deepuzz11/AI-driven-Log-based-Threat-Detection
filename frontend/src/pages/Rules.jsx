import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Search, Trash2, Plus, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

const API = '/api'

export default function Rules() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [newRuleForm, setNewRuleForm] = useState({
        name: '',
        regex: '',
        category: 'generic',
        severity: 'MEDIUM'
    })
    const [rules, setRules] = useState([])

    useEffect(() => {
        loadStats()
        loadRules()
    }, [])

    const loadStats = async () => {
        try {
            const r = await fetch(`${API}/stats`)
            const data = await r.json()
            setStats(data)
        } catch (e) {
            console.error(e)
        }
    }

    const loadRules = async () => {
        setLoading(true)
        try {
            // Since we don't have a rules list endpoint yet, we'll load from stats
            const r = await fetch(`${API}/stats`)
            const data = await r.json()
            // Parse rules from the local rules.txt for display
            // This would need a proper API endpoint in production
            setStats(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const addRule = async () => {
        if (!newRuleForm.name || !newRuleForm.regex) {
            toast.error('Name and Regex are required')
            return
        }

        try {
            const r = await fetch(`${API}/add-rule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRuleForm)
            })
            const data = await r.json()

            if (data.added) {
                toast.success(`Rule "${newRuleForm.name}" added successfully`)
                setNewRuleForm({
                    name: '',
                    regex: '',
                    category: 'generic',
                    severity: 'MEDIUM'
                })
                await loadStats()
            } else {
                toast.error('Rule already exists')
            }
        } catch (e) {
            toast.error('Failed to add rule')
            console.error(e)
        }
    }

    const getCategoryColor = (category) => {
        const colors = {
            'dos': '#FF6B6B',
            'recon': '#4ECDC4',
            'backdoor': '#FF4757',
            'exploits': '#FFE66D',
            'fuzzers': '#95E1D3',
            'shellcode': '#F38181',
            'worms': '#AA96DA',
            'analysis': '#FCBAD3',
            'generic': '#A8D8EA',
            'intrusion': '#FF6348',
            'anomaly': '#FFA502'
        }
        return colors[category?.toLowerCase()] || '#A0A0A0'
    }

    const getSeverityBadge = (severity) => {
        const colors = {
            'CRITICAL': { bg: 'rgba(248,81,73,0.1)', text: '#F85149', border: '#F85149' },
            'HIGH': { bg: 'rgba(227,179,65,0.1)', text: '#E3B341', border: '#E3B341' },
            'MEDIUM': { bg: 'rgba(255,193,7,0.1)', text: '#FFC107', border: '#FFC107' },
            'LOW': { bg: 'rgba(33,150,243,0.1)', text: '#2196F3', border: '#2196F3' }
        }
        return colors[severity] || colors['MEDIUM']
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FileText size={32} color="var(--accent-blue)" />
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Rules Management</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Create and manage detection rules for the hybrid threat detection system
                </p>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'rgba(63,185,80,0.1)',
                        border: '1px solid rgba(63,185,80,0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Total Rules
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)' }}>
                            {stats.rules_count || 0}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,193,7,0.1)',
                        border: '1px solid rgba(255,193,7,0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Attack Samples
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                            {stats.attacks || 0}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(33,150,243,0.1)',
                        border: '1px solid rgba(33,150,243,0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Benign Samples
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                            {stats.benign || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Rule Form */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', marginTop: 0 }}>
                    <Plus size={20} style={{ display: 'inline', marginRight: '8px', marginBottom: '-2px' }} />
                    Create New Rule
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                            Rule Name *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., ddos_syn_flood_detection"
                            value={newRuleForm.name}
                            onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                            Category
                        </label>
                        <select
                            value={newRuleForm.category}
                            onChange={(e) => setNewRuleForm({ ...newRuleForm, category: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="generic">Generic</option>
                            <option value="dos">DoS/DDoS</option>
                            <option value="recon">Reconnaissance</option>
                            <option value="exploits">Exploits</option>
                            <option value="backdoor">Backdoor</option>
                            <option value="fuzzers">Fuzzers</option>
                            <option value="shellcode">Shellcode</option>
                            <option value="worms">Worms/Malware</option>
                            <option value="analysis">Analysis</option>
                            <option value="intrusion">Intrusion</option>
                            <option value="anomaly">Anomaly</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                            Severity
                        </label>
                        <select
                            value={newRuleForm.severity}
                            onChange={(e) => setNewRuleForm({ ...newRuleForm, severity: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Regex Pattern * (use word boundaries like \b pattern \b)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., \\b(syn[- ]?flood|syn flood)\\b"
                        value={newRuleForm.regex}
                        onChange={(e) => setNewRuleForm({ ...newRuleForm, regex: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        💡 Use \b for word boundaries. Example: \b(dos|ddos|flood)\b matches "dos", "ddos", or "flood" as whole words
                    </div>
                </div>

                <button
                    onClick={addRule}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--accent-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Plus size={16} /> Add Rule
                </button>
            </div>

            {/* Tips Section */}
            <div style={{
                background: 'rgba(33,150,243,0.05)',
                border: '1px solid rgba(33,150,243,0.2)',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--accent-blue)' }}>
                    📚 Rule Writing Tips
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                    <li><strong>Use word boundaries:</strong> \b(pattern)\b prevents partial matches</li>
                    <li><strong>Case-insensitive:</strong> All patterns are automatically case-insensitive</li>
                    <li><strong>Alternatives:</strong> Use pipe operator | for multiple patterns: (dos|ddos|flood)</li>
                    <li><strong>Special chars:</strong> Escape special regex characters: \. \[ \] etc.</li>
                    <li><strong>Categories:</strong> Ensure category matches attack types in your dataset</li>
                    <li><strong>Testing:</strong> Test patterns on sample logs before deploying</li>
                </ul>
            </div>
        </div>
    )
}
