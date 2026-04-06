import React from 'react';
import { FolderOpen, Dices, Zap, Loader2, ChevronRight } from 'lucide-react'
import StatsChart from './StatsChart';

function SamplePicker({ stats, rowIndex, setRowIndex,
  pickRandom, pickByIndex, runAnalysis, loading, analyzing, sample }) {
  return (
    <div className="card slide-up stagger-1">
      <div className="card-header">
        <FolderOpen size={16} style={{ marginRight: '10px', color: 'var(--accent-blue)' }} />
        <span>Operational Log Acquisition</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-neo btn-neo-secondary" 
              onClick={pickRandom} 
              disabled={loading}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {loading ? <Loader2 size={16} className="spinner" /> : <Dices size={16} />}
              Grab Random
            </button>

            <div style={{ display: 'flex', gap: '4px', flex: 1.5 }}>
              <input 
                className="form-input" 
                type="number" 
                placeholder="PROBE INDEX"
                value={rowIndex} 
                onChange={e => setRowIndex(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && pickByIndex()}
                style={{ width: '100%', textAlign: 'center' }}
              />
              <button 
                className="btn-neo btn-neo-secondary" 
                onClick={pickByIndex}
                style={{ padding: '10px' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <button 
            className="btn-neo btn-neo-primary" 
            onClick={runAnalysis} 
            disabled={!sample || analyzing}
            style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '14px' }}
          >
            {analyzing ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <Zap size={18} />
            )}
            <span>{analyzing ? 'Inference in Progress...' : 'Execute Hybrid Analysis'}</span>
            {!analyzing && sample && <span className="shimmer" />}
          </button>

          <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <StatsChart stats={stats} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SamplePicker;
