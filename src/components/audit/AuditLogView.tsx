import React, { useState } from 'react';
import { History, Filter, Search, ShieldCheck } from 'lucide-react';
import { store } from '../../lib/store';

export const AuditLogView: React.FC = () => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const logs = store.getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchTerm) {
      const matchSearch =
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.package_code && log.package_code.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-blue-700" />
          Audit Log & Rekam Jejak Aktivitas
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pencatatan transparan seluruh mutasi data paket, perubahan rincian biaya, persetujuan, dan hak akses
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari user, kode paket, atau kata kunci..."
              className="w-full bg-slate-50 border border-slate-200 rounded py-1.5 pl-8 pr-3 text-xs"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded py-1.5 px-3 text-xs font-medium"
          >
            <option value="all">Semua Tipe Aksi</option>
            <option value="CREATE_PACKAGE">Pembuatan Paket</option>
            <option value="UPDATE_PACKAGE">Pembaruan Paket</option>
            <option value="APPROVE_PACKAGE">Persetujuan Paket</option>
            <option value="SUBMIT_APPROVAL">Pengajuan Persetujuan</option>
            <option value="FINALIZE_PACKAGE">Finalisasi Paket</option>
            <option value="DUPLICATE_PACKAGE">Duplikasi Paket</option>
            <option value="DELETE_PACKAGE">Penghapusan Paket</option>
            <option value="CHANGE_USER_ROLE">Perubahan Role User</option>
          </select>
        </div>

        <span className="text-slate-400 font-medium">
          Menampilkan {filteredLogs.length} entri riwayat
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <th className="py-2.5 px-4">Waktu (WIB)</th>
              <th className="py-2.5 px-4">Pengguna</th>
              <th className="py-2.5 px-3">Aksi</th>
              <th className="py-2.5 px-4">Keterangan / Aktivitas</th>
              <th className="py-2.5 px-3">Kode Paket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Tidak ada audit log yang sesuai.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.user_name}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800">{log.description}</td>
                  <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold whitespace-nowrap">
                    {log.package_code || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
