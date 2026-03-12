export const T = {
  bg: '#050A14', surface: '#0D1626', surfaceAlt: '#111C2E', surfaceHover: '#142035',
  border: 'rgba(255,255,255,0.06)', borderAccent: 'rgba(59,139,255,0.28)',
  accent: '#3B8BFF', accentDark: '#2563EB', accentGlow: 'rgba(59,139,255,0.18)', accentSoft: 'rgba(59,139,255,0.09)',
  text: '#E8F0FE', textSub: '#A0B0CC', textMuted: '#6B7FA3', textDim: '#334466',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444', purple: '#8B5CF6', cyan: '#06B6D4',
}

export const PRIORITY_CFG = {
  Low:      { bg: 'rgba(16,185,129,0.10)',  text: '#10B981', border: 'rgba(16,185,129,0.22)',  dot: '#10B981'  },
  Medium:   { bg: 'rgba(245,158,11,0.10)',  text: '#F59E0B', border: 'rgba(245,158,11,0.22)',  dot: '#F59E0B'  },
  High:     { bg: 'rgba(249,115,22,0.10)',  text: '#F97316', border: 'rgba(249,115,22,0.22)',  dot: '#F97316'  },
  Critical: { bg: 'rgba(255,51,102,0.10)',  text: '#FF3366', border: 'rgba(255,51,102,0.30)',  dot: '#FF3366'  },
}

export const STATUS_CFG = {
  Open:           { bg: 'rgba(59,139,255,0.10)',  text: '#3B8BFF', border: 'rgba(59,139,255,0.22)'  },
  Assigned:       { bg: 'rgba(139,92,246,0.10)',  text: '#8B5CF6', border: 'rgba(139,92,246,0.22)'  },
  'In Progress':  { bg: 'rgba(6,182,212,0.10)',   text: '#06B6D4', border: 'rgba(6,182,212,0.22)'   },
  'Waiting User': { bg: 'rgba(245,158,11,0.10)',  text: '#F59E0B', border: 'rgba(245,158,11,0.22)'  },
  Resolved:       { bg: 'rgba(16,185,129,0.10)',  text: '#10B981', border: 'rgba(16,185,129,0.22)'  },
  Closed:         { bg: 'rgba(100,116,139,0.10)', text: '#64748B', border: 'rgba(100,116,139,0.22)' },
}

export const ROLE_CFG = {
  'Super Admin': { bg: 'rgba(239,68,68,0.10)',   text: '#EF4444', border: 'rgba(239,68,68,0.22)'   },
  'IT Support':  { bg: 'rgba(59,139,255,0.10)',  text: '#3B8BFF', border: 'rgba(59,139,255,0.22)'  },
  'Manager IT':  { bg: 'rgba(139,92,246,0.10)',  text: '#8B5CF6', border: 'rgba(139,92,246,0.22)'  },
  'User':        { bg: 'rgba(100,116,139,0.10)', text: '#64748B', border: 'rgba(100,116,139,0.22)' },
}

export const ASSET_STATUS_CFG = {
  Active:      { bg: 'rgba(16,185,129,0.10)',  text: '#10B981', border: 'rgba(16,185,129,0.22)'  },
  Maintenance: { bg: 'rgba(245,158,11,0.10)',  text: '#F59E0B', border: 'rgba(245,158,11,0.22)'  },
  Inactive:    { bg: 'rgba(100,116,139,0.10)', text: '#64748B', border: 'rgba(100,116,139,0.22)' },
}

export const SERVER_STATUS_CFG = {
  Online:  { color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)' },
  Warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' },
  Down:    { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)'  },
}

export const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`,
  borderRadius: 10, padding: '10px 14px', color: '#E8F0FE', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: "'Sora', sans-serif",
}

export const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7FA3',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
