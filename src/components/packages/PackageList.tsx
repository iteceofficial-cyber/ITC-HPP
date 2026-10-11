import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  FileSpreadsheet,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp } from '../../lib/hppEngine';
import { STATUS_LABELS } from '../../lib/constants';
import { exportPackageToExcel } from '../../lib/exportUtils';
import { store } from '../../lib/store';
import { ConfirmModal } from '../common/ConfirmModal';

interface PackageListProps {
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
  onEditPackage: (pkg: TourPackage) => void;
  onCreateNew: () => void;
  onOpenSimulation: (pkg: TourPackage) => void;
}

export const PackageList: React.FC<PackageListProps> = ({
  packages,
  onSelectPackage,
  onEditPackage,
  onCreateNew,
  onOpenSimulation,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTripType, setFilterTripType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const [packageToDelete, setPackageToDelete] = useState<TourPackage | null>(null);

  const canEdit = store.canEdit();
  const isSuperAdmin = store.isSuperAdmin();

  // Unique destinations
  const uniqueDestinations = useMemo(() => {
    return Array.from(new Set(packages.map((p) => p.destination))).filter(Boolean);
  }, [packages]);

  // Filtered packages
  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (filterTripType !== 'all' && p.trip_type !== filterTripType) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterDestination !== 'all' && p.destination !== filterDestination) return false;
      if (searchTerm) {
        const match =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.package_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.person_in_charge.toLowerCase().includes(searchTerm.toLowerCase());
        if (!match) return false;
      }
      return true;
    });
  }, [packages, filterTripType, filterStatus, filterDestination, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedPackages = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [listMessage, setListMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleDuplicate = (pkg: TourPackage) => {
    const res = store.duplicatePackage(pkg.id);
    if (res.success && res.newPackage) {
      setListMessage({ text: `Paket "${pkg.name}" berhasil disalin (${res.newPackage.package_code}) dan tersimpan di database!` });
      setTimeout(() => setListMessage(null), 3500);
    } else {
      setListMessage({ text: res.error || 'Gagal menduplikasi paket.', isError: true });
      setTimeout(() => setListMessage(null), 3500);
    }
  };

  const handleConfirmDelete = () => {
    if (!packageToDelete) return;
    const res = store.deletePackage(packageToDelete.id);
    if (res.success) {
      setListMessage({ text: `Paket "${packageToDelete.name}" berhasil dihapus dari database.` });
      setTimeout(() => setListMessage(null), 3500);
    } else {
      setListMessage({ text: res.error || 'Gagal menghapus paket.', isError: true });
      setTimeout(() => setListMessage(null), 3500);
    }
    setPackageToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {listMessage && (
        <div
          className={`p-3 rounded-md border text-xs font-semibold flex items-center justify-between ${
            listMessage.isError
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{listMessage.text}</span>
          <button onClick={() => setListMessage(null)} className="text-slate-400 hover:text-slate-700 px-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-blue-700" />
            Manajemen Paket Tour
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar seluruh paket open trip dan private trip dengan rincian biaya HPP dan penetapan harga
          </p>
        </div>

        {canEdit && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Paket Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="lg:col-span-1">
            <label className="block text-slate-500 font-medium mb-1">Cari Paket</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Kode, nama, destinasi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Jenis Trip</label>
            <select
              value={filterTripType}
              onChange={(e) => {
                setFilterTripType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium"
            >
              <option value="all">Semua Jenis Trip</option>
              <option value="open_trip">Open Trip</option>
              <option value="private_trip">Private Trip</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Menunggu Review</option>
              <option value="approved">Disetujui</option>
              <option value="final">Final (Terkunci)</option>
              <option value="archived">Arsip</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Destinasi</label>
            <select
              value={filterDestination}
              onChange={(e) => {
                setFilterDestination(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium"
            >
              <option value="all">Semua Destinasi</option>
              {uniqueDestinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Kode & Nama Paket</th>
                <th className="py-3 px-3">Jenis Trip</th>
                <th className="py-3 px-3">Keberangkatan</th>
                <th className="py-3 px-3 text-center">Pax</th>
                <th className="py-3 px-4 text-right">Total HPP</th>
                <th className="py-3 px-4 text-right">HPP / Pax</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">PIC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedPackages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ditemukan paket tour yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedPackages.map((pkg) => {
                  const res = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
                    participantCount: pkg.target_participants,
                    crewCount: pkg.crew_count,
                    durationDays: pkg.duration_days,
                    durationNights: pkg.duration_nights,
                  });

                  const statusConfig = STATUS_LABELS[pkg.status] || {
                    label: pkg.status,
                    color: 'text-slate-600 bg-slate-100',
                  };

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectPackage(pkg)}
                          className="font-bold text-slate-900 cursor-pointer hover:text-blue-700"
                        >
                          {pkg.name}
                        </div>
                        <div className="font-mono text-[11px] text-blue-700">
                          {pkg.package_code} · {pkg.destination}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {pkg.departure_date}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {pkg.target_participants} pax
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                        Rp{Math.round(res.totalHpp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800 whitespace-nowrap">
                        Rp{Math.round(res.hppPerParticipant).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp{Math.round(res.netSellingPricePerPax).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {pkg.person_in_charge}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectPackage(pkg)}
                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100"
                            title="Lihat Detail HPP"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenSimulation(pkg)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                            title="Simulasi Peserta"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportPackageToExcel(pkg)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                            title="Ekspor Excel"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleDuplicate(pkg)}
                                className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100"
                                title="Duplikasi Paket"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onEditPackage(pkg)}
                                className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100"
                                title="Edit Paket"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              {(isSuperAdmin || pkg.status !== 'final') && (
                                <button
                                  onClick={() => setPackageToDelete(pkg)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                                  title="Hapus Paket"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
            <span>
              Menampilkan {paginatedPackages.length} dari {filtered.length} paket
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {packageToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Hapus Paket Tour?"
          message={`Apakah Anda yakin ingin menghapus paket "${packageToDelete.name}" (${packageToDelete.package_code})? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus Sekarang"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onClose={() => setPackageToDelete(null)}
        />
      )}
    </div>
  );
};
