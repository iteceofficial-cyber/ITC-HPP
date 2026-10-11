import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Copy,
  Trash2,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  TrendingUp,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp, generateScenarios, calculateItemSubtotal } from '../../lib/hppEngine';
import { DEFAULT_COST_CATEGORIES, STATUS_LABELS, CALCULATION_BASIS_LABELS } from '../../lib/constants';
import { exportPackageToExcel } from '../../lib/exportUtils';
import { store } from '../../lib/store';
import { ConfirmModal } from '../common/ConfirmModal';
import { PrintReportModal } from '../reports/PrintReportModal';

interface PackageDetailProps {
  pkg: TourPackage;
  onBack: () => void;
  onEdit: (pkg: TourPackage) => void;
  onPackageUpdated: (pkg: TourPackage) => void;
}

export const PackageDetail: React.FC<PackageDetailProps> = ({
  pkg,
  onBack,
  onEdit,
  onPackageUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'costs' | 'simulation' | 'reports' | 'history'
  >('overview');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printReportType, setPrintReportType] = useState<'internal' | 'quotation'>('internal');

  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const currentUser = store.getCurrentUser();
  const canEdit = store.canEdit();
  const isSuperAdmin = store.isSuperAdmin();

  // Kalkulasi HPP terpusat
  const hppResult = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
    participantCount: pkg.target_participants,
    crewCount: pkg.crew_count,
    durationDays: pkg.duration_days,
    durationNights: pkg.duration_nights,
  });

  // Simulasi Tiers
  const scenarioTiers = [5, 10, 15, 20, 25, 30];
  const scenarios = generateScenarios(
    pkg.id,
    pkg.cost_items,
    pkg.pricing_settings,
    scenarioTiers,
    pkg.crew_count,
    pkg.minimum_participants,
    pkg.duration_days,
    pkg.duration_nights,
    pkg.trip_type === 'private_trip'
  );

  const statusConfig = STATUS_LABELS[pkg.status] || {
    label: pkg.status,
    color: 'text-slate-600 bg-slate-100',
  };

  const handleDuplicate = () => {
    const res = store.duplicatePackage(pkg.id);
    if (res.success && res.newPackage) {
      setFeedback({ text: `Paket berhasil disalin dengan kode ${res.newPackage.package_code} dan tersimpan di database!` });
      onPackageUpdated(res.newPackage);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: res.error || 'Gagal menduplikasi paket.', isError: true });
    }
  };

  const handleDelete = () => {
    const res = store.deletePackage(pkg.id);
    if (res.success) {
      onBack();
    } else {
      setFeedback({ text: res.error || 'Gagal menghapus paket.', isError: true });
    }
  };

  const handleSubmitApproval = () => {
    const res = store.submitForApproval(pkg.id, 'Diajukan untuk review operasional dan harga');
    if (res.success) {
      const updated = store.getPackageById(pkg.id);
      if (updated) onPackageUpdated(updated);
      setFeedback({ text: 'Paket berhasil diajukan untuk persetujuan Super Admin!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ text: res.error || 'Gagal mengajukan persetujuan.', isError: true });
    }
  };

  const handleReviewApproval = () => {
    const res = store.reviewApproval(pkg.id, approvalAction, approvalComment);
    if (res.success) {
      const updated = store.getPackageById(pkg.id);
      if (updated) onPackageUpdated(updated);
      setShowApprovalModal(false);
      setFeedback({ text: `Paket berhasil ${approvalAction === 'approved' ? 'disetujui' : 'ditolak'} dan tersimpan di database!` });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ text: res.error || 'Gagal memperbarui status review.', isError: true });
    }
  };

  const handleFinalize = () => {
    const res = store.setPackageStatus(pkg.id, 'final');
    if (res.success) {
      const updated = store.getPackageById(pkg.id);
      if (updated) onPackageUpdated(updated);
      setFeedback({ text: 'Paket berhasil dikunci sebagai status Final untuk operasional.' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ text: res.error || 'Gagal mengunci paket.', isError: true });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs font-semibold flex items-center justify-between ${
            feedback.isError
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Paket
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pkg.name}</h1>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-mono text-blue-700 font-semibold">{pkg.package_code}</span>
              <span aria-hidden="true">·</span>
              <span>{pkg.destination}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {pkg.duration_days} Hari {pkg.duration_nights} Malam
              </span>
              <span aria-hidden="true">·</span>
              <span>PIC: {pkg.person_in_charge}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                setPrintReportType('internal');
                setShowPrintModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak / PDF
            </button>

            <button
              onClick={() => exportPackageToExcel(pkg)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Ekspor Excel
            </button>

            {canEdit && (
              <>
                <button
                  onClick={handleDuplicate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplikasi
                </button>

                {pkg.status !== 'final' ? (
                  <button
                    onClick={() => onEdit(pkg)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-2xs transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Paket
                  </button>
                ) : (
                  isSuperAdmin && (
                    <button
                      onClick={() => onEdit(pkg)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Revisi Paket (Super Admin)
                    </button>
                  )
                )}

                {(isSuperAdmin || pkg.status !== 'final') && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Hapus Paket"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Approval Banner if Pending */}
        {pkg.status === 'pending_approval' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Paket ini sedang menunggu persetujuan Super Admin sebelum dipasarkan.</span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setApprovalAction('approved');
                    setShowApprovalModal(true);
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs"
                >
                  Setujui Paket
                </button>
                <button
                  onClick={() => {
                    setApprovalAction('rejected');
                    setShowApprovalModal(true);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs"
                >
                  Tolak / Revisi
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action to Submit or Finalize */}
        {pkg.status === 'draft' && canEdit && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600">
              Paket masih berstatus <strong>Draft</strong>. Ajukan ke Super Admin untuk ditinjau.
            </span>
            <button
              onClick={handleSubmitApproval}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold"
            >
              <Send className="h-3 w-3" /> Ajukan Persetujuan
            </button>
          </div>
        )}

        {pkg.status === 'approved' && isSuperAdmin && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between gap-3 text-xs">
            <span className="text-emerald-800">
              Paket telah disetujui! Anda dapat mengunci statusnya menjadi <strong>Final</strong> untuk operasional tour.
            </span>
            <button
              onClick={handleFinalize}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
            >
              <Lock className="h-3.5 w-3.5" /> Kunci Sebagai Final
            </button>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Ringkasan HPP & Margin' },
            { id: 'costs', label: `Rincian Biaya (${pkg.cost_items.length} Item)` },
            { id: 'simulation', label: 'Simulasi Peserta' },
            { id: 'reports', label: 'Dokumen & Penawaran' },
            { id: 'history', label: 'Riwayat Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Total HPP Paket ({pkg.target_participants} Pax)
              </span>
              <div className="text-xl font-bold text-slate-900">
                Rp{Math.round(hppResult.totalHpp).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Biaya dasar + cadangan {pkg.pricing_settings.contingency_percentage}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                HPP per Peserta Pembayar
              </span>
              <div className="text-xl font-bold text-blue-800">
                Rp{Math.round(hppResult.hppPerParticipant).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dibagi {pkg.target_participants} peserta (Kru {pkg.crew_count})
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Harga Jual Bersih / Pax
              </span>
              <div className="text-xl font-bold text-slate-900">
                Rp{Math.round(hppResult.netSellingPricePerPax).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Metode {pkg.pricing_settings.pricing_method} ({pkg.pricing_settings.target_percentage}%)
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-xs font-semibold text-emerald-800 block mb-1">
                Estimasi Laba Bersih
              </span>
              <div className="text-xl font-bold text-emerald-700">
                Rp{Math.round(hppResult.estimatedProfit).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">
                Margin aktual: {hppResult.actualMarginPercentage.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Breakdown per Kategori */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Distribusi Biaya Berdasarkan Kategori
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {hppResult.costBreakdownByCategory.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat.categoryName}</span>
                      <span className="font-bold text-slate-900">
                        Rp{Math.round(cat.totalAmount).toLocaleString('id-ID')}{' '}
                        <span className="text-slate-400 font-normal">
                          ({cat.percentageOfTotal.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, cat.percentageOfTotal))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Ringkasan Komponen */}
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-xs space-y-2.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                  Komponen Rekapitulasi Operasional
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Tetap (Paket / Flat)</span>
                  <span className="font-semibold text-slate-900">
                    Rp{Math.round(hppResult.fixedCostTotal).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Variabel Peserta</span>
                  <span className="font-semibold text-slate-900">
                    Rp{Math.round(hppResult.variableParticipantCostTotal).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Variabel Kru</span>
                  <span className="font-semibold text-slate-900">
                    Rp{Math.round(hppResult.variableCrewCostTotal).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Kapasitas (Kendaraan & Kamar)</span>
                  <span className="font-semibold text-slate-900">
                    Rp{Math.round(hppResult.capacityCostTotal).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cadangan Tak Terduga ({pkg.pricing_settings.contingency_percentage}%)</span>
                  <span className="font-semibold text-slate-900">
                    Rp{Math.round(hppResult.contingencyCost).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Total HPP Keseluruhan</span>
                  <span>Rp{Math.round(hppResult.totalHpp).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RINCIAN BIAYA */}
      {activeSubTab === 'costs' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Seluruh Rincian Item Biaya</h2>
              <p className="text-xs text-slate-500">
                Dihitung berdasarkan target {pkg.target_participants} peserta dan {pkg.crew_count} kru.
              </p>
            </div>
            {canEdit && pkg.status !== 'final' && (
              <button
                onClick={() => onEdit(pkg)}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                + Ubah / Tambah Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Nama Item</th>
                  <th className="py-2.5 px-2 text-center">Kuantitas</th>
                  <th className="py-2.5 px-2">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-2 text-center">Freq</th>
                  <th className="py-2.5 px-3">Dasar Kalkulasi</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3">Catatan / Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pkg.cost_items.map((item) => {
                  const cat = DEFAULT_COST_CATEGORIES.find((c) => c.id === item.category_id);
                  const { subtotal } = calculateItemSubtotal(
                    item,
                    pkg.target_participants,
                    pkg.crew_count,
                    pkg.duration_days,
                    pkg.duration_nights
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {cat?.name || item.category_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="py-2.5 px-2 text-center">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-slate-500">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        Rp{item.unit_price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2 text-center">{item.frequency}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {CALCULATION_BASIS_LABELS[item.calculation_basis] || item.calculation_basis}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp{Math.round(subtotal).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULASI PESERTA */}
      {activeSubTab === 'simulation' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Tabel Simulasi Skenario Jumlah Peserta
            </h2>
            <p className="text-xs text-slate-500">
              Biaya tetap dipertahankan, biaya variabel disesuaikan otomatis, serta kapasitas armada/kamar terhitung dinamis.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Jumlah Peserta</th>
                  <th className="py-2.5 px-3 text-right">Biaya Tetap</th>
                  <th className="py-2.5 px-3 text-right">Biaya Variabel</th>
                  <th className="py-2.5 px-3 text-right">Cadangan</th>
                  <th className="py-2.5 px-3 text-right">Total HPP</th>
                  <th className="py-2.5 px-3 text-right">HPP / Pax</th>
                  <th className="py-2.5 px-3 text-right">Harga Jual / Pax</th>
                  {pkg.trip_type === 'private_trip' && (
                    <th className="py-2.5 px-3 text-right">Harga Rombongan</th>
                  )}
                  <th className="py-2.5 px-3 text-right">Pendapatan</th>
                  <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                  <th className="py-2.5 px-3 text-center">Margin</th>
                  <th className="py-2.5 px-3 text-center">Status Kelayakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scenarios.map((scen) => {
                  let badge = (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Memenuhi Target
                    </span>
                  );
                  if (scen.is_loss) {
                    badge = (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                        Rugi / Defisit
                      </span>
                    );
                  } else if (scen.is_below_minimum) {
                    badge = (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Di Bawah Min Pax ({pkg.minimum_participants})
                      </span>
                    );
                  } else if (!scen.is_target_met) {
                    badge = (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Di Bawah Margin Target
                      </span>
                    );
                  }

                  const isTargetPax = scen.participant_count === pkg.target_participants;

                  return (
                    <tr
                      key={scen.id}
                      className={`hover:bg-slate-50/50 ${
                        isTargetPax ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900">{scen.participant_count} Orang</span>
                        {isTargetPax && (
                          <span className="ml-1.5 text-[10px] text-blue-700 font-bold">(Target)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        Rp{Math.round(scen.total_fixed_cost).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        Rp{Math.round(scen.total_variable_cost).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        Rp{Math.round(scen.contingency_cost).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900 whitespace-nowrap">
                        Rp{Math.round(scen.total_hpp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-800 whitespace-nowrap">
                        Rp{Math.round(scen.hpp_per_participant).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp{Math.round(scen.selling_price_per_pax).toLocaleString('id-ID')}
                      </td>
                      {pkg.trip_type === 'private_trip' && (
                        <td className="py-2.5 px-3 text-right font-bold text-blue-900 whitespace-nowrap">
                          Rp{Math.round(scen.selling_price_per_group || 0).toLocaleString('id-ID')}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        Rp{Math.round(scen.total_revenue).toLocaleString('id-ID')}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          scen.estimated_profit < 0 ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        Rp{Math.round(scen.estimated_profit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {scen.actual_margin.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">{badge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN & DOKUMEN PENAWARAN */}
      {activeSubTab === 'reports' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Format Dokumen & Laporan Cetak</h2>
            <p className="text-xs text-slate-500">
              Pilih mode cetak sesuai kebutuhan: dokumen internal agen travel atau surat penawaran harga pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                1. Laporan HPP & Costing Internal (Rahasia)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Memuat rincian vendor secara lengkap, honor kru, biaya tak terduga, formula margin/markup, dan simulasi keuntungan. Digunakan untuk manajemen dan staf operasional.
              </p>
              <button
                onClick={() => {
                  setPrintReportType('internal');
                  setShowPrintModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" /> Buka & Cetak Laporan Internal
              </button>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                2. Surat Penawaran Harga Wisatawan (Quotation)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tampilan bersih dan elegan khusus untuk calon klien atau wisatawan. Hanya menampilkan fasilitas, durasi, ketentuan, dan harga penawaran resmi tanpa membocorkan margin travel.
              </p>
              <button
                onClick={() => {
                  setPrintReportType('quotation');
                  setShowPrintModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs"
              >
                <FileText className="h-3.5 w-3.5" /> Buka Surat Penawaran Pelanggan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RIWAYAT AUDIT LOG */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Riwayat Perubahan & Audit Log</h2>
            <p className="text-xs text-slate-500">
              Mencatat seluruh rekam jejak pembuatan, modifikasi biaya, persetujuan, dan perubahan status paket.
            </p>
          </div>

          <div className="space-y-3">
            {store
              .getAuditLogs()
              .filter((log) => log.package_id === pkg.id || log.package_code === pkg.package_code)
              .map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800">{log.user_name}</span>
                    <span className="font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="font-medium text-slate-900">{log.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Aksi: {log.action} · Entity: {log.entity_type}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Hapus Paket Tour?"
        message={`Apakah Anda yakin ingin menghapus paket "${pkg.name}" (${pkg.package_code})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Sekarang"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {approvalAction === 'approved' ? 'Setujui Paket Tour' : 'Tolak / Kembalikan ke Draft'}
            </h3>
            <p className="text-xs text-slate-600">
              {approvalAction === 'approved'
                ? `Paket "${pkg.name}" akan disetujui dan siap untuk operasional atau finalisasi.`
                : `Paket "${pkg.name}" akan dikembalikan ke status Draft untuk diperbaiki oleh PIC.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Komentar Reviewer (Opsional)
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau poin revisi biaya..."
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleReviewApproval}
                className={`px-4 py-1.5 rounded text-xs font-semibold text-white ${
                  approvalAction === 'approved'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Konfirmasi {approvalAction === 'approved' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {showPrintModal && (
        <PrintReportModal
          pkg={pkg}
          reportType={printReportType}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
