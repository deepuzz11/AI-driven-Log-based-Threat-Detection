/**
 * Centralized Toast Notification Utilities
 * Eliminates repetitive toast definitions across the application
 */

import { toast } from 'react-hot-toast'
import { CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react'

/**
 * Success toast with custom styling
 */
export const toastSuccess = (title, message, duration = 3000) => {
    toast.custom((t) => (
        <div className="custom-toast success slide-down">
            <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
            <div className="custom-toast-content">
                <div className="custom-toast-title">{title}</div>
                <div className="custom-toast-message">{message}</div>
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
            <div className="custom-toast-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    ), { duration })
}

/**
 * Error toast with custom styling
 */
export const toastError = (title, message, duration = 4000) => {
    toast.custom((t) => (
        <div className="custom-toast error slide-down">
            <div className="custom-toast-icon"><AlertTriangle size={18} /></div>
            <div className="custom-toast-content">
                <div className="custom-toast-title">{title}</div>
                <div className="custom-toast-message">{message}</div>
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
            <div className="custom-toast-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    ), { duration })
}

/**
 * Loading toast without auto-dismiss
 */
export const toastLoading = (title, message) => {
    return toast.custom((t) => (
        <div className="custom-toast info slide-down">
            <div className="custom-toast-icon"><Loader2 size={18} className="spinner" /></div>
            <div className="custom-toast-content">
                <div className="custom-toast-title">{title}</div>
                <div className="custom-toast-message">{message}</div>
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
        </div>
    ), { duration: Infinity })
}

/**
 * Data-ready toast with action
 */
export const toastDataReady = (title, message, actionLabel, onAction) => {
    return toast.custom((t) => (
        <div className="custom-toast success slide-down">
            <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
            <div className="custom-toast-content">
                <div className="custom-toast-title">{title}</div>
                <div className="custom-toast-message">{message}</div>
                <button onClick={() => { onAction(); toast.dismiss(t.id); }} 
                    style={{
                        marginTop: '8px',
                        padding: '4px 12px',
                        background: 'var(--accent-green)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                    {actionLabel}
                </button>
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
            <div className="custom-toast-progress" style={{ animationDuration: '4s' }} />
        </div>
    ), { duration: 4000 })
}

/**
 * Multi-message toast for larger updates
 */
export const toastInfo = (title, items) => {
    toast.custom((t) => (
        <div className="custom-toast info slide-down">
            <div className="custom-toast-icon"><CheckCircle2 size={18} /></div>
            <div className="custom-toast-content">
                <div className="custom-toast-title">{title}</div>
                {Array.isArray(items) ? (
                    items.map((item, i) => (
                        <div key={i} className="custom-toast-message" style={{ fontSize: '12px', opacity: 0.9, marginTop: i > 0 ? '4px' : '0' }}>
                            • {item}
                        </div>
                    ))
                ) : (
                    <div className="custom-toast-message">{items}</div>
                )}
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
            <div className="custom-toast-progress" style={{ animationDuration: '3s' }} />
        </div>
    ), { duration: 3000 })
}

/**
 * Remove all active toasts
 */
export const clearAllToasts = () => {
    toast.remove()
}

/**
 * Confirmation toast with custom styling
 */
export const toastConfirmAction = (title, message, actionLabel, onConfirm, onCancel = () => {}) => {
    toast.custom((t) => (
        <div className="custom-toast info slide-down" style={{ borderLeft: '4px solid var(--accent-red)' }}>
            <div className="custom-toast-icon"><AlertTriangle size={18} style={{ color: 'var(--accent-red)' }} /></div>
            <div className="custom-toast-content" style={{ width: '100%' }}>
                <div className="custom-toast-title" style={{ color: 'var(--accent-red)' }}>{title}</div>
                <div className="custom-toast-message" style={{ marginBottom: '12px' }}>{message}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onConfirm(); toast.dismiss(t.id); }} 
                        style={{
                            padding: '6px 14px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--accent-red)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            flex: 1
                        }}>
                        {actionLabel}
                    </button>
                    <button onClick={() => { onCancel(); toast.dismiss(t.id); }} 
                        style={{
                            padding: '6px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            flex: 1
                        }}>
                        Cancel
                    </button>
                </div>
            </div>
            <button className="custom-toast-close" onClick={() => toast.dismiss(t.id)}><X size={14} /></button>
        </div>
    ), { duration: Infinity })
}
