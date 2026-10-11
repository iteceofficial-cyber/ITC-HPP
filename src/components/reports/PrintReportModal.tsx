import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp } from '../../lib/hppEngine';
import { DEFAULT_COST_CATEGORIES } from '../../lib/constants';

interface PrintReportModalProps {
  pkg: TourPackage;
  reportType: 'internal' | 'quotation';
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  pkg,
  reportType,
  onClose,
}) => {
  const result = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
    participantCount: pkg.target_participants,
    crewCount: pkg.crew_count,
    durationDays: pkg.duration_days,
    durationNights: pkg.duration_nights,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:m-0 print:max-w-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>
              {reportType === 'internal'
                ? 'Laporan HPP & Costing Operasional (Internal)'
                : 'Surat Penawaran Harga Wisatawan (Quotation Resmi)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-8 sm:p-12 text-slate-800 space-y-6 text-sm bg-white font-sans">
          {/* Header Kop Surat */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                PT TOURCOST NUSANTARA TRAVEL
              </div>
              <div className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                Izin Operasional Biro Perjalanan Wisata: No. 556/BPW/2026<br />
                Jl. Pariwisata Raya No. 88, Jakarta Selatan · Telp: (021) 7890-1234 · Email: ops@tourcost.id
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                {reportType === 'internal' ? 'DOKUMEN RAHASIA INTERNAL' : 'OFFICIAL TOUR QUOTATION'}
              </div>
              <div className="text-base font-extrabold font-mono text-blue-900 mt-0.5">
                {pkg.package_code}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Judul Laporan */}
          <div className="text-center py-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {reportType === 'internal'
                ? 'REKAPITULASI BIAYA POKOK (HPP) & MARGIN PAKET'
                : `PENAWARAN HARGA PAKET TOUR: ${pkg.name.toUpperCase()}`}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Destinasi: <strong>{pkg.destination}</strong> · Durasi:{' '}
              <strong>
                {pkg.duration_days} Hari {pkg.duration_nights} Malam
              </strong>
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Jenis Perjalanan:</span>
              <span className="font-bold text-slate-900 capitalize">
                {pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jadwal Pelaksanaan:</span>
              <span className="font-bold text-slate-900">
                {pkg.departure_date} s/d {pkg.return_date}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jumlah Peserta Target:</span>
              <span className="font-bold text-slate-900">
                {pkg.target_participants} Orang (Min. {pkg.minimum_participants} pax)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">PIC / Tour Planner:</span>
              <span className="font-bold text-slate-900">{pkg.person_in_charge}</span>
            </div>
          </div>

          {/* MODE 1: INTERNAL REPORT (WITH FULL BREAKDOWN) */}
          {reportType === 'internal' ? (
            <div className="space-y-6">
              {/* Rincian Komponen Biaya */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Rincian Item Pengeluaran Operasional
                </h2>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase text-[10px]">
                      <th className="p-2 border-r border-slate-300">Kategori</th>
                      <th className="p-2 border-r border-slate-300">Nama Item</th>
                      <th className="p-2 text-center border-r border-slate-300">Qty</th>
                      <th className="p-2 text-center border-r border-slate-300">Satuan</th>
                      <th className="p-2 text-right border-r border-slate-300">Harga Satuan</th>
                      <th className="p-2 text-center border-r border-slate-300">Freq</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pkg.cost_items.map((item) => {
                      const cat = DEFAULT_COST_CATEGORIES.find((c) => c.id === item.category_id);
                      const subtotal = item.quantity * item.unit_price * item.frequency;
                      return (
                        <tr key={item.id} className="text-slate-700">
                          <td className="p-2 border-r border-slate-200 font-semibold">{cat?.name}</td>
                          <td className="p-2 border-r border-slate-200">{item.item_name}</td>
                          <td className="p-2 text-center border-r border-slate-200">{item.quantity}</td>
                          <td className="p-2 text-center border-r border-slate-200">{item.unit}</td>
                          <td className="p-2 text-right border-r border-slate-200">
                            Rp{item.unit_price.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200">{item.frequency}</td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            Rp{Math.round(subtotal).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td colSpan={6} className="p-2 text-right border-r border-slate-300">
                        Total Biaya Dasar:
                      </td>
                      <td className="p-2 text-right">
                        Rp{Math.round(result.totalBaseCost).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700">
                      <td colSpan={6} className="p-2 text-right border-r border-slate-300">
                        Cadangan Biaya Tak Terduga ({pkg.pricing_settings.contingency_percentage}%):
                      </td>
                      <td className="p-2 text-right">
                        Rp{Math.round(result.contingencyCost).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="bg-slate-200 font-black text-slate-900 border-t border-slate-400">
                      <td colSpan={6} className="p-2 text-right border-r border-slate-300">
                        TOTAL HPP PAKET:
                      </td>
                      <td className="p-2 text-right text-base text-blue-900">
                        Rp{Math.round(result.totalHpp).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Rekapitulasi Harga & Keuntungan */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded p-4 bg-slate-50 text-xs">
                <div>
                  <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                    Analisis Harga Jual
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>HPP per Peserta Pembayar:</span>
                      <span className="font-bold text-slate-900">
                        Rp{Math.round(result.hppPerParticipant).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode Penetapan:</span>
                      <span className="font-semibold uppercase">
                        {pkg.pricing_settings.pricing_method} ({pkg.pricing_settings.target_percentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harga Jual Bersih / Pax:</span>
                      <span className="font-bold text-blue-900">
                        Rp{Math.round(result.netSellingPricePerPax).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                    Estimasi Hasil Keuntungan
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Total Estimasi Pendapatan:</span>
                      <span className="font-bold text-slate-900">
                        Rp{Math.round(result.totalRevenue).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimasi Laba Bersih:</span>
                      <span className="font-bold text-emerald-700">
                        Rp{Math.round(result.estimatedProfit).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin Aktual Realisasi:</span>
                      <span className="font-bold text-emerald-800">
                        {result.actualMarginPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: OFFICIAL CUSTOMER QUOTATION */
            <div className="space-y-6">
              <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-lg text-xs leading-relaxed text-slate-700">
                Terima kasih atas kepercayaan Anda memilih <strong>TourCost Nusantara Travel</strong>. Kami dengan senang hati menawarkan paket wisata terbaik dengan fasilitas prima, armada nyaman, dan pelayanan terstandar.
              </div>

              {/* Harga Penawaran Resmi */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider">
                  Harga Penawaran Resmi (All-In Package)
                </div>
                <table className="w-full text-xs text-left">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-3 font-semibold text-slate-700">Harga per Peserta</td>
                      <td className="p-3 text-right font-extrabold text-blue-900 text-base">
                        Rp{Math.round(result.netSellingPricePerPax).toLocaleString('id-ID')} / pax
                      </td>
                    </tr>
                    {pkg.trip_type === 'private_trip' && (
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-3 font-semibold text-slate-700">
                          Harga Total Rombongan ({pkg.target_participants} Peserta)
                        </td>
                        <td className="p-3 text-right font-extrabold text-blue-900 text-base">
                          Rp{Math.round(result.totalRevenue).toLocaleString('id-ID')} / rombongan
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="p-3 font-semibold text-slate-700">Ketentuan Kuota</td>
                      <td className="p-3 text-right text-slate-600">
                        Minimum kuota pelaksanaan: <strong>{pkg.minimum_participants} orang</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fasilitas Termasuk */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Fasilitas Sudah Termasuk (Included):
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>Transportasi full AC nyaman sesuai standar operasional perjalanan</li>
                  <li>Akomodasi penginapan dan kamar sesuai durasi paket tour</li>
                  <li>Konsumsi makanan prasmanan / resto lokal selama trip berlangsung</li>
                  <li>Tiket masuk objek wisata dan retribusi kawasan resmi</li>
                  <li>Tour Leader (TL) dan Guide lokal berpengalaman</li>
                  <li>Air mineral botol harian dan P3K standar keselamatan</li>
                </ul>
              </div>

              {/* Syarat & Ketentuan */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Syarat & Ketentuan Pemesanan:
                </div>
                <ol className="text-xs text-slate-600 space-y-1 list-decimal pl-5">
                  <li>Down Payment (DP) minimal 30% pada saat konfirmasi pemesanan.</li>
                  <li>Pelunasan wajib diselesaikan maksimal H-7 sebelum tanggal keberangkatan.</li>
                  <li>Harga penawaran ini berlaku selama 14 hari sejak tanggal diterbitkan.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tanda Tangan */}
          <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs">
            <div className="text-center">
              <div className="text-slate-500 mb-12">Disiapkan Oleh:</div>
              <div className="font-bold text-slate-900 border-b border-slate-400 pb-1 px-4">
                {pkg.person_in_charge}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tour Planner</div>
            </div>

            <div className="text-center">
              <div className="text-slate-500 mb-12">Menyetujui:</div>
              <div className="font-bold text-slate-900 border-b border-slate-400 pb-1 px-4">
                {pkg.approved_by_name || 'Hendra Wijaya'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Direktur Operasional</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
