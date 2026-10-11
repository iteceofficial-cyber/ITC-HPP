import React, { useState } from 'react';
import { Users, UserPlus, Shield, Check, X, ShieldAlert, UserCheck } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { store } from '../../lib/store';

export const AdminManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(store.getUsers());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [userMsg, setUserMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const isSuperAdmin = store.isSuperAdmin();

  const handleRoleChange = (userId: string, role: UserRole) => {
    const res = store.updateUserRole(userId, role);
    if (res.success) {
      setUsers(store.getUsers());
      setUserMsg({ text: 'Peran pengguna berhasil diperbarui dan tersimpan!' });
      setTimeout(() => setUserMsg(null), 3000);
    } else {
      setUserMsg({ text: res.error || 'Gagal mengubah role', isError: true });
    }
  };

  const handleToggleStatus = (userId: string) => {
    const res = store.toggleUserStatus(userId);
    if (res.success) {
      setUsers(store.getUsers());
      setUserMsg({ text: 'Status akun pengguna berhasil diubah!' });
      setTimeout(() => setUserMsg(null), 3000);
    } else {
      setUserMsg({ text: res.error || 'Gagal mengubah status', isError: true });
    }
  };

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) {
      setUserMsg({ text: 'Nama dan email wajib diisi.', isError: true });
      return;
    }
    const res = store.addUser(newName, newEmail, newRole);
    if (res.success) {
      setUsers(store.getUsers());
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setUserMsg({ text: 'Pengguna baru berhasil ditambahkan dan tersimpan ke database!' });
      setTimeout(() => setUserMsg(null), 3500);
    } else {
      setUserMsg({ text: res.error || 'Gagal menambah pengguna', isError: true });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500 max-w-xl mx-auto my-12">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 mt-1">
          Hanya Super Admin yang memiliki hak akses untuk mengelola akun dan peran pengguna.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-700" />
            Manajemen Tim & Hak Akses Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola role staf operasional (Super Admin, Admin Tour Planner, Viewer Manajemen)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Staf Baru</span>
        </button>
      </div>

      {userMsg && (
        <div
          className={`p-3 rounded-md border text-xs font-semibold flex items-center justify-between ${
            userMsg.isError
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{userMsg.text}</span>
          <button onClick={() => setUserMsg(null)} className="text-slate-400 hover:text-slate-700 px-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <th className="py-3 px-4">Nama Pengguna</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role Akses</th>
              <th className="py-3 px-4 text-center">Status Akun</th>
              <th className="py-3 px-4 text-center">Aksi Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{u.full_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                <td className="py-3 px-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin (Planner)</option>
                    <option value="viewer">Viewer (Manajemen)</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(u.id)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      u.is_active
                        ? 'text-red-700 hover:bg-red-50 border border-red-200'
                        : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna Baru</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Posisi *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Rian Pratama (Operasional)"
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Login *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="rian@tourcost.id"
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Peran *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-semibold"
              >
                <option value="admin">Admin (Membuat & Menghitung Paket)</option>
                <option value="super_admin">Super Admin (Akses Penuh & Approval)</option>
                <option value="viewer">Viewer (Read-Only / Manajemen)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold"
              >
                Simpan Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
