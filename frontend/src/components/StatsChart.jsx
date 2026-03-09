import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    DoughnutController,
    ArcElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    DoughnutController,
    ArcElement
);

ChartJS.defaults.color = '#9ba1b4';
ChartJS.defaults.font.family = 'Outfit, sans-serif';

function StatsChart({ stats }) {
    if (!stats) return null;

    const totalCardStyle = {
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    };

    const doughnutData = {
        labels: ['Attacks', 'Benign'],
        datasets: [
            {
                data: [stats.attacks, stats.benign],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)', // red
                    'rgba(16, 185, 129, 0.8)' // green
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 4
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#f0f2f8' } },
            title: { display: true, text: 'Dataset Distribution', color: '#f0f2f8', padding: { bottom: 20 } },
        },
        cutout: '70%',
    };

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header"><span className="icon">📊</span> Analytics Overview</div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Doughnut Chart */}
                <div style={{ height: '220px', position: 'relative' }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div style={{
                        position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
                        textAlign: 'center', pointerEvents: 'none'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#f0f2f8' }}>
                            {((stats.attacks / stats.total) * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ba1b4', textTransform: 'uppercase' }}>Attacks</div>
                    </div>
                </div>

                {/* Global Summary */}
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ ...totalCardStyle, gridRow: 'span 2' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-blue)', textShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}>
                            {stats.total?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            Total Samples Analyzed
                        </div>
                    </div>
                    <div style={{ ...totalCardStyle, flexDirection: 'row', justifyContent: 'space-between', padding: '0 20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            Active Rules
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-purple)' }}>
                            {stats.rules_count}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default StatsChart;
