import React, { useState } from 'react';
import { Search, Plus, Database, Sparkles, UserCheck, Edit3, RefreshCw, LogOut, KeyRound } from 'lucide-react';
import { store } from '../../lib/store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { UserRole } from '../../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreatePackageClick: () => void;
  onOpenSettingsClick: () => void;
  onOpenBrandModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onCreatePackageClick,
  onOpenSettingsClick,
  onOpenBrandModal,
  onOpenChangePasswordModal,
  onLogout,
}) => {
  const currentUser = store.getCurrentUser();
  const branding = store.getBranding();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleRoleChange = (role: UserRole) => {
    store.switchRole(role);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await store.pushToServer();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs no-print">
      {/* Search Input & Quick Brand Button */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode paket, destinasi, atau nama trip..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 transition-colors"
          />
        </div>

        {/* Quick Edit Nama Web & Logo */}
        {onOpenBrandModal && (
          <button
            onClick={onOpenBrandModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors shrink-0"
            title="Klik untuk mengubah nama website dan logo tampilan"
          >
            <Edit3 className="h-3.5 w-3.5 text-blue-600" />
            <span>Edit Nama & Logo</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Role Simulator Switcher */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-md border border-slate-200/80 text-xs">
          <span className="px-1.5 font-semibold text-slate-500 hidden md:inline-flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5" />
            Peran:
          </span>
          <button
            onClick={() => handleRoleChange('super_admin')}
            className={`px-2 py-0.5 font-medium rounded transition-colors text-[11px] sm:text-xs ${
              currentUser.role === 'super_admin'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Super Admin
          </button>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`px-2 py-0.5 font-medium rounded transition-colors text-[11px] sm:text-xs ${
              currentUser.role === 'admin'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleChange('viewer')}
            className={`px-2 py-0.5 font-medium rounded transition-colors text-[11px] sm:text-xs ${
              currentUser.role === 'viewer'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Viewer
          </button>
        </div>

        {/* Database Status Button with Sync capability */}
        <button
          onClick={handleManualSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Data tersimpan otomatis di Database Server & Lokal. Klik untuk sinkronkan sekarang."
        >
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden md:inline font-semibold">
            {isSyncing ? 'Menyinkronkan...' : 'DB Tersimpan & Sinkron'}
          </span>
          <RefreshCw className={`h-3 w-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Action Button: Buat Paket (Only for admin / super_admin) */}
        {store.canEdit() && (
          <button
            onClick={onCreatePackageClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 shadow-2xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Paket Baru</span>
          </button>
        )}

        {/* Ganti Kata Sandi Button */}
        {onOpenChangePasswordModal && (
          <button
            onClick={onOpenChangePasswordModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors"
            title="Ganti kata sandi akun Anda"
          >
            <KeyRound className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ganti Sandi</span>
          </button>
        )}

        {/* Logout Quick Button */}
        <button
          onClick={() => {
            if (onLogout) onLogout();
            else store.logout();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
          title="Keluar dari sesi akun"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
