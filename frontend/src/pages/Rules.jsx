import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Search, Trash2, Plus, CheckCircle, Loader2, Filter } from 'lucide-react'

const API = '/api'

export default function Rules() {
    const [rules, setRules] = useState([])
    const [filteredRules, setFilteredRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [categories, setCategories] = useState([])

    useEffect(() => {
        loadRules()
    }, [])

    useEffect(() => {
        filterRules()
    }, [rules, searchTerm, categoryFilter])

    const loadRules = async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API}/rules`)
            const data = await r.json()
            const rulesData = data.rules || []
            setRules(rulesData)
            const cats = ['ALL', ...new Set(rulesData.map(r => r.category || 'unknown'))]
            setCategories(cats.sort())
        } catch (e) {
            toast.error('Failed to load rules')
            setRules([])
        } finally {
            setLoading(false)
        }
    }

    const filterRules = () => {
        if (!Array.isArray(rules)) return
        let filtered = [...rules]
        if (categoryFilter && categoryFilter !== 'ALL') {
            filtered = filtered.filter(r => (r.category || '').toLowerCase() === categoryFilter.toLowerCase())
        }
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            filtered = filtered.filter(r =>
                (r.name || '').toLowerCase().includes(search) ||
                (r.pattern || '').toLowerCase().includes(search) ||
                (r.category || '').toLowerCase().includes(search)
            )
        }
        setFilteredRules(filtered)
    }


    const getCategoryColor = (category) => {
        const colors = {
            'dos': '#FF6B6B', 'recon': '#4ECDC4', 'backdoor': '#FF4757', 'exploits': '#FFE66D',
            'fuzzers': '#95E1D3', 'shellcode': '#F38181', 'worms': '#AA96DA', 'analysis': '#FCBAD3',
            'generic': '#A8D8EA', 'intrusion': '#FF6348', 'anomaly': '#FFA502', 'auth': '#C44569'
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
        <div className="rules-page" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div className="rules-header" style={{ padding: '0 0 24px 0', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FileText size={32} color="var(--accent-blue)" />
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Detection Rules</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, opacity: 0.8 }}>
                    Manage pattern-based detection rules for the hybrid threat detection system
                </p>
            </div>

            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="input-label">Active Signatures</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{rules.length}</div>
                        </div>
                        <FileText size={40} opacity={0.15} />
                    </div>
                </div>
                <div className="card glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-purple)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="input-label">Categories</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{Math.max(0, categories.length - 1)}</div>
                        </div>
                        <Filter size={40} opacity={0.15} />
                    </div>
                </div>
                <div className="card glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-green)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="input-label">System Status</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <div style={{ background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)', width: 8, height: 8, borderRadius: '50%' }} />
                                LIVE PROTECTED
                            </div>
                        </div>
                        <CheckCircle size={40} opacity={0.15} />
                    </div>
                </div>
            </div>

            <div className="card glass-panel" style={{ padding: '28px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'var(--accent-purple)', padding: '8px', borderRadius: '8px' }}><Filter size={20} color="white" /></div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Signature Distribution</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {categories.filter(c => c !== 'ALL').map(cat => {
                        const count = rules.filter(r => (r.category || '').toLowerCase() === cat.toLowerCase()).length
                        return (
                            <div key={cat} onClick={() => setCategoryFilter(cat)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', cursor: 'pointer', border: categoryFilter === cat ? '1px solid var(--accent-purple)' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: getCategoryColor(cat) }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{cat}</span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '20px' }}>{count}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="card glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input className="input-pro" style={{ paddingLeft: '44px', background: 'rgba(0,0,0,0.3)' }} type="text" placeholder="Search signatures..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="input-pro" style={{ width: '160px', background: 'rgba(0,0,0,0.3)' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1fr 80px', padding: '16px 24px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    <div>Identifier</div>
                    <div>Pattern</div>
                    <div>Category</div>
                    <div>Severity</div>
                    <div style={{ textAlign: 'right' }}>Ops</div>
                </div>

                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="spin" style={{ margin: '0 auto' }} /></div>
                    ) : filteredRules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>No signatures found matching your criteria.</div>
                    ) : filteredRules.map((rule, idx) => (
                        <div key={idx} className="rule-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1fr 80px', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', fontSize: '13px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{rule.name}</div>
                            <div className="pattern-code" title={rule.pattern}>{rule.pattern}</div>
                            <div><span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: `${getCategoryColor(rule.category)}15`, color: getCategoryColor(rule.category), border: `1px solid ${getCategoryColor(rule.category)}33` }}>{rule.category}</span></div>
                            <div>
                                {(() => {
                                    const b = getSeverityBadge(rule.severity)
                                    return <span style={{ background: b.bg, border: `1px solid ${b.border}44`, color: b.text, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{rule.severity}</span>
                                })()}
                            </div>
                            <div style={{ textAlign: 'right' }}><button className="btn-icon" style={{ opacity: 0.3 }} disabled><Trash2 size={16} /></button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
