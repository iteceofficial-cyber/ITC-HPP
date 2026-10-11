import React, { useState, useEffect } from 'react';
import { FlaskConical, CheckCircle2, XCircle, Play, ShieldCheck, Check } from 'lucide-react';
import { runAllUnitTests, TestResult } from '../../lib/testRunner';

export const TestRunnerView: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState<boolean>(false);

  const executeTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runAllUnitTests();
      setResults(res);
      setRunning(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-700" />
            Pengujian Unit Otomatis (16 Skenario Wajib)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verifikasi akurasi matematis mesin HPP, formula margin vs markup, perlindungan zero-division, dan integritas RBAC
          </p>
        </div>

        <button
          onClick={executeTests}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
        >
          <Play className="h-4 w-4" />
          <span>{running ? 'Menjalankan Uji...' : 'Jalankan Ulang Semua Tes'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Status Kelulusan Test Suite
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <span className={passedCount === totalCount ? 'text-emerald-700' : 'text-red-700'}>
              {passedCount} / {totalCount} Pengujian Lulus
            </span>
            {passedCount === totalCount && (
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                100% Verified
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Termasuk contoh uji patokan: Rp15jt biaya, 20 pax, 25% margin → HPP Rp750k, Jual Rp1jt, Pendapatan Rp20jt, Laba Rp5jt.
          </p>
        </div>

        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="h-7 w-7" />
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {results.map((test) => (
          <div key={test.id} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {test.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{test.id}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{test.name}</h3>
                    <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {test.category}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold">
                        Ekspektasi:
                      </span>
                      <span className="font-mono text-slate-700">{test.expected}</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold">
                        Hasil Aktual:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          test.passed ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {test.actual}
                      </span>
                    </div>
                  </div>

                  {test.details && (
                    <div className="text-[11px] text-slate-500 mt-2">
                      Keterangan: {test.details}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  test.passed
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {test.passed ? 'LULUS' : 'GAGAL'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
