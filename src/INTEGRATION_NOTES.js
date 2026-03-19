// ══════════════════════════════════════════════════════════════
// 1. Tambahkan ke src/pages/index.js
// ══════════════════════════════════════════════════════════════
// export { default as ProjectsPage }      from './ProjectsPage'
// export { default as ProjectDetailPage } from './ProjectDetailPage'


// ══════════════════════════════════════════════════════════════
// 2. src/App.jsx — tambahkan 2 route baru di ProtectedRoutes
// ══════════════════════════════════════════════════════════════
//
// import ProjectsPage      from './pages/ProjectsPage'
// import ProjectDetailPage from './pages/ProjectDetailPage'
//
// Di dalam <Routes>:
//   <Route path="/projects"     element={<ProjectsPage />} />
//   <Route path="/projects/:id" element={<ProjectDetailPage />} />


// ══════════════════════════════════════════════════════════════
// 3. src/config/navPermissions.js — tambahkan projects
// ══════════════════════════════════════════════════════════════
//
// export const NAV_ROLE_ONLY = {
//   roles:    ['super_admin'],
//   projects: null,  // semua role bisa lihat (filter di backend)
// }


// ══════════════════════════════════════════════════════════════
// 4. src/context/PermissionContext.jsx — tambahkan ke NAV_PERMISSION_MAP
// ══════════════════════════════════════════════════════════════
//
// const NAV_PERMISSION_MAP = {
//   ...yang sudah ada...
//   projects: null,  // selalu tampil, akses dikontrol di backend
// }


// ══════════════════════════════════════════════════════════════
// 5. src/components/layout/Sidebar.jsx — tambahkan item projects
// ══════════════════════════════════════════════════════════════
//
// import { ..., Kanban } from 'lucide-react'
//
// const ICONS = { ...yang sudah ada..., Kanban }
//
// export const NAV_ITEMS = [
//   { id: 'dashboard',  label: 'Dashboard',        iconName: 'LayoutDashboard' },
//   { id: 'tickets',    label: 'Tiket',             iconName: 'Ticket'          },
//   { id: 'projects',   label: 'Projects',          iconName: 'Kanban'          }, // ← tambahkan
//   { id: 'assets',     label: 'Asset Management',  iconName: 'Package'         },
//   { id: 'knowledge',  label: 'Knowledge Base',    iconName: 'BookOpen'        },
//   { id: 'monitoring', label: 'Monitoring',        iconName: 'Activity'        },
//   { id: 'reports',    label: 'Reports',           iconName: 'BarChart3'       },
//   { id: 'users',      label: 'User Management',   iconName: 'Users'           },
//   { id: 'roles',      label: 'Role Management',   iconName: 'Shield'          },
//   { id: 'settings',   label: 'Settings',          iconName: 'Settings'        },
// ]

export const PROJECT_SETUP_NOTES = `
Tambahkan ke routes/api.php di dalam middleware auth:sanctum:

// Projects
Route::get('projects',                           [ProjectController::class, 'index']);
Route::get('projects/{project}',                 [ProjectController::class, 'show']);
Route::middleware('role:super_admin,manager_it')->group(function () {
    Route::post('projects',                      [ProjectController::class, 'store']);
    Route::put('projects/{project}',             [ProjectController::class, 'update']);
    Route::delete('projects/{project}',          [ProjectController::class, 'destroy']);
    Route::put('projects/{project}/members',     [ProjectController::class, 'syncMembers']);
});
Route::post('projects/{project}/tasks',                [ProjectController::class, 'storeTask']);
Route::put('projects/{project}/tasks/reorder',         [ProjectController::class, 'reorderTasks']);
Route::put('projects/{project}/tasks/{task}',          [ProjectController::class, 'updateTask']);
Route::delete('projects/{project}/tasks/{task}',       [ProjectController::class, 'destroyTask']);
`
