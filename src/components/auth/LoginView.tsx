import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Sparkles,
  Edit3,
  Eye,
  EyeOff,
} from 'lucide-react';
import { store } from '../../lib/store';
import { UserProfile, AppBranding } from '../../types';
import { BrandCustomizerModal } from '../common/BrandCustomizerModal';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [branding, setBranding] = useState<AppBranding>(store.getBranding());
  const [users, setUsers] = useState<UserProfile[]>(store.getUsers());

  const [email, setEmail] = useState<string>('superadmin@tourcost.id');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBranding(store.getBranding());
      setUsers(store.getUsers());
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await store.login(email, password);
    setLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      setError(res.error || 'Gagal login ke sistem.');
    }
  };

  const handleQuickLogin = (user: UserProfile) => {
    store.loginAsUser(user);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Tombol Edit Nama & Logo di pojok atas */}
        <button
          onClick={() => setShowBrandModal(true)}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 transition-colors"
          title="Ubah nama website dan logo tampilan awal"
        >
          <Edit3 className="h-3 w-3 text-blue-300" />
          <span>Edit Nama & Logo</span>
        </button>

        {/* Top Header with Branding Logo & App Name */}
        <div className="bg-slate-950 p-6 sm:p-8 text-center border-b border-slate-800 text-white">
          <div className="flex justify-center mb-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.appName}
                className="h-16 w-16 object-contain rounded-xl bg-white/10 p-1.5 border border-white/20 shadow-md"
              />
            ) : (
              <div
                style={{ backgroundColor: branding.themeColor || '#1d4ed8' }}
                className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border border-white/20"
              >
                {branding.logoText || branding.appName?.slice(0, 2).toUpperCase() || 'TC'}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>{branding.appName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {branding.tagline || 'Sistem Manajemen HPP & Costing Travel Agent'}
          </p>
          <div className="mt-2 text-[11px] text-blue-400 font-medium">
            {branding.companyName}
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Login
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@tourcost.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2.5 pl-9 pr-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Kata Sandi</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Default: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2.5 pl-9 pr-10 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Login Account Picker */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Pilihan Akun Cepat (Akses Multi-Role)
            </div>

            <div className="grid grid-cols-1 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        u.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                      }
                      alt={u.full_name}
                      className="h-8 w-8 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{u.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      u.role === 'super_admin'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : u.role === 'admin'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {u.role === 'super_admin'
                      ? 'Super Admin'
                      : u.role === 'admin'
                      ? 'Admin'
                      : 'Viewer'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Database Server Persisten Terhubung</span>
          <button
            onClick={() => setShowBrandModal(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Kustomisasi Brand
          </button>
        </div>
      </div>

      {/* Modal Customizer Nama & Logo */}
      <BrandCustomizerModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        onSaved={(newBranding) => setBranding(newBranding)}
      />
    </div>
  );
};
