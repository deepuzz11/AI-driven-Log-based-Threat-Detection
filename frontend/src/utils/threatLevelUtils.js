/**
 * Threat Level Utilities
 * Centralized threat classification, color mapping, and severity logic
 */

/**
 * Threat Level Colors and Metadata
 */
export const THREAT_LEVELS = {
    CRITICAL: {
        label: 'CRITICAL',
        color: 'var(--accent-red)',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        priority: 4,
        description: 'Immediate action required',
        action: (who, what) => `Block IP ${who} immediately. Isolate host. Initiate incident response. Escalate to Tier-1 SOC. Attack type: ${what}`
    },
    HIGH: {
        label: 'HIGH',
        color: 'var(--accent-orange)',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        priority: 3,
        description: 'Swift investigation needed',
        action: (who, what) => `Block IP ${who}. Monitor ${what} activity. Alert Tier-2 analyst. Review recent connections and patterns.`
    },
    MEDIUM: {
        label: 'MEDIUM',
        color: 'var(--accent-yellow)',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        priority: 2,
        description: 'Monitoring and logging required',
        action: (who, what) => `Log activity from ${who}. Track ${what} pattern evolution. Prepare additional firewall rules. Monitor for escalation.`
    },
    LOW: {
        label: 'LOW',
        color: 'var(--accent-cyan)',
        bgColor: 'rgba(6, 182, 212, 0.1)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        priority: 1,
        description: 'Routine monitoring',
        action: (who, what) => `Monitor IP ${who}. Log ${what} event. Add to watchlist. Correlate with other security events.`
    },
    NONE: {
        label: 'BENIGN',
        color: 'var(--accent-green)',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        priority: 0,
        description: 'No threat detected',
        action: (who, what) => `No action required. Traffic appears benign. Normal activity from ${who}.`
    }
}

/**
 * Severity Level Colors and Metadata
 */
export const SEVERITY_LEVELS = {
    CRITICAL: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', priority: 4 },
    HIGH: { color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.1)', priority: 3 },
    MEDIUM: { color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.1)', priority: 2 },
    LOW: { color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.1)', priority: 1 }
}

/**
 * Get threat level from attack count and total events
 */
export const calculateThreatLevel = (attackCount, totalEvents) => {
    if (totalEvents === 0) return THREAT_LEVELS.NONE
    
    const attackPercentage = (attackCount / totalEvents) * 100
    
    if (attackPercentage > 30) return THREAT_LEVELS.CRITICAL
    if (attackPercentage > 15) return THREAT_LEVELS.HIGH
    if (attackPercentage > 5) return THREAT_LEVELS.MEDIUM
    if (attackPercentage > 0) return THREAT_LEVELS.LOW
    return THREAT_LEVELS.NONE
}

/**
 * Get threat color for a specific threat level
 */
export const getThreatColor = (threatLevel) => {
    const level = THREAT_LEVELS[threatLevel] || THREAT_LEVELS.NONE
    return level.color
}

/**
 * Get threat background color
 */
export const getThreatBgColor = (threatLevel) => {
    const level = THREAT_LEVELS[threatLevel] || THREAT_LEVELS.NONE
    return level.bgColor
}

/**
 * Get threat border color
 */
export const getThreatBorderColor = (threatLevel) => {
    const level = THREAT_LEVELS[threatLevel] || THREAT_LEVELS.NONE
    return level.borderColor
}

/**
 * Get recommended action for threat level
 */
export const getRecommendedAction = (threatLevel, sourceIP, attackType) => {
    const level = THREAT_LEVELS[threatLevel] || THREAT_LEVELS.NONE
    return level.action(sourceIP, attackType)
}

/**
 * Get severity color
 */
export const getSeverityColor = (severity) => {
    return SEVERITY_LEVELS[severity] || SEVERITY_LEVELS.MEDIUM
}

/**
 * Verdict colors (ALLOW/DENY)
 */
export const VERDICT_COLORS = {
    ALLOW: {
        color: 'var(--accent-green)',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        label: '✓ ALLOW'
    },
    DENY: {
        color: 'var(--accent-red)',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        label: '🚨 DENY'
    }
}

/**
 * Detection method colors
 */
export const DETECTION_METHODS = {
    RULE: {
        label: '📋 RULE',
        color: 'var(--accent-purple)',
        bgColor: 'rgba(168, 85, 247, 0.15)',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        description: 'Detected by rule-based engine'
    },
    ML: {
        label: '🤖 ML',
        color: 'var(--accent-blue)',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        description: 'Detected by machine learning model'
    },
    DL: {
        label: '🧠 DL',
        color: 'var(--accent-cyan)',
        bgColor: 'rgba(6, 182, 212, 0.15)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        description: 'Detected by deep learning transformer'
    },
    HYBRID: {
        label: '⚡ HYBRID',
        color: 'var(--accent-amber)',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        description: 'Detected by hybrid system'
    }
}

/**
 * Attack type to category mapping
 */
export const ATTACK_CATEGORIES = {
    'DoS': { icon: '🌊', color: 'var(--accent-red)' },
    'Exploits': { icon: '💣', color: 'var(--accent-red)' },
    'Backdoor': { icon: '🚪', color: 'var(--accent-red)' },
    'Fuzzers': { icon: '🔀', color: 'var(--accent-orange)' },
    'Worms': { icon: '🐛', color: 'var(--accent-orange)' },
    'Reconnaissance': { icon: '👁️', color: 'var(--accent-amber)' },
    'Analysis': { icon: '🔬', color: 'var(--accent-cyan)' },
    'Generic': { icon: '❓', color: 'var(--accent-blue)' },
    'Normal': { icon: '✓', color: 'var(--accent-green)' },
    'Benign': { icon: '✓', color: 'var(--accent-green)' },
    'Shellcode': { icon: '⚙️', color: 'var(--accent-red)' }
}

/**
 * Get icon and color for attack type
 */
export const getAttackTypeInfo = (attackType) => {
    return ATTACK_CATEGORIES[attackType] || { icon: '❓', color: 'var(--text-secondary)' }
}

/**
 * Format confidence as percentage string
 */
export const formatConfidence = (confidence) => {
    if (confidence === undefined || confidence === null) return 'N/A'
    return `${(confidence * 100).toFixed(0)}%`
}

/**
 * Get confidence color (gradient from red to green)
 */
export const getConfidenceColor = (confidence) => {
    if (confidence === undefined || confidence === null) return 'var(--text-secondary)'
    
    if (confidence >= 0.9) return 'var(--accent-red)'
    if (confidence >= 0.7) return 'var(--accent-orange)'
    if (confidence >= 0.5) return 'var(--accent-yellow)'
    return 'var(--accent-green)'
}

export default {
    THREAT_LEVELS,
    SEVERITY_LEVELS,
    VERDICT_COLORS,
    DETECTION_METHODS,
    ATTACK_CATEGORIES,
    calculateThreatLevel,
    getThreatColor,
    getThreatBgColor,
    getThreatBorderColor,
    getRecommendedAction,
    getSeverityColor,
    getAttackTypeInfo,
    formatConfidence,
    getConfidenceColor
}
