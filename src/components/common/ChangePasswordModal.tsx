import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { store } from '../../lib/store';
import { UserProfile } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserProfile; // Jika tidak diisi, ganti password user yang sedang login
  isSuperAdminReset?: boolean; // Jika Super Admin me-reset password tanpa perlu password lama
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  isSuperAdminReset = false,
  onSuccess,
}) => {
  const currentUser = store.getCurrentUser();
  const user = targetUser || currentUser;

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Evaluasi kekuatan kata sandi
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: 'Belum diisi', color: 'bg-slate-200' };
    if (pwd.length < 6) return { level: 1, label: 'Terlalu Pendek (< 6)', color: 'bg-red-500' };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLetters && hasNumbers && hasSpecial && pwd.length >= 8) {
      return { level: 4, label: 'Sangat Kuat', color: 'bg-emerald-600' };
    }
    if ((hasLetters && hasNumbers) || pwd.length >= 8) {
      return { level: 3, label: 'Kuat', color: 'bg-blue-600' };
    }
    return { level: 2, label: 'Cukup', color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSuperAdminReset && !currentPassword) {
      setErrorMessage('Kata sandi saat ini wajib diisi.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok. Mohon periksa kembali.');
      return;
    }

    if (!isSuperAdminReset && currentPassword === newPassword) {
      setErrorMessage('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isSuperAdminReset) {
        res = await store.resetUserPasswordByAdmin(user.id, newPassword);
      } else {
        res = await store.changePassword(user.id, currentPassword, newPassword);
      }

      setLoading(false);

      if (res.success) {
        setSuccessMessage(
          isSuperAdminReset
            ? `Kata sandi untuk ${user.full_name} berhasil di-reset!`
            : 'Kata sandi Anda berhasil diperbarui dan tersimpan permanen!'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) onSuccess();

        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Gagal memperbarui kata sandi.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-lg text-blue-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isSuperAdminReset ? 'Reset Kata Sandi Staf' : 'Ganti Kata Sandi Akun'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSuperAdminReset
                  ? `Atur kata sandi baru untuk ${user.full_name}`
                  : 'Perbarui kata sandi akun Anda untuk keamanan sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* User Profile Card Header */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  user.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                }
                alt={user.full_name}
                className="h-9 w-9 rounded-full object-cover border border-slate-300"
              />
              <div>
                <div className="font-bold text-slate-900 text-xs">{user.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                user.role === 'super_admin'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : user.role === 'admin'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Viewer'}
            </span>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Field: Kata Sandi Saat Ini (Hanya jika bukan Super Admin Reset) */}
            {!isSuperAdminReset && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Kata Sandi Saat Ini (Lama) *</label>
                  <button
                    type="button"
                    onClick={() => setCurrentPassword('password123')}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                    title="Isi dengan password default akun demo"
                  >
                    Gunakan default (password123)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini..."
                    className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-10 text-xs focus:border-blue-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Field: Kata Sandi Baru */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi Baru * <span className="text-slate-400 font-normal">(min. 6 karakter)</span>
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik kata sandi baru..."
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-10 text-xs focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kekuatan Sandi:</span>
                    <span className="font-semibold text-slate-700">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.level >= 1 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '25%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.level >= 2 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '25%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.level >= 3 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '25%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.level >= 4 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '25%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Field: Konfirmasi Kata Sandi Baru */}
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
                  placeholder="Ulangi kata sandi baru..."
                  className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-10 text-xs focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Kata sandi cocok
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Belum cocok dengan kata sandi baru
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Information Tips */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tips Keamanan:</strong> Gunakan minimal 6 karakter. Kata sandi baru akan
                otomatis disimpan di database server dan berlaku saat login selanjutnya.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(successMessage)}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
