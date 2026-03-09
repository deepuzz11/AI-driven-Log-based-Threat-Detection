import React from 'react'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, ArcElement, BarElement, RadialLinearScale
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Activity, ShieldAlert, Zap, Clock, Cpu, HardDrive, MemoryStick, Wifi } from 'lucide-react'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, ArcElement, BarElement, RadialLinearScale
)

export default function Analytics() {
    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Total Events Analysed',
                data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Threats Blocked',
                data: [20, 50, 40, 100, 10, 30, 80],
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    }

    const donutData = {
        labels: ['Normal Traffic', 'Exploits', 'Fuzzers', 'DoS', 'Backdoor', 'Recon'],
        datasets: [
            {
                data: [65, 12, 8, 6, 5, 4],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(6, 182, 212, 0.8)'
                ],
                borderWidth: 0,
            }
        ]
    }

    const barData = {
        labels: ['Exploits', 'Fuzzers', 'DoS', 'Backdoor', 'Worms', 'Recon', 'Shellcode', 'Generic'],
        datasets: [
            {
                label: 'Attack Frequency',
                data: [45, 32, 28, 20, 15, 12, 8, 5],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(6, 182, 212, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(107, 114, 128, 0.7)',
                ],
                borderRadius: 6,
                borderSkipped: false,
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#a1a1aa', font: { size: 12 } } }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } }
        }
    }

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#a1a1aa', padding: 12, font: { size: 11 } } }
        }
    }

    const stats = [
        { label: 'Total Logs Processed', value: '20,600', icon: Activity, color: 'var(--text-primary)' },
        { label: 'Threats Intercepted', value: '330', icon: ShieldAlert, color: 'var(--accent-red)' },
        { label: 'Active Rules', value: '12', icon: Zap, color: 'var(--accent-green)' },
        { label: 'Avg Inference Time', value: '3.4ms', icon: Clock, color: 'var(--accent-blue)' },
    ]

    const systemMetrics = [
        { label: 'CPU Usage', value: '34%', percent: 34, icon: Cpu, color: 'var(--accent-blue)' },
        { label: 'Memory', value: '2.1 / 8 GB', percent: 26, icon: MemoryStick, color: 'var(--accent-purple)' },
        { label: 'Disk I/O', value: '120 MB/s', percent: 48, icon: HardDrive, color: 'var(--accent-cyan)' },
        { label: 'Network', value: '850 Mbps', percent: 65, icon: Wifi, color: 'var(--accent-green)' },
    ]

    const recentThreats = [
        { time: '2 min ago', type: 'Exploits', source: '192.168.1.45', status: 'Blocked' },
        { time: '8 min ago', type: 'DoS', source: '10.0.0.12', status: 'Blocked' },
        { time: '15 min ago', type: 'Fuzzers', source: '172.16.0.88', status: 'Quarantined' },
        { time: '22 min ago', type: 'Backdoor', source: '192.168.2.10', status: 'Blocked' },
        { time: '31 min ago', type: 'Recon', source: '10.0.1.55', status: 'Logged' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0' }}>

            {/* ── HEADER + STATS ── */}
            <div className="card glass-panel fade-in-scale stagger-1" style={{ padding: '28px' }}>
                <div className="slide-up stagger-2">
                    <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                        Threat Analytics Platform
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                        System-wide overview of logging activity and hybrid engine interception rates.
                    </p>
                </div>

                <div className="slide-up stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {stats.map((s, i) => {
                        const Icon = s.icon
                        return (
                            <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon size={16} style={{ color: s.color, opacity: 0.8 }} />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                                </div>
                                <span style={{ fontSize: '28px', color: s.color, fontWeight: 700 }}>{s.value}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="slide-up stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div className="card glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Network Traffic Volume</h3>
                    <div style={{ height: '280px' }}>
                        <Line data={lineData} options={chartOptions} />
                    </div>
                </div>
                <div className="card glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Traffic Distribution</h3>
                    <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={donutData} options={donutOptions} />
                    </div>
                </div>
            </div>

            {/* ── ATTACK VECTORS BAR + SYSTEM METRICS ── */}
            <div className="slide-up stagger-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div className="card glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Attack Vectors (Last 7 Days)</h3>
                    <div style={{ height: '280px' }}>
                        <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                    </div>
                </div>

                <div className="card glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>System Resources</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {systemMetrics.map((m, i) => {
                            const Icon = m.icon
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <Icon size={14} style={{ color: m.color }} /> {m.label}
                                        </span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${m.percent}%`,
                                            background: m.color,
                                            borderRadius: '3px',
                                            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── RECENT THREAT ACTIVITY ── */}
            <div className="card glass-panel slide-up stagger-5" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Threat Activity</h3>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Time</th>
                                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Threat Type</th>
                                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Source IP</th>
                                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentThreats.map((t, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{t.time}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldAlert size={14} style={{ color: 'var(--accent-red)' }} /> {t.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>{t.source}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span className="glass-badge" style={{
                                            background: t.status === 'Blocked' ? 'rgba(239, 68, 68, 0.1)' : t.status === 'Quarantined' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: t.status === 'Blocked' ? 'var(--accent-red)' : t.status === 'Quarantined' ? 'var(--accent-amber)' : 'var(--accent-blue)'
                                        }}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
