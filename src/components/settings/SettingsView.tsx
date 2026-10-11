import React, { useState } from 'react';
import {
  Settings,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Terminal,
  ShieldCheck,
  HardDrive,
  Image,
  Globe,
  Building,
  Sparkles,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured } from '../../lib/supabase';
import { store } from '../../lib/store';
import { AppBranding } from '../../types';

export const SettingsView: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const [branding, setBranding] = useState<AppBranding>(store.getBranding());
  const [savingBranding, setSavingBranding] = useState<boolean>(false);

  // State Ganti Kata Sandi
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('tourcost_supabase_url') || '' : ''
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('tourcost_supabase_key') || '' : ''
  );
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Simpan perubahan Kata Sandi Akun
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ text: 'Kata sandi saat ini wajib diisi.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Kata sandi baru minimal harus 6 karakter.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi kata sandi baru tidak cocok. Mohon periksa kembali.', isError: true });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ text: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.', isError: true });
      return;
    }

    setSavingPassword(true);
    const res = await store.changePassword(currentUser.id, currentPassword, newPassword);
    setSavingPassword(false);

    if (res.success) {
      setPasswordMsg({ text: 'Kata sandi Anda berhasil diperbarui dan tersimpan permanen!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } else {
      setPasswordMsg({ text: res.error || 'Gagal mengubah kata sandi.', isError: true });
    }
  };

  // Simpan perubahan Branding (Nama Website & Logo)
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    await store.updateBranding(branding);
    setSavingBranding(false);
    setNoticeMessage('Identitas aplikasi & logo tampilan awal berhasil disimpan ke database server!');
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Upload Logo Kustom dari File Lokal
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNoticeMessage('Ukuran file logo maksimal 2MB.');
      setTimeout(() => setNoticeMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBranding((prev) => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleTestAndSaveSupabase = async () => {
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setTestResult(res);
    setTesting(false);

    if (res.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tourcost_supabase_url', supabaseUrl.trim());
        localStorage.setItem('tourcost_supabase_key', supabaseKey.trim());
      }
      setNoticeMessage('Kredensial Supabase berhasil disimpan!');
      setTimeout(() => setNoticeMessage(null), 3500);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/export-db';
    setNoticeMessage('File backup database (JSON) sedang diunduh.');
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/import-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        if (res.ok) {
          setNoticeMessage('Database berhasil dipulihkan dari file backup!');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setNoticeMessage('Gagal memulihkan database. Format file tidak sesuai.');
        }
      } catch (err) {
        setNoticeMessage('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    await store.resetToDemo();
    setNoticeMessage('Data berhasil di-reset ke paket demo awal!');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-700" />
          Pengaturan Aplikasi & Identitas Sistem
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Ubah nama website, logo tampilan awal, kop surat laporan, dan konfigurasi database terpusat
        </p>
      </div>

      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* 1. EDIT NAMA WEBSITE & LOGO TAMPILAN AWAL */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nama Website & Logo Tampilan Awal
              </h2>
              <p className="text-xs text-slate-500">
                Kustomisasi nama aplikasi, slogan, logo tampilan awal, dan identitas biro travel
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBranding} className="space-y-5 text-xs">
          {/* Preview Box Live */}
          <div className="p-4 bg-slate-900 rounded-lg text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.appName}
                  className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1 border border-white/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md border border-blue-400/30">
                  {branding.logoText || 'TC'}
                </div>
              )}
              <div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>{branding.appName || 'TourCost'}</span>
                  <span className="text-[9px] font-semibold text-blue-300 bg-blue-950 px-1 py-0.2 rounded border border-blue-800">
                    PRO
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {branding.tagline || 'HPP & Costing Travel Agent'}
                </div>
                <div className="text-[10px] text-blue-400 mt-0.5">
                  {branding.companyName || 'PT TOURCOST NUSANTARA TRAVEL'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center sm:text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-slate-200">
                Pratinjau Tampilan Header & Login
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Website / Aplikasi *
              </label>
              <input
                type="text"
                required
                value={branding.appName}
                onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                placeholder="Contoh: TourCost, IndoTravel Costing, dsb."
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tagline / Slogan Aplikasi
              </label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                placeholder="Contoh: Sistem Manajemen HPP & Costing Travel Agent"
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inisial Monogram Logo (Jika Tanpa Gambar)
              </label>
              <input
                type="text"
                maxLength={4}
                value={branding.logoText || ''}
                onChange={(e) => setBranding({ ...branding, logoText: e.target.value.toUpperCase() })}
                placeholder="TC"
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Travel (Kop Surat & Quotation)
              </label>
              <input
                type="text"
                value={branding.companyName}
                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                placeholder="PT TOURCOST NUSANTARA TRAVEL"
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Kantor Travel (Untuk Kop Surat Laporan)
              </label>
              <input
                type="text"
                value={branding.companyAddress}
                onChange={(e) => setBranding({ ...branding, companyAddress: e.target.value })}
                placeholder="Jl. Pariwisata Raya No. 88, Jakarta Selatan"
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Kontak & Telepon / Email (Untuk Dokumen Penawaran)
              </label>
              <input
                type="text"
                value={branding.companyContact}
                onChange={(e) => setBranding({ ...branding, companyContact: e.target.value })}
                placeholder="Telp: (021) 7890-1234 · Email: ops@tourcost.id"
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pengaturan Logo Gambar */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-600" />
              <span>Kustomisasi Gambar Logo Tampilan Awal</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {branding.logoUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 object-contain rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
                  />
                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block">Logo Kustom Terpasang</span>
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, logoUrl: '' })}
                      className="text-red-600 hover:text-red-800 text-[11px] font-semibold mt-1 inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus Logo Gambar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[11px]">
                  Saat ini menggunakan ikon monogram teks bawaan (<strong>{branding.logoText || 'TC'}</strong>).
                </div>
              )}

              <div className="sm:ml-auto flex items-center gap-2">
                <label className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Unggah Gambar Logo (PNG/JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Input URL Gambar opsional */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Atau Masukkan URL Gambar Logo Online:
              </label>
              <input
                type="url"
                value={branding.logoUrl || ''}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://example.com/logo-travel.png"
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingBranding}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{savingBranding ? 'Menyimpan...' : 'Simpan Nama Web & Logo'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. KEAMANAN AKUN & GANTI KATA SANDI */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Keamanan Akun & Ganti Kata Sandi
              </h2>
              <p className="text-xs text-slate-500">
                Perbarui kata sandi login untuk akun Anda ({currentUser.full_name})
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded border border-blue-200 uppercase">
            {currentUser.role === 'super_admin'
              ? 'Super Admin'
              : currentUser.role === 'admin'
              ? 'Admin'
              : 'Viewer'}
          </span>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-md border text-xs font-semibold flex items-center gap-2 ${
              passwordMsg.isError
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {passwordMsg.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          {/* User Info Bar */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentUser.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                }
                alt={currentUser.full_name}
                className="h-8 w-8 rounded-full object-cover border border-slate-300"
              />
              <div>
                <div className="font-bold text-slate-900">{currentUser.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Kata sandi default akun: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-700">password123</code>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Kata Sandi Saat Ini *</label>
                <button
                  type="button"
                  onClick={() => setCurrentPassword('password123')}
                  className="text-[10px] text-blue-600 hover:text-blue-800"
                >
                  Default
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Kata sandi saat ini"
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-9 text-xs focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi Baru * <span className="text-slate-400 font-normal">(min. 6)</span>
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik kata sandi baru"
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-9 text-xs focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Konfirmasi Kata Sandi Baru *
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-9 text-xs focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Kata sandi baru akan langsung tersimpan di database server & digunakan saat login.
            </span>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{savingPassword ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Database Persisten di Server Info Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Penyimpanan Database Server Persisten (Anti-Hilang)
              </h2>
              <p className="text-xs text-slate-500">
                Status: <strong className="text-emerald-700">Aktif & Tersimpan Otomatis di Server</strong>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
            Online & Persisten
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs text-emerald-950 space-y-1.5 leading-relaxed">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Jaminan Data Tidak Hilang Saat Pindah Link:
          </div>
          <p>
            Setiap kali Anda menekan <strong>Simpan Paket</strong>, <strong>Duplikasi</strong>, atau <strong>Ubah Status</strong>, seluruh perubahan langsung ditulis ke file database di server backend (<code>data/database.json</code>).
          </p>
          <p className="text-slate-600">
            Saat Anda berpindah link, merefresh halaman, atau membuka dari perangkat lain, sistem akan otomatis membaca data database terpusat yang sama.
          </p>
        </div>

        {/* Action: Export & Import Database Backup */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Backup Database (.json)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>Pulihkan dari File Backup (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 3. Supabase Connection Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Koneksi Tambahan: Supabase PostgreSQL & Auth
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan ke database cloud eksternal Supabase jika ingin sinkronisasi multi-region
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon Public Key (Safe for Frontend)
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-xs font-mono focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestAndSaveSupabase}
              disabled={testing}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji Koneksi...' : 'Uji & Simpan Koneksi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Reset Data Card */}
      <div className="bg-white p-6 rounded-lg border border-red-200 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-red-900">Reset Data Demo Awal</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Muat ulang data demo paket Bromo, Bali, Labuan Bajo, dan branding awal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDemo}
          className="px-3.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-xs font-semibold"
        >
          Reset ke Demo
        </button>
      </div>
    </div>
  );
};
