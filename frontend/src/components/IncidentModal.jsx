import React from 'react'
import { X, Shield, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import StatusBadge, { STATUS_CONFIG } from './StatusBadge'

export default function IncidentModal({ isOpen, onClose, incident, onStatusChange }) {
  if (!isOpen || !incident) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div 
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} 
      />
      
      <div 
        className="card glass-panel slide-up" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          position: 'relative', 
          zIndex: 1, 
          padding: '32px',
          border: '1px solid var(--border-bright)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Shield size={32} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{incident.id}</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{incident.type} Analysis</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Security Abstract</div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Detected on {incident.date}. This incident represents a high-velocity {incident.type.toLowerCase()} attempt intercepted by the Sentinel hybrid engine. Resolution status requires technical audit.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Current Resolution State</span>
             <StatusBadge status={incident.status} />
          </div>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Update Operational Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {Object.keys(STATUS_CONFIG).map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(incident.id, status)}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 12px', border: incident.status === status ? '1px solid var(--accent-blue)' : '1px solid var(--border)' }}
            >
              <StatusBadge status={status} />
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="btn-neo btn-neo-primary" 
          style={{ width: '100%', marginTop: '32px', height: '48px', justifyContent: 'center' }}
        >
          CONFIRM AUDIT
        </button>
      </div>
    </div>
  )
}
