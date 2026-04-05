import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Search, Trash2, Plus, AlertTriangle, CheckCircle, Loader2, Filter } from 'lucide-react'

const API = '/api'

export default function Rules() {
    const [stats, setStats] = useState(null)
    const [rules, setRules] = useState([])
    const [filteredRules, setFilteredRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [categories, setCategories] = useState([])
    const [newRuleForm, setNewRuleForm] = useState({
        name: '',
        regex: '',
        category: 'generic',
        severity: 'MEDIUM'
    })

    useEffect(() => {
        loadStats()
        loadRules()
    }, [])

    useEffect(() => {
        filterRules()
    }, [rules, searchTerm, categoryFilter])

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
            const r = await fetch(`${API}/rules`)
            const data = await r.json()
            setRules(data.rules || [])
            
            // Extract unique categories
            const cats = ['ALL', ...new Set(data.rules.map(r => r.category))]
            setCategories(cats.sort())
        } catch (e) {
            console.error(e)
            toast.error('Failed to load rules')
        } finally {
            setLoading(false)
        }
    }

    const filterRules = () => {
        let filtered = rules
        
        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(r => r.category.toLowerCase() === categoryFilter.toLowerCase())
        }
        
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(search) ||
                r.pattern.toLowerCase().includes(search) ||
                r.category.toLowerCase().includes(search)
            )
        }
        
        setFilteredRules(filtered)
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
                await loadRules()
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
            'anomaly': '#FFA502',
            'auth': '#C44569'
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
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FileText size={32} color="var(--accent-blue)" />
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Detection Rules</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Manage pattern-based detection rules for the hybrid threat detection system
                </p>
            </div>

            {/* Stats Row */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'rgba(63,185,80,0.1)',
                        border: '1px solid rgba(63,185,80,0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                            Total Rules
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-green)' }}>
                            {rules.length}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                {/* Add Rule Form */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>➕ Add New Rule</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                Rule Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., sql_injection_attempt"
                                value={newRuleForm.name}
                                onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                Regex Pattern
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., \\b(sql|injection)\\b"
                                value={newRuleForm.regex}
                                onChange={(e) => setNewRuleForm({ ...newRuleForm, regex: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                    Category
                                </label>
                                <select
                                    value={newRuleForm.category}
                                    onChange={(e) => setNewRuleForm({ ...newRuleForm, category: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="generic">Generic</option>
                                    <option value="dos">DoS/DDoS</option>
                                    <option value="recon">Reconnaissance</option>
                                    <option value="backdoor">Backdoor</option>
                                    <option value="exploits">Exploits</option>
                                    <option value="fuzzers">Fuzzers</option>
                                    <option value="worms">Worms</option>
                                    <option value="analysis">Analysis</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                    Severity
                                </label>
                                <select
                                    value={newRuleForm.severity}
                                    onChange={(e) => setNewRuleForm({ ...newRuleForm, severity: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: 'var(--bg-primary)',
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
                        <button
                            onClick={addRule}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--accent-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                marginTop: '8px'
                            }}
                        >
                            <Plus size={16} style={{ marginRight: '4px', display: 'inline' }} />
                            Add Rule
                        </button>
                    </div>
                </div>

                {/* Rules Summary */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>📊 Rules by Category</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categories.filter(c => c !== 'ALL').map(cat => {
                            const count = rules.filter(r => r.category.toLowerCase() === cat.toLowerCase()).length
                            return (
                                <div key={cat} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ 
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: getCategoryColor(cat)
                                        }} />
                                        {cat}
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        background: 'rgba(100,100,100,0.2)',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {count}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '20px',
                alignItems: 'center'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search rules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Rules Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
            ) : filteredRules.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <p>No rules found. Create the first rule to get started!</p>
                </div>
            ) : (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.03)',
                        fontWeight: 600,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)'
                    }}>
                        <div>Name</div>
                        <div>Pattern</div>
                        <div>Category</div>
                        <div>Severity</div>
                        <div>Count</div>
                    </div>
                    {filteredRules.map((rule, idx) => (
                        <div key={idx} style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr',
                            padding: '12px 16px',
                            borderBottom: idx < filteredRules.length - 1 ? '1px solid var(--border-color)' : 'none',
                            alignItems: 'center',
                            fontSize: '13px'
                        }}>
                            <div style={{ fontWeight: 500 }}>{rule.name}</div>
                            <div style={{
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={rule.pattern}>
                                {rule.pattern}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                background: `${getCategoryColor(rule.category)}22`,
                                border: `1px solid ${getCategoryColor(rule.category)}`,
                                color: getCategoryColor(rule.category),
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                width: 'fit-content'
                            }}>
                                {rule.category}
                            </div>
                            <div>
                                {(() => {
                                    const badge = getSeverityBadge(rule.severity)
                                    return (
                                        <span style={{
                                            background: badge.bg,
                                            border: `1px solid ${badge.border}`,
                                            color: badge.text,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            display: 'inline-block'
                                        }}>
                                            {rule.severity}
                                        </span>
                                    )
                                })()}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>-</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
