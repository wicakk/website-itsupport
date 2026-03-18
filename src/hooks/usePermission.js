// src/hooks/usePermission.js
import { useMemo } from 'react'
import { useAuth } from '../context/AppContext'
import { loadRolePermissions } from '../config/rolePermissions'

/**
 * Hook untuk cek permission user yang sedang login.
 *
 * Contoh pakai:
 *   const { can, role, isSuperAdmin } = usePermission()
 *   if (can('tickets.assign')) { ... }
 */
export default function usePermission() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user?.role) return []
    const all = loadRolePermissions()
    return all[user.role] ?? []
  }, [user?.role])

  const can = (permKey) => permissions.includes(permKey)

  const canAny = (...keys) => keys.some(k => permissions.includes(k))

  const canAll = (...keys) => keys.every(k => permissions.includes(k))

  return {
    can,
    canAny,
    canAll,
    permissions,
    role: user?.role ?? null,
    isSuperAdmin: user?.role === 'super_admin',
    isManagerIT:  ['super_admin', 'manager_it'].includes(user?.role),
    isTechnician: ['super_admin', 'manager_it', 'it_support'].includes(user?.role),
  }
}