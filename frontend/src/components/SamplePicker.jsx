import React from 'react';
import { FolderOpen, Dices, Zap, Loader2 } from 'lucide-react'
import StatsChart from './StatsChart';

function StatItem({ value, label, color }) {
  return (
    <div className="stat-item">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function SamplePicker({ stats, category, setCategory, rowIndex, setRowIndex,
  pickRandom, pickByIndex, runAnalysis, loading, analyzing, sample }) {
  return (
    <div className="card">
      <div className="card-header"><FolderOpen size={16} className="icon" style={{ marginRight: 6 }} /> Sample Selection</div>
      <div className="card-body">
        <div className="form-group">
          <label className="form-label">Filter by Attack Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="ALL">ALL</option>
            {stats?.categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="btn-group" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={pickRandom} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}>
            {loading ? <Loader2 size={16} className="spinner" /> : <Dices size={16} />} Random
          </button>

          <div className="index-picker">
            <input className="form-input" type="number" placeholder="Row #"
              value={rowIndex} onChange={e => setRowIndex(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pickByIndex()} />
            <button className="btn btn-secondary" onClick={pickByIndex}>Go</button>
          </div>
        </div>

        <button className="btn-analyze" onClick={runAnalysis} disabled={!sample || analyzing}
          style={{ marginTop: 12 }}>
          {analyzing ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Loader2 size={16} className="spinner" /> Analyzing...</div> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Zap size={16} /> Run Hybrid Analysis</div>}
          {!analyzing && <span className="shimmer" />}
        </button>

        <StatsChart stats={stats} />
      </div>
    </div>
  )
}

export default SamplePicker;
