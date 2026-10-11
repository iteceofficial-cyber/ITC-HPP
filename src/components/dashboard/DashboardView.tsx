import React, { useState, useMemo } from 'react';
import {
  Compass,
  Clock,
  CheckCircle2,
  Lock,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Filter,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  Copy,
} from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp } from '../../lib/hppEngine';
import { STATUS_LABELS } from '../../lib/constants';
import { exportPackageToExcel } from '../../lib/exportUtils';
import { store } from '../../lib/store';

interface DashboardViewProps {
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
  onOpenCreate: () => void;
  onOpenSimulation: (pkg: TourPackage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  packages,
  onSelectPackage,
  onOpenCreate,
  onOpenSimulation,
}) => {
  const [filterTripType, setFilterTripType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [filterPic, setFilterPic] = useState<string>('all');

  // Destinasi & PIC unik untuk opsi filter dropdown
  const uniqueDestinations = useMemo(() => {
    return Array.from(new Set(packages.map((p) => p.destination))).filter(Boolean);
  }, [packages]);

  const uniquePics = useMemo(() => {
    return Array.from(new Set(packages.map((p) => p.person_in_charge))).filter(Boolean);
  }, [packages]);

  // Filter paket
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (filterTripType !== 'all' && p.trip_type !== filterTripType) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterDestination !== 'all' && p.destination !== filterDestination) return false;
      if (filterPic !== 'all' && p.person_in_charge !== filterPic) return false;
      return true;
    });
  }, [packages, filterTripType, filterStatus, filterDestination, filterPic]);

  // Statistik Agregat yang akurat sesuai filter
  const stats = useMemo(() => {
    let draftCount = 0;
    let pendingCount = 0;
    let finalCount = 0;
    let approvedCount = 0;

    let totalBiayaFiltered = 0;
    let totalHppPerPaxSum = 0;
    let totalEstimatedProfit = 0;
    let validPackagesForAvg = 0;

    filteredPackages.forEach((pkg) => {
      if (pkg.status === 'draft') draftCount++;
      if (pkg.status === 'pending_approval') pendingCount++;
      if (pkg.status === 'final') finalCount++;
      if (pkg.status === 'approved') approvedCount++;

      // Jangan campur arsip ke perhitungan profit tanpa penjelasan
      if (pkg.status !== 'archived') {
        const res = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
          participantCount: pkg.target_participants,
          crewCount: pkg.crew_count,
          durationDays: pkg.duration_days,
          durationNights: pkg.duration_nights,
        });

        totalBiayaFiltered += res.totalHpp;
        totalHppPerPaxSum += res.hppPerParticipant;
        totalEstimatedProfit += res.estimatedProfit;
        validPackagesForAvg++;
      }
    });

    const avgHppPerPax = validPackagesForAvg > 0 ? totalHppPerPaxSum / validPackagesForAvg : 0;

    return {
      total: filteredPackages.length,
      draftCount,
      pendingCount,
      finalCount,
      approvedCount,
      totalBiayaFiltered,
      avgHppPerPax,
      totalEstimatedProfit,
    };
  }, [filteredPackages]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDuplicate = (pkg: TourPackage) => {
    const res = store.duplicatePackage(pkg.id);
    if (res.success && res.newPackage) {
      setToastMessage(`Paket "${pkg.name}" berhasil diduplikasi ke database server (${res.newPackage.package_code})`);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setToastMessage(res.error || 'Gagal menduplikasi paket.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 px-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Ringkasan HPP</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manajemen biaya pokok, harga jual dan estimasi laba paket tour travel agent
          </p>
        </div>
        {store.canEdit() && (
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>+ Buat Paket Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Filter Data Agregat
          </span>
          {(filterTripType !== 'all' || filterStatus !== 'all' || filterDestination !== 'all' || filterPic !== 'all') && (
            <button
              onClick={() => {
                setFilterTripType('all');
                setFilterStatus('all');
                setFilterDestination('all');
                setFilterPic('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Jenis Trip</label>
            <select
              value={filterTripType}
              onChange={(e) => setFilterTripType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Semua Jenis Trip</option>
              <option value="open_trip">Open Trip</option>
              <option value="private_trip">Private Trip</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Status Paket</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Menunggu Persetujuan</option>
              <option value="approved">Disetujui</option>
              <option value="final">Final (Terkunci)</option>
              <option value="archived">Arsip</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Destinasi</label>
            <select
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Semua Destinasi</option>
              {uniqueDestinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">PIC (Penanggung Jawab)</label>
            <select
              value={filterPic}
              onChange={(e) => setFilterPic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Semua PIC</option>
              {uniquePics.map((pic) => (
                <option key={pic} value={pic}>
                  {pic}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Paket */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Paket</span>
            <Compass className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>{stats.draftCount} draft</span>
            <span aria-hidden="true">·</span>
            <span>{stats.approvedCount} disetujui</span>
          </div>
        </div>

        {/* Menunggu Review */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Menunggu Review</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.pendingCount}</div>
          <div className="mt-2 text-xs text-slate-500">Perlu persetujuan Super Admin</div>
        </div>

        {/* Rata-Rata HPP / Peserta */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rata-rata HPP / Pax</span>
            <Users className="h-4 w-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            Rp{Math.round(stats.avgHppPerPax).toLocaleString('id-ID')}
          </div>
          <div className="mt-2 text-xs text-slate-500">Target pax terhitung</div>
        </div>

        {/* Estimasi Keuntungan */}
        <div className="bg-white p-4 rounded-lg border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold">Estimasi Total Laba</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            Rp{Math.round(stats.totalEstimatedProfit).toLocaleString('id-ID')}
          </div>
          <div className="mt-2 text-xs text-emerald-600/90">Dari seluruh paket aktif</div>
        </div>
      </div>

      {/* Tabel Paket Terbaru */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Paket Tour Terbaru</h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredPackages.length} paket hasil filter
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Kode & Nama Paket</th>
                <th className="py-3 px-4">Destinasi</th>
                <th className="py-3 px-3">Jenis Trip</th>
                <th className="py-3 px-3">Keberangkatan</th>
                <th className="py-3 px-3">Peserta</th>
                <th className="py-3 px-4 text-right">Total HPP</th>
                <th className="py-3 px-4 text-right">HPP / Pax</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">PIC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada paket yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
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
                    <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {pkg.name}
                        </div>
                        <div className="font-mono text-[11px] text-blue-700">
                          {pkg.package_code}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">
                        {pkg.destination}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">
                          {pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {pkg.departure_date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {pkg.target_participants} pax
                        <span className="text-[10px] text-slate-400 block font-normal">
                          (min {pkg.minimum_participants})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                        Rp{Math.round(res.totalHpp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-blue-800 whitespace-nowrap">
                        Rp{Math.round(res.hppPerParticipant).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp{Math.round(res.netSellingPricePerPax).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {pkg.person_in_charge}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectPackage(pkg)}
                            title="Buka Detail & Rincian Biaya"
                            className="p-1 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenSimulation(pkg)}
                            title="Simulasi Jumlah Peserta"
                            className="p-1 rounded text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportPackageToExcel(pkg)}
                            title="Unduh Laporan Excel (XLSX)"
                            className="p-1 rounded text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </button>
                          {store.canEdit() && (
                            <button
                              onClick={() => handleDuplicate(pkg)}
                              title="Duplikasi Paket"
                              className="p-1 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
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
      </div>
    </div>
  );
};
