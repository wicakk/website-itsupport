export const PAGE_PERMISSIONS = {
  dashboard: ["super_admin","manager_it","it_support","user"],
  tickets: ["super_admin","manager_it","it_support","user"],
  assets: ["super_admin","manager_it"],
  knowledge: ["super_admin","manager_it","it_support"],
  monitoring: ["super_admin","manager_it"],
  reports: ["super_admin","manager_it"],
  users: ["super_admin"],
  settings: ["super_admin"]
}

export const NAV_PERMISSIONS = PAGE_PERMISSIONS // export alias