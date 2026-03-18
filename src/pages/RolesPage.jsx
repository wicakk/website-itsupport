// src/pages/RolesPage.jsx
import { useState, useCallback } from 'react'
import { Shield, ChevronDown, RotateCcw, Save, Check, Info } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import usePermission from '../hooks/usePermission'
import {
  ROLES,
  ROLE_DESCRIPTIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  loadRolePermissions,
  saveRolePermissions,
} from '../config/rolePermissions'
import { PageHeader } from '../components/ui'

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 50,
      padding: '10px 16px', borderRadius: 12, color: '#fff',
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      background: type === 'success' ? '#059669' : '#DC2626',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'slideUp 0.25s ease-out',
    }}>
      <Check size={14} /> {message}
    </div>
  )
}

// ─── Permission Group Card ─────────────────────────────────────────────────────
function PermGroupCard({ group, selectedPerms, onToggleItem, onToggleGroup, theme }) {
  const [open, setOpen] = useState(true)
  const allKeys  = group.items.map(i => i.key)
  const checked  = allKeys.filter(k => selectedPerms.includes(k)).length
  const allOn    = checked === allKeys.length
  const someOn   = checked > 0 && !allOn

  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Group header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: theme.surfaceAlt,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Group checkbox */}
        <div
          onClick={e => { e.stopPropagation(); onToggleGroup(group.key, !allOn) }}
          style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            border: `2px solid ${allOn || someOn ? theme.accent : theme.border}`,
            background: allOn ? theme.accent : someOn ? theme.accent + '55' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {allOn  && <Check size={10} color="#fff" strokeWidth={3} />}
          {someOn && !allOn && <div style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }} />}
        </div>

        <span style={{ fontSize: 12, fontWeight: 700, color: theme.text, flex: 1 }}>
          {group.group}
        </span>
        <span style={{
          fontSize: 10, color: theme.textMuted,
          background: theme.surface, border: `1px solid ${theme.border}`,
          padding: '2px 7px', borderRadius: 20,
        }}>
          {checked}/{allKeys.length}
        </span>
        <ChevronDown size={13} color={theme.textMuted}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Items */}
      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderTop: `1px solid ${theme.border}`,
        }}>
          {group.items.map((item, idx) => {
            const on = selectedPerms.includes(item.key)
            return (
              <label
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  borderBottom: idx < group.items.length - 2 ? `1px solid ${theme.border}` : 'none',
                  borderRight: idx % 2 === 0 ? `1px solid ${theme.border}` : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: on
                    ? (theme.isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)')
                    : 'transparent',
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = theme.surfaceAlt }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
              >
                <div
                  onClick={() => onToggleItem(item.key)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${on ? theme.accent : theme.border}`,
                    background: on ? theme.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {on && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.text }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: 'monospace' }}>
                    {item.key}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Role Tab Button ───────────────────────────────────────────────────────────
function RoleTab({ roleKey, active, onClick, theme, hasChanges }) {
  const cfg = ROLES[roleKey]
  return (
    <button
      onClick={() => onClick(roleKey)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 3, padding: '10px 16px',
        borderRadius: 10,
        border: active
          ? `1.5px solid ${cfg.color}55`
          : `1px solid ${theme.border}`,
        background: active ? cfg.bg : theme.surface,
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: 130,
      }}
    >
      {/* dot badge perubahan belum disimpan */}
      {hasChanges && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#F59E0B',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cfg.color,
        }} />
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: active ? cfg.color : theme.text,
        }}>
          {cfg.label}
        </span>
      </div>
      <span style={{ fontSize: 10, color: theme.textMuted, textAlign: 'left', lineHeight: 1.3 }}>
        {ROLE_DESCRIPTIONS[roleKey]}
      </span>
    </button>
  )
}

// ─── RolesPage ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const { T: theme } = useTheme()
  const { isSuperAdmin } = usePermission()

  // State
  const [activeRole, setActiveRole]   = useState('super_admin')
  const [perms, setPerms]             = useState(() => loadRolePermissions())
  const [savedPerms, setSavedPerms]   = useState(() => loadRolePermissions())
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Cek apakah ada perubahan yang belum disimpan per role
  const hasChanges = useCallback((roleKey) => {
    const cur  = [...(perms[roleKey] ?? [])].sort().join(',')
    const orig = [...(savedPerms[roleKey] ?? [])].sort().join(',')
    return cur !== orig
  }, [perms, savedPerms])

  const anyUnsaved = Object.keys(ROLES).some(r => hasChanges(r))

  // Toggle satu permission
  const toggleItem = (permKey) => {
    setPerms(prev => {
      const cur = prev[activeRole] ?? []
      return {
        ...prev,
        [activeRole]: cur.includes(permKey)
          ? cur.filter(k => k !== permKey)
          : [...cur, permKey],
      }
    })
  }

  // Toggle seluruh group
  const toggleGroup = (groupKey, enable) => {
    const group = ALL_PERMISSIONS.find(g => g.key === groupKey)
    if (!group) return
    const keys = group.items.map(i => i.key)
    setPerms(prev => {
      const cur = prev[activeRole] ?? []
      if (enable) {
        return { ...prev, [activeRole]: [...new Set([...cur, ...keys])] }
      } else {
        return { ...prev, [activeRole]: cur.filter(k => !keys.includes(k)) }
      }
    })
  }

  // Simpan
  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      saveRolePermissions(perms)
      setSavedPerms(JSON.parse(JSON.stringify(perms)))
      setSaving(false)
      showToast('Permissions berhasil disimpan ✓')
    }, 500)
  }

  // Reset ke default
  const handleReset = () => {
    setPerms(prev => ({
      ...prev,
      [activeRole]: [...DEFAULT_ROLE_PERMISSIONS[activeRole]],
    }))
    showToast(`${ROLES[activeRole].label} direset ke default`, 'info')
  }

  const currentPerms = perms[activeRole] ?? []
  const totalPerms   = ALL_PERMISSIONS.flatMap(g => g.items).length

  // Super admin lock: tidak bisa diedit (selalu semua)
  const isLocked = activeRole === 'super_admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Role Management"
        subtitle="Kelola permissions untuk setiap role dalam sistem"
        action={
          anyUnsaved && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: theme.accent, color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Menyimpan...</>
                : <><Save size={13} /> Simpan Semua Perubahan</>
              }
            </button>
          )
        }
      />

      {/* ── Role Tabs ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.keys(ROLES).map(rk => (
          <RoleTab
            key={rk}
            roleKey={rk}
            active={activeRole === rk}
            onClick={setActiveRole}
            theme={{ ...theme, isDark: theme.surface === '#0D1626' || theme.text === '#E2E8F0' }}
            hasChanges={hasChanges(rk)}
          />
        ))}
      </div>

      {/* ── Active Role Panel ── */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* Header panel */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: ROLES[activeRole].bg,
              border: `1px solid ${ROLES[activeRole].border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={15} color={ROLES[activeRole].color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
                {ROLES[activeRole].label}
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>
                {currentPerms.length} dari {totalPerms} permissions aktif
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Progress bar */}
            <div style={{ width: 100, height: 4, borderRadius: 2, background: theme.border, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(currentPerms.length / totalPerms) * 100}%`,
                background: ROLES[activeRole].color,
                borderRadius: 2, transition: 'width 0.3s',
              }} />
            </div>

            {/* Lock notice untuk super admin */}
            {isLocked ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: 11, color: '#F59E0B',
              }}>
                <Info size={11} />
                Super Admin selalu punya semua akses
              </div>
            ) : (
              <button
                onClick={handleReset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  background: 'transparent', color: theme.textMuted,
                  border: `1px solid ${theme.border}`,
                  fontSize: 11, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.textMuted }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border }}
              >
                <RotateCcw size={11} /> Reset Default
              </button>
            )}
          </div>
        </div>

        {/* Permission groups */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isLocked ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              color: theme.textMuted, fontSize: 13,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <Shield size={32} color={ROLES.super_admin.color} />
              <div style={{ fontWeight: 600, color: theme.text }}>Super Admin memiliki semua permissions</div>
              <div style={{ fontSize: 12 }}>Role ini tidak dapat dibatasi aksesnya.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {ALL_PERMISSIONS.flatMap(g => g.items).map(p => (
                  <span key={p.key} style={{
                    fontSize: 10, fontFamily: 'monospace',
                    padding: '2px 8px', borderRadius: 4,
                    background: ROLES.super_admin.bg,
                    color: ROLES.super_admin.color,
                    border: `1px solid ${ROLES.super_admin.border}`,
                  }}>
                    {p.key}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            ALL_PERMISSIONS.map(group => (
              <PermGroupCard
                key={group.key}
                group={group}
                selectedPerms={currentPerms}
                onToggleItem={toggleItem}
                onToggleGroup={toggleGroup}
                theme={theme}
              />
            ))
          )}
        </div>

      </div>

      {/* ── Perbandingan cepat semua role ── */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
          fontSize: 12, fontWeight: 700, color: theme.text,
        }}>
          Perbandingan Permission Antar Role
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: theme.surfaceAlt }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: theme.textMuted, fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>
                  Modul
                </th>
                {Object.keys(ROLES).map(rk => (
                  <th key={rk} style={{ padding: '8px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: ROLES[rk].color, borderBottom: `1px solid ${theme.border}` }}>
                    {ROLES[rk].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map(group => {
                const total = group.items.length
                return (
                  <tr key={group.key}
                    style={{ borderTop: `1px solid ${theme.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px', fontSize: 12, color: theme.text, fontWeight: 500 }}>
                      {group.group}
                    </td>
                    {Object.keys(ROLES).map(rk => {
                      const rolePerms = perms[rk] ?? []
                      const cnt = group.items.filter(i => rolePerms.includes(i.key)).length
                      const all = cnt === total
                      const none = cnt === 0
                      return (
                        <td key={rk} style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            gap: 4, fontSize: 11, fontWeight: 600,
                            padding: '2px 8px', borderRadius: 20,
                            background: all  ? ROLES[rk].bg :
                                        none ? theme.surfaceAlt :
                                        'rgba(245,158,11,0.1)',
                            color: all  ? ROLES[rk].color :
                                   none ? theme.textMuted :
                                   '#F59E0B',
                            border: `1px solid ${
                              all  ? ROLES[rk].border :
                              none ? theme.border :
                              'rgba(245,158,11,0.3)'
                            }`,
                          }}>
                            {all ? '✓ Semua' : none ? '—' : `${cnt}/${total}`}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
