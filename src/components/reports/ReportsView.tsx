import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Eye, TrendingUp, CheckCircle2 } from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp } from '../../lib/hppEngine';
import { exportPackageToExcel } from '../../lib/exportUtils';
import { PrintReportModal } from './PrintReportModal';

interface ReportsViewProps {
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ packages, onSelectPackage }) => {
  const [selectedPkgForPrint, setSelectedPkgForPrint] = useState<TourPackage | null>(null);
  const [reportType, setReportType] = useState<'internal' | 'quotation'>('internal');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-blue-700" />
          Pusat Laporan & Ekspor HPP
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Unduh laporan Excel terstruktur atau cetak dokumen penawaran harga resmi dan rekapan biaya internal
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Daftar Paket Siap Ekspor ({packages.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Paket Tour</th>
                <th className="py-3 px-3">Jenis Trip</th>
                <th className="py-3 px-3">Peserta Target</th>
                <th className="py-3 px-4 text-right">Total HPP</th>
                <th className="py-3 px-4 text-right">Estimasi Laba</th>
                <th className="py-3 px-3 text-center">Margin</th>
                <th className="py-3 px-4 text-center">Opsi Ekspor & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map((pkg) => {
                const res = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
                  participantCount: pkg.target_participants,
                  crewCount: pkg.crew_count,
                  durationDays: pkg.duration_days,
                  durationNights: pkg.duration_nights,
                });

                return (
                  <tr key={pkg.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pkg.name}</div>
                      <div className="font-mono text-[11px] text-blue-700">{pkg.package_code}</div>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      {pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'}
                    </td>
                    <td className="py-3 px-3 font-semibold">{pkg.target_participants} Orang</td>
                    <td className="py-3 px-4 text-right font-medium">
                      Rp{Math.round(res.totalHpp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      Rp{Math.round(res.estimatedProfit).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {res.actualMarginPercentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => exportPackageToExcel(pkg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold text-xs"
                          title="Unduh Excel (XLSX) dengan 3 Sheet"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPkgForPrint(pkg);
                            setReportType('internal');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold text-xs"
                          title="Laporan Biaya Internal"
                        >
                          <Printer className="h-3.5 w-3.5 text-blue-600" />
                          <span>HPP Internal</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPkgForPrint(pkg);
                            setReportType('quotation');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs"
                          title="Penawaran Pelanggan Resmi"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-600" />
                          <span>Quotation</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPkgForPrint && (
        <PrintReportModal
          pkg={selectedPkgForPrint}
          reportType={reportType}
          onClose={() => setSelectedPkgForPrint(null)}
        />
      )}
    </div>
  );
};
