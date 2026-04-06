import React from 'react'
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'

// Professional status configuration
export const STATUS_CONFIG = {
  'Mitigated': { color: 'var(--accent-green)', icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.1)' },
  'Under Review': { color: 'var(--accent-purple)', icon: Clock, bg: 'rgba(139, 92, 246, 0.1)' },
  'Escalated': { color: 'var(--accent-red)', icon: AlertCircle, bg: 'rgba(239, 68, 68, 0.1)' },
  'Closed': { color: 'var(--text-secondary)', icon: XCircle, bg: 'rgba(255, 255, 255, 0.05)' }
}

export default function StatusBadge({ status, onClick }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Closed']
  const Icon = config.icon

  return (
    <div 
      onClick={onClick}
      className="glass-badge"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        backgroundColor: config.bg, 
        color: config.color,
        border: `1px solid ${config.color}33`,
        cursor: onClick ? 'pointer' : 'default',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'all 0.2s'
      }}
    >
      <Icon size={14} />
      {status}
    </div>
  )
}
