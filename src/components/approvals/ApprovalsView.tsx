import React, { useState } from 'react';
import { CheckSquare, Clock, CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp } from '../../lib/hppEngine';
import { store } from '../../lib/store';

interface ApprovalsViewProps {
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
  onRefresh: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  packages,
  onSelectPackage,
  onRefresh,
}) => {
  const isSuperAdmin = store.isSuperAdmin();
  const [selectedPkgForAction, setSelectedPkgForAction] = useState<TourPackage | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [comments, setComments] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const pendingPackages = packages.filter((p) => p.status === 'pending_approval');
  const pastApprovals = packages.filter((p) => p.status === 'approved' || p.status === 'final');

  const handleConfirmReview = () => {
    if (!selectedPkgForAction) return;
    const res = store.reviewApproval(selectedPkgForAction.id, reviewAction, comments);
    if (res.success) {
      setSelectedPkgForAction(null);
      setComments('');
      setReviewError(null);
      onRefresh();
    } else {
      setReviewError(res.error || 'Gagal memproses persetujuan');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-blue-700" />
          Persetujuan & Otorisasi Paket Tour
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tinjau kewajaran HPP, margin target, dan kelayakan operasional sebelum paket disetujui untuk dipasarkan.
        </p>
      </div>

      {/* Pending Approval Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Menunggu Persetujuan ({pendingPackages.length})
          </h2>
        </div>

        {pendingPackages.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 text-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            Tidak ada antrean paket yang menunggu persetujuan saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPackages.map((pkg) => {
              const res = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
                participantCount: pkg.target_participants,
                crewCount: pkg.crew_count,
                durationDays: pkg.duration_days,
                durationNights: pkg.duration_nights,
              });

              return (
                <div
                  key={pkg.id}
                  className="bg-white p-5 rounded-lg border border-amber-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-blue-700 block">
                        {pkg.package_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pkg.destination} · {pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Menunggu Review
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-md text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total HPP:</span>
                      <span className="font-bold text-slate-900">
                        Rp{Math.round(res.totalHpp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">HPP / Pax:</span>
                      <span className="font-bold text-blue-800">
                        Rp{Math.round(res.hppPerParticipant).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Margin Aktual:</span>
                      <span className="font-bold text-emerald-700">
                        {res.actualMarginPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                    <span>
                      Diajukan oleh: <strong>{pkg.person_in_charge}</strong>
                    </span>
                    <button
                      onClick={() => onSelectPackage(pkg)}
                      className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Buka Rincian
                    </button>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedPkgForAction(pkg);
                          setReviewAction('approved');
                        }}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
                      >
                        Setujui Paket
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPkgForAction(pkg);
                          setReviewAction('rejected');
                        }}
                        className="py-1.5 px-3 border border-red-300 text-red-700 hover:bg-red-50 rounded text-xs font-semibold"
                      >
                        Tolak / Revisi
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPkgForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {reviewAction === 'approved' ? 'Persetujuan Paket Tour' : 'Tolak & Kembalikan ke Draft'}
            </h3>
            <p className="text-xs text-slate-600">
              Paket: <strong>{selectedPkgForAction.name}</strong> ({selectedPkgForAction.package_code})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Instruksi Tambahan (Opsional):
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Misal: Sudah disetujui, harap koordinasi dengan vendor bus..."
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPkgForAction(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-4 py-1.5 rounded text-xs font-semibold text-white ${
                  reviewAction === 'approved'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Konfirmasi {reviewAction === 'approved' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
