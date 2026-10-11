import React, { useState } from 'react';
import { Calculator, ArrowRight, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { CurrencyInput } from '../common/CurrencyInput';

interface QuickCalculatorViewProps {
  onConvertToPackage: (data: {
    fixedCost: number;
    variableCostPerPax: number;
    crewCost: number;
    pax: number;
    margin: number;
  }) => void;
}

export const QuickCalculatorView: React.FC<QuickCalculatorViewProps> = ({
  onConvertToPackage,
}) => {
  const [fixedCost, setFixedCost] = useState<number>(10000000);
  const [varCostPerPax, setVarCostPerPax] = useState<number>(250000);
  const [crewCost, setCrewCost] = useState<number>(1000000);
  const [pax, setPax] = useState<number>(20);
  const [method, setMethod] = useState<'margin' | 'markup'>('margin');
  const [targetPercentage, setTargetPercentage] = useState<number>(25);
  const [contingencyPct, setContingencyPct] = useState<number>(5);
  const [roundingIncrement, setRoundingIncrement] = useState<number>(5000);
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Kalkulasi Matematis
  const validPax = Math.max(1, pax);
  const totalBaseCost = fixedCost + varCostPerPax * validPax + crewCost;
  const contingencyCost = (totalBaseCost * Math.max(0, contingencyPct)) / 100;
  const totalHpp = totalBaseCost + contingencyCost;
  const hppPerPax = totalHpp / validPax;

  // Harga Jual Sebelum Pembulatan
  let rawSellingPrice = hppPerPax;
  if (method === 'margin') {
    const marginFactor = 1 - Math.min(99, Math.max(0, targetPercentage)) / 100;
    rawSellingPrice = marginFactor > 0 ? hppPerPax / marginFactor : hppPerPax;
  } else {
    rawSellingPrice = hppPerPax * (1 + Math.max(0, targetPercentage) / 100);
  }

  // Pembulatan
  let roundedSellingPrice = rawSellingPrice;
  if (roundingIncrement > 0) {
    roundedSellingPrice = Math.round(rawSellingPrice / roundingIncrement) * roundingIncrement;
  }

  const netSellingPrice = Math.max(0, roundedSellingPrice - discountValue);
  const totalRevenue = netSellingPrice * validPax;
  const estimatedProfit = totalRevenue - totalHpp;
  const actualMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Calculator className="h-6 w-6 text-blue-700" />
          Kalkulator Cepat HPP & Penetapan Harga
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Hitung cepat harga pokok dan simulasi margin penawaran sebelum membuat rincian paket penuh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulir Input Cepat */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Parameter Biaya & Peserta
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Biaya Tetap (Sewa Bus, Tol, Perizinan, dsb):
            </label>
            <CurrencyInput value={fixedCost} onChange={setFixedCost} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biaya Variabel per Peserta (Makan, Tiket, Souvenir):
            </label>
            <CurrencyInput value={varCostPerPax} onChange={setVarCostPerPax} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biaya Kru Lapangan (Honor & Uang Saku TL):
            </label>
            <CurrencyInput value={crewCost} onChange={setCrewCost} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Peserta Pembayar:
              </label>
              <input
                type="number"
                min={1}
                value={pax}
                onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cadangan Tak Terduga (%):
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={contingencyPct}
                onChange={(e) => setContingencyPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Metode:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2 text-xs font-medium"
              >
                <option value="margin">Margin (%)</option>
                <option value="markup">Markup (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target {method === 'margin' ? 'Margin' : 'Markup'} (%):
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pembulatan:
              </label>
              <select
                value={roundingIncrement}
                onChange={(e) => setRoundingIncrement(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2 text-xs"
              >
                <option value={0}>Tanpa Pembulatan</option>
                <option value={1000}>Rp1.000</option>
                <option value={5000}>Rp5.000</option>
                <option value={10000}>Rp10.000</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diskon per Pax (Rp):
              </label>
              <CurrencyInput value={discountValue} onChange={setDiscountValue} className="text-xs py-1" />
            </div>
          </div>
        </div>

        {/* Hasil Output Real-Time */}
        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hasil Kalkulasi Instan
              </span>
              <span className="text-xs font-mono text-blue-400 font-semibold">{pax} Peserta</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-400 block">Total HPP Paket:</span>
                <div className="text-2xl font-bold font-mono text-white">
                  Rp{Math.round(totalHpp).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">HPP per Peserta:</span>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    Rp{Math.round(hppPerPax).toLocaleString('id-ID')}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Harga Jual Bersih:</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    Rp{Math.round(netSellingPrice).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">Total Pendapatan:</span>
                  <div className="text-base font-semibold font-mono text-slate-200">
                    Rp{Math.round(totalRevenue).toLocaleString('id-ID')}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Estimasi Keuntungan:</span>
                  <div
                    className={`text-base font-bold font-mono ${
                      estimatedProfit < 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    Rp{Math.round(estimatedProfit).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Margin Aktual:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {actualMargin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              onConvertToPackage({
                fixedCost,
                variableCostPerPax: varCostPerPax,
                crewCost,
                pax,
                margin: targetPercentage,
              })
            }
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Jadikan Paket Tour Lengkap</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
