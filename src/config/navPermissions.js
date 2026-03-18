// src/config/navPermissions.js
// Kontrol menu mana yang tampil untuk role apa di Sidebar

export const NAV_PERMISSIONS = {
  dashboard:  ['super_admin', 'manager_it', 'it_support', 'user'],
  tickets:    ['super_admin', 'manager_it', 'it_support', 'user'],
  assets:     ['super_admin', 'manager_it', 'it_support'],
  knowledge:  ['super_admin', 'manager_it', 'it_support', 'user'],
  monitoring: ['super_admin', 'manager_it', 'it_support'],
  reports:    ['super_admin', 'manager_it'],
  users:      ['super_admin', 'manager_it'],
  roles:      ['super_admin'],           // ← hanya super_admin
  settings:   ['super_admin', 'manager_it', 'it_support', 'user'],
}
