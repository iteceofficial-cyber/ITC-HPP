import React from 'react';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Calculator,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Users,
  History,
  Settings,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';
import { store } from '../../lib/store';

export type ActiveTab =
  | 'dashboard'
  | 'packages'
  | 'create_package'
  | 'calculator'
  | 'simulation'
  | 'templates'
  | 'reports'
  | 'approvals'
  | 'admin_management'
  | 'audit_log'
  | 'settings'
  | 'testing';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  onOpenBrandModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
  onOpenBrandModal,
  onLogout,
}) => {
  const currentUser = store.getCurrentUser();
  const role = currentUser.role;

  // Filter menu berdasarkan peran
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'packages',
      label: 'Paket Tour',
      icon: Compass,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'create_package',
      label: 'Buat Paket Baru',
      icon: PlusCircle,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'calculator',
      label: 'Kalkulator HPP',
      icon: Calculator,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'simulation',
      label: 'Simulasi Harga',
      icon: TrendingUp,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'templates',
      label: 'Template Biaya',
      icon: FileText,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'reports',
      label: 'Laporan & Ekspor',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'approvals',
      label: 'Persetujuan Paket',
      icon: CheckSquare,
      badge: pendingApprovalsCount,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'admin_management',
      label: 'Manajemen Admin',
      icon: Users,
      roles: ['super_admin'],
    },
    {
      id: 'audit_log',
      label: 'Audit Log',
      icon: History,
      roles: ['super_admin'],
    },
    {
      id: 'testing',
      label: 'Uji Kalkulasi',
      icon: FlaskConical,
      roles: ['super_admin', 'admin', 'viewer'],
    },
    {
      id: 'settings',
      label: 'Pengaturan & DB',
      icon: Settings,
      roles: ['super_admin', 'admin', 'viewer'],
    },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  const branding = store.getBranding();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none no-print min-h-screen">
      {/* Brand Header */}
      <div
        onClick={onOpenBrandModal}
        className="h-16 flex items-center px-4 border-b border-slate-800 gap-3 cursor-pointer hover:bg-slate-800/60 transition-colors group"
        title="Klik untuk mengubah nama web dan logo"
      >
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.appName}
            className="h-10 w-10 object-contain rounded-md bg-white/10 p-1 border border-white/20 shadow-xs shrink-0 group-hover:border-blue-400 transition-colors"
          />
        ) : (
          <div
            style={{ backgroundColor: branding.themeColor || '#1d4ed8' }}
            className="h-9 w-9 rounded-md flex items-center justify-center text-white font-extrabold text-base shadow-md shrink-0 group-hover:scale-105 transition-transform"
          >
            {branding.logoText || branding.appName?.slice(0, 2).toUpperCase() || 'TC'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-white text-sm tracking-tight truncate flex items-center justify-between">
            <span className="truncate group-hover:text-blue-300 transition-colors">
              {branding.appName}
            </span>
            <span className="text-[9px] font-semibold text-blue-400 bg-blue-950/80 px-1 py-0.2 rounded border border-blue-800/60 shrink-0">
              PRO
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate leading-tight group-hover:text-slate-300">
            {branding.tagline || 'HPP & Costing Travel'}
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* User Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
              alt={currentUser.full_name}
              className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {currentUser.full_name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="capitalize truncate">
                  {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Viewer'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onLogout) onLogout();
              else store.logout();
            }}
            title="Keluar dari akun"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <span className="text-[11px] font-medium">Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
