import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { TourPackage } from '../../types';
import { calculateHpp, generateScenarios } from '../../lib/hppEngine';
import { exportPackageToExcel } from '../../lib/exportUtils';
import { CurrencyInput } from '../common/CurrencyInput';

interface SimulationWorkbenchProps {
  packages: TourPackage[];
  initialSelectedPackageId?: string;
}

export const SimulationWorkbench: React.FC<SimulationWorkbenchProps> = ({
  packages,
  initialSelectedPackageId,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    initialSelectedPackageId || (packages[0]?.id || '')
  );

  const selectedPkg = useMemo(() => {
    return packages.find((p) => p.id === selectedPkgId) || packages[0];
  }, [packages, selectedPkgId]);

  const [simPax, setSimPax] = useState<number>(selectedPkg?.target_participants || 20);
  const [overrideSellingPrice, setOverrideSellingPrice] = useState<number>(0);
  const [customTiers, setCustomTiers] = useState<number[]>([5, 8, 10, 15, 20, 25, 30, 40]);
  const [newTierInput, setNewTierInput] = useState<number>(12);

  // Kalkulasi Live untuk slider simulasi
  const liveResult = useMemo(() => {
    if (!selectedPkg) return null;
    return calculateHpp(selectedPkg.cost_items, selectedPkg.pricing_settings, {
      participantCount: simPax,
      crewCount: selectedPkg.crew_count,
      durationDays: selectedPkg.duration_days,
      durationNights: selectedPkg.duration_nights,
      overrideSellingPrice: overrideSellingPrice > 0 ? overrideSellingPrice : undefined,
    });
  }, [selectedPkg, simPax, overrideSellingPrice]);

  // Kalkulasi BEP (Break Even Point peserta)
  const breakEvenPax = useMemo(() => {
    if (!selectedPkg) return 0;
    // Iterasi mencari pax terkecil dengan laba >= 0
    for (let p = 1; p <= 100; p++) {
      const res = calculateHpp(selectedPkg.cost_items, selectedPkg.pricing_settings, {
        participantCount: p,
        crewCount: selectedPkg.crew_count,
        durationDays: selectedPkg.duration_days,
        durationNights: selectedPkg.duration_nights,
        overrideSellingPrice: overrideSellingPrice > 0 ? overrideSellingPrice : undefined,
      });
      if (res.estimatedProfit >= 0) {
        return p;
      }
    }
    return 0;
  }, [selectedPkg, overrideSellingPrice]);

  // Skenario untuk multi tier table
  const tierScenarios = useMemo(() => {
    if (!selectedPkg) return [];
    return generateScenarios(
      selectedPkg.id,
      selectedPkg.cost_items,
      selectedPkg.pricing_settings,
      customTiers.sort((a, b) => a - b),
      selectedPkg.crew_count,
      selectedPkg.minimum_participants,
      selectedPkg.duration_days,
      selectedPkg.duration_nights,
      selectedPkg.trip_type === 'private_trip'
    );
  }, [selectedPkg, customTiers]);

  const handleAddTier = () => {
    if (newTierInput > 0 && !customTiers.includes(newTierInput)) {
      setCustomTiers([...customTiers, newTierInput]);
      setNewTierInput(newTierInput + 5);
    }
  };

  const handleRemoveTier = (tier: number) => {
    setCustomTiers(customTiers.filter((t) => t !== tier));
  };

  if (!selectedPkg) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        Belum ada paket tour tersedia untuk simulasi.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Simulasi Sensitivitas Jumlah Peserta & Harga
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Analisis titik impas (Break-Even), variasi kapasitas armada, dan batas toleransi keuntungan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPkgId}
            onChange={(e) => {
              setSelectedPkgId(e.target.value);
              const found = packages.find((p) => p.id === e.target.value);
              if (found) setSimPax(found.target_participants);
            }}
            className="bg-white border border-slate-300 rounded-md py-1.5 px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-hidden"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.package_code} - {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => exportPackageToExcel(selectedPkg)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Ekspor Simulasi
          </button>
        </div>
      </div>

      {/* Interactive Controls & Live Outcome */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Simulasi Jumlah Peserta Aktif
              </label>
              <span className="text-lg font-black text-blue-700 font-mono">
                {simPax} Orang
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={selectedPkg.maximum_participants + 15}
              value={simPax}
              onChange={(e) => setSimPax(parseInt(e.target.value) || 1)}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min Kuota: {selectedPkg.minimum_participants} pax</span>
              <span>Target: {selectedPkg.target_participants} pax</span>
              <span>Maksimum: {selectedPkg.maximum_participants} pax</span>
            </div>

            {/* Override Harga Jual */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Eksperimen Harga Jual per Pax (Opsional):
              </label>
              <div className="flex items-center gap-2">
                <CurrencyInput
                  value={overrideSellingPrice}
                  onChange={setOverrideSellingPrice}
                  placeholder={`Default: Rp${Math.round(liveResult?.baseSellingPrice || 0).toLocaleString('id-ID')}`}
                  className="text-xs py-1"
                />
                {overrideSellingPrice > 0 && (
                  <button
                    onClick={() => setOverrideSellingPrice(0)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Reset Harga
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Key KPI Real-Time */}
          {liveResult && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block text-[11px]">HPP per Peserta:</span>
                <span className="text-base font-bold text-blue-800">
                  Rp{Math.round(liveResult.hppPerParticipant).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Total HPP: Rp{Math.round(liveResult.totalHpp).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Harga Jual Bersih:</span>
                <span className="text-base font-bold text-slate-900">
                  Rp{Math.round(liveResult.netSellingPricePerPax).toLocaleString('id-ID')}
                </span>
                {selectedPkg.trip_type === 'private_trip' && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Rombongan: Rp{Math.round(liveResult.sellingPriceGroup || 0).toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <div
                className={`p-3 border rounded-lg ${
                  liveResult.estimatedProfit < 0
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="block text-[11px] opacity-80">Estimasi Laba Bersih:</span>
                <span className="text-base font-bold">
                  Rp{Math.round(liveResult.estimatedProfit).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] block mt-0.5">
                  Margin: {liveResult.actualMarginPercentage.toFixed(2)}%
                </span>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-blue-900 block text-[11px]">Titik Impas (BEP):</span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  {breakEvenPax > 0 ? `${breakEvenPax} Peserta` : 'Tidak tercapai'}
                </span>
                <span className="text-[10px] text-blue-700 block mt-0.5">
                  Kuota minimum agar laba ≥ Rp0
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Warning messages */}
        {liveResult && liveResult.warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>{liveResult.warnings.join(' ')}</div>
          </div>
        )}
      </div>

      {/* Multi-Tier Comparison Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tabel Skenario Variasi Peserta</h2>
            <p className="text-xs text-slate-500">
              Perbandingan HPP, harga jual, margin, dan status terhadap minimum kuota paket
            </p>
          </div>

          {/* Add custom tier */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={newTierInput}
              onChange={(e) => setNewTierInput(parseInt(e.target.value) || 1)}
              placeholder="Pax..."
              className="w-18 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            />
            <button
              onClick={handleAddTier}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Kolom
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Jumlah Pax</th>
                <th className="py-2.5 px-3 text-right">Biaya Tetap</th>
                <th className="py-2.5 px-3 text-right">Biaya Variabel</th>
                <th className="py-2.5 px-3 text-right">Cadangan</th>
                <th className="py-2.5 px-3 text-right">Total HPP</th>
                <th className="py-2.5 px-3 text-right">HPP / Pax</th>
                <th className="py-2.5 px-3 text-right">Harga Jual / Pax</th>
                {selectedPkg.trip_type === 'private_trip' && (
                  <th className="py-2.5 px-3 text-right">Harga Rombongan</th>
                )}
                <th className="py-2.5 px-3 text-right">Pendapatan</th>
                <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                <th className="py-2.5 px-3 text-center">Margin</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tierScenarios.map((scen) => {
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
                      &lt; Min Pax ({selectedPkg.minimum_participants})
                    </span>
                  );
                } else if (!scen.is_target_met) {
                  badge = (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      &lt; Target Margin
                    </span>
                  );
                }

                const isTarget = scen.participant_count === selectedPkg.target_participants;

                return (
                  <tr
                    key={scen.id}
                    className={`hover:bg-slate-50/50 ${isTarget ? 'bg-blue-50/40 font-semibold' : ''}`}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{scen.participant_count} Orang</span>
                      {isTarget && (
                        <span className="ml-1 text-[10px] text-blue-700 font-bold">(Target)</span>
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
                    {selectedPkg.trip_type === 'private_trip' && (
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
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleRemoveTier(scen.participant_count)}
                        className="text-slate-300 hover:text-red-600 p-1"
                        title="Hapus Tier"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
