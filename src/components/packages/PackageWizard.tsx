import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import {
  TourPackage,
  CostItem,
  PricingSettings,
  CostCalculationBasis,
  CostType,
} from '../../types';
import { DEFAULT_COST_CATEGORIES, DEFAULT_PRICING_SETTINGS, CALCULATION_BASIS_LABELS } from '../../lib/constants';
import { calculateHpp, calculateItemSubtotal } from '../../lib/hppEngine';
import { CurrencyInput } from '../common/CurrencyInput';
import { store } from '../../lib/store';

interface PackageWizardProps {
  initialPackage?: TourPackage | null;
  onCancel: () => void;
  onSaved: (pkg: TourPackage) => void;
}

export const PackageWizard: React.FC<PackageWizardProps> = ({
  initialPackage,
  onCancel,
  onSaved,
}) => {
  const [step, setStep] = useState<number>(1);
  const isEditing = Boolean(initialPackage);

  // Tahap 1 State: Informasi Paket
  const [code, setCode] = useState<string>(
    initialPackage?.package_code || `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [name, setName] = useState<string>(initialPackage?.name || '');
  const [destination, setDestination] = useState<string>(initialPackage?.destination || '');
  const [tripType, setTripType] = useState<'open_trip' | 'private_trip'>(initialPackage?.trip_type || 'open_trip');
  const [departureDate, setDepartureDate] = useState<string>(
    initialPackage?.departure_date || new Date().toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState<string>(
    initialPackage?.return_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(initialPackage?.duration_days || 2);
  const [durationNights, setDurationNights] = useState<number>(initialPackage?.duration_nights || 1);
  const [minParticipants, setMinParticipants] = useState<number>(initialPackage?.minimum_participants || 10);
  const [targetParticipants, setTargetParticipants] = useState<number>(initialPackage?.target_participants || 20);
  const [maxParticipants, setMaxParticipants] = useState<number>(initialPackage?.maximum_participants || 30);
  const [crewCount, setCrewCount] = useState<number>(initialPackage?.crew_count || 2);
  const [pic, setPic] = useState<string>(initialPackage?.person_in_charge || store.getCurrentUser().full_name);
  const [notes, setNotes] = useState<string>(initialPackage?.notes || '');

  // Tahap 2 State: Rincian Biaya
  const [costItems, setCostItems] = useState<CostItem[]>(
    initialPackage?.cost_items || [
      {
        id: `ci-init-1`,
        category_id: 'cat-transport',
        item_name: 'Sewa Bus / Transportasi Utama',
        cost_type: 'fixed',
        quantity: 1,
        unit: 'unit',
        unit_price: 3500000,
        frequency: 1,
        calculation_basis: 'per_package',
        is_contingency_eligible: true,
        is_included_elsewhere: false,
      },
    ]
  );

  // Tahap 3 State: Pengaturan Harga
  const [pricing, setPricing] = useState<PricingSettings>(
    initialPackage?.pricing_settings || { ...DEFAULT_PRICING_SETTINGS }
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Kalkulasi Live Real-Time
  const calculationResult = calculateHpp(costItems, pricing, {
    participantCount: targetParticipants,
    crewCount,
    durationDays,
    durationNights,
  });

  // Validasi Step 1
  const validateStep1 = (): string | null => {
    if (!name.trim()) return 'Nama paket wajib diisi.';
    if (!destination.trim()) return 'Destinasi paket wajib diisi.';
    if (!pic.trim()) return 'PIC wajib diisi.';
    if (new Date(returnDate) < new Date(departureDate)) {
      return 'Tanggal kepulangan tidak boleh lebih awal dari tanggal keberangkatan.';
    }
    if (minParticipants <= 0) return 'Minimum peserta harus minimal 1.';
    if (targetParticipants < minParticipants) {
      return 'Target peserta tidak boleh lebih kecil dari minimum peserta.';
    }
    if (maxParticipants < targetParticipants) {
      return 'Maksimum peserta tidak boleh lebih kecil dari target peserta.';
    }
    return null;
  };

  // Validasi Step 2
  const validateStep2 = (): string | null => {
    if (costItems.length === 0) {
      return 'Minimal tambahkan satu item biaya pada paket.';
    }
    return null;
  };

  // Tambah item biaya baru
  const handleAddItem = (categoryId: string) => {
    const newItem: CostItem = {
      id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category_id: categoryId,
      item_name: '',
      cost_type: 'fixed',
      quantity: 1,
      unit: 'unit',
      unit_price: 0,
      frequency: 1,
      calculation_basis: 'per_package',
      is_contingency_eligible: true,
      is_included_elsewhere: false,
    };
    setCostItems([...costItems, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<CostItem>) => {
    setCostItems(costItems.map((ci) => (ci.id === id ? { ...ci, ...updates } : ci)));
  };

  const handleDeleteItem = (id: string) => {
    setCostItems(costItems.filter((ci) => ci.id !== id));
  };

  // Simpan Paket (Tersimpan ke local storage & server database)
  const handleSave = async (targetStatus: 'draft' | 'pending_approval' | 'approved' | 'final' = 'draft') => {
    const validationErr = validateStep1() || validateStep2();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const packageData: TourPackage = {
      id: initialPackage?.id || `pkg-${Date.now()}`,
      package_code: code,
      name,
      destination,
      trip_type: tripType,
      departure_date: departureDate,
      return_date: returnDate,
      duration_days: durationDays,
      duration_nights: durationNights,
      minimum_participants: minParticipants,
      target_participants: targetParticipants,
      maximum_participants: maxParticipants,
      crew_count: crewCount,
      person_in_charge: pic,
      notes,
      status: targetStatus,
      created_by: initialPackage?.created_by || store.getCurrentUser().id,
      updated_by: store.getCurrentUser().id,
      created_at: initialPackage?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cost_items: costItems,
      pricing_settings: {
        ...pricing,
        package_id: initialPackage?.id || `pkg-${Date.now()}`,
      },
    };

    const res = await store.savePackage(packageData);
    setIsSaving(false);

    if (res.success) {
      setFormError(null);
      onSaved(packageData);
    } else {
      setFormError(res.error || 'Gagal menyimpan paket.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {isEditing ? `Edit Paket: ${initialPackage?.name}` : 'Buat Paket Tour Baru'}
          </h1>
        </div>

        {/* Wizard Progress Steps */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Informasi' },
            { num: 2, label: 'Rincian Biaya' },
            { num: 3, label: 'Penetapan Harga' },
            { num: 4, label: 'Review & Simpan' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < step) setStep(s.num);
                else if (s.num === 2 && !validateStep1()) setStep(2);
                else if (s.num === 3 && !validateStep1() && !validateStep2()) setStep(3);
                else if (s.num === 4 && !validateStep1() && !validateStep2()) setStep(4);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                step === s.num
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : step > s.num
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{s.num}.</span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: INFORMASI PAKET */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Tahap 1: Informasi & Identitas Paket
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Paket (Otomatis & Unik)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-3 text-xs font-mono text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Paket Tour *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Open Trip Bromo Sunrise & Savana 2D1N"
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destinasi *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Contoh: Bromo, Malang, Jawa Timur"
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Trip *</label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm font-medium focus:border-blue-600 focus:outline-hidden"
              >
                <option value="open_trip">Open Trip (Per Peserta)</option>
                <option value="private_trip">Private Trip (Per Rombongan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIC (Penanggung Jawab) *
              </label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Keberangkatan *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Kepulangan *
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Hari</label>
                <input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Malam</label>
                <input
                  type="number"
                  min={0}
                  value={durationNights}
                  onChange={(e) => setDurationNights(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Peserta *
              </label>
              <input
                type="number"
                min={1}
                value={minParticipants}
                onChange={(e) => setMinParticipants(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Peserta *
              </label>
              <input
                type="number"
                min={minParticipants}
                value={targetParticipants}
                onChange={(e) => setTargetParticipants(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maksimum Kapasitas
              </label>
              <input
                type="number"
                min={targetParticipants}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Kru / Tour Leader
              </label>
              <input
                type="number"
                min={0}
                value={crewCount}
                onChange={(e) => setCrewCount(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-sm"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Kru masuk kalkulasi biaya, bukan peserta pembayar.
              </span>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Operasional / Asumsi Trip
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan mengenai titik kumpul, vendor spesifik, atau kondisi cuaca..."
                className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                const err = validateStep1();
                if (err) {
                  setFormError(err);
                } else {
                  setFormError(null);
                  setStep(2);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold shadow-xs"
            >
              Lanjut ke Rincian Biaya <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RINCIAN BIAYA */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tahap 2: Rincian Biaya per Kategori
                </h2>
                <p className="text-xs text-slate-500">
                  Target: {targetParticipants} pax · Kru: {crewCount} orang · Durasi: {durationDays}H {durationNights}M
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Biaya Dasar:</span>
                <div className="text-lg font-bold text-slate-900">
                  Rp{Math.round(calculationResult.totalBaseCost).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* List by Kategori */}
            <div className="space-y-6">
              {DEFAULT_COST_CATEGORIES.map((category) => {
                const itemsInCat = costItems.filter((i) => i.category_id === category.id);
                const catTotal = itemsInCat.reduce((acc, curr) => {
                  const { subtotal } = calculateItemSubtotal(
                    curr,
                    targetParticipants,
                    crewCount,
                    durationDays,
                    durationNights
                  );
                  return acc + subtotal;
                }, 0);

                return (
                  <div
                    key={category.id}
                    className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Header Kategori */}
                    <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <span>{category.name}</span>
                          <span className="text-slate-400 font-normal">({itemsInCat.length} item)</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{category.description}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">
                          Rp{Math.round(catTotal).toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(category.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded text-blue-700 hover:bg-blue-50"
                        >
                          + Tambah Item
                        </button>
                      </div>
                    </div>

                    {/* Tabel Item Kategori */}
                    {itemsInCat.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-white">
                        Belum ada item biaya dalam kategori ini. Klik "+ Tambah Item" untuk menambahkan.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                              <th className="py-2 px-3">Nama Item</th>
                              <th className="py-2 px-2">Kuantitas</th>
                              <th className="py-2 px-2">Satuan</th>
                              <th className="py-2 px-3">Harga Satuan (Rp)</th>
                              <th className="py-2 px-2">Frekuensi</th>
                              <th className="py-2 px-3">Dasar Kalkulasi</th>
                              <th className="py-2 px-3 text-right">Subtotal</th>
                              <th className="py-2 px-2 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemsInCat.map((item) => {
                              const { subtotal } = calculateItemSubtotal(
                                item,
                                targetParticipants,
                                crewCount,
                                durationDays,
                                durationNights
                              );

                              return (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 min-w-[180px]">
                                    <input
                                      type="text"
                                      placeholder="Nama pengeluaran / vendor..."
                                      value={item.item_name}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, { item_name: e.target.value })
                                      }
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                                    />
                                    {item.notes && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                        {item.notes}
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-2 px-2 w-20">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          quantity: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs"
                                    />
                                  </td>

                                  <td className="py-2 px-2 w-20">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, { unit: e.target.value })
                                      }
                                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs"
                                    />
                                  </td>

                                  <td className="py-2 px-3 min-w-[130px]">
                                    <CurrencyInput
                                      value={item.unit_price}
                                      onChange={(val) =>
                                        handleUpdateItem(item.id, { unit_price: val })
                                      }
                                      prefix="Rp"
                                      className="text-xs py-1"
                                    />
                                  </td>

                                  <td className="py-2 px-2 w-16">
                                    <input
                                      type="number"
                                      min={1}
                                      value={item.frequency}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          frequency: parseInt(e.target.value) || 1,
                                        })
                                      }
                                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs text-center"
                                    />
                                  </td>

                                  <td className="py-2 px-3 min-w-[160px]">
                                    <select
                                      value={item.calculation_basis}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          calculation_basis: e.target.value as CostCalculationBasis,
                                        })
                                      }
                                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs"
                                    >
                                      {Object.entries(CALCULATION_BASIS_LABELS).map(([k, v]) => (
                                        <option key={k} value={k}>
                                          {v}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="py-2 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                    Rp{Math.round(subtotal).toLocaleString('id-ID')}
                                  </td>

                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Informasi
              </button>
              <button
                onClick={() => {
                  const err = validateStep2();
                  if (err) {
                    setFormError(err);
                  } else {
                    setFormError(null);
                    setStep(3);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold shadow-xs"
              >
                Lanjut ke Penetapan Harga <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PENGATURAN HARGA */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Tahap 3: Pengaturan Harga, Margin & Cadangan Biaya
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Metode Pricing */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Penetapan Harga *
              </label>
              <select
                value={pricing.pricing_method}
                onChange={(e) =>
                  setPricing({ ...pricing, pricing_method: e.target.value as any })
                }
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm font-medium focus:border-blue-600 focus:outline-hidden"
              >
                <option value="margin">Margin (Harga = HPP / (1 - Margin%))</option>
                <option value="markup">Markup (Harga = HPP × (1 + Markup%))</option>
              </select>
              <span className="text-[11px] text-slate-500 block mt-1">
                {pricing.pricing_method === 'margin'
                  ? 'Margin menghitung proporsi laba dari harga jual akhir.'
                  : 'Markup menghitung persentase laba di atas harga pokok.'}
              </span>
            </div>

            {/* Target Persentase */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Persentase ({pricing.pricing_method === 'margin' ? 'Margin' : 'Markup'}) % *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={pricing.pricing_method === 'margin' ? 99 : 500}
                  value={pricing.target_percentage}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      target_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm font-bold text-blue-700 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
              </div>
            </div>

            {/* Cadangan Biaya Tak Terduga (Contingency) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cadangan Biaya Tak Terduga (Contingency Reserve) %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={pricing.contingency_percentage}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      contingency_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Dicadangkan untuk risiko cuaca, kenaikan tol/tiket mendadak.
              </span>
            </div>

            {/* Pembulatan Harga */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pembulatan Harga Jual
              </label>
              <select
                value={pricing.rounding_increment}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    rounding_increment: parseInt(e.target.value) as any,
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm font-medium"
              >
                <option value={0}>Tanpa Pembulatan</option>
                <option value={1000}>Ke Rp1.000 Terdekat</option>
                <option value={5000}>Ke Rp5.000 Terdekat (Rekomendasi)</option>
                <option value={10000}>Ke Rp10.000 Terdekat</option>
                <option value={50000}>Ke Rp50.000 Terdekat</option>
              </select>
            </div>

            {/* Diskon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diskon Promosi (Opsional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={pricing.discount_type}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      discount_type: e.target.value as any,
                      discount_value: 0,
                    })
                  }
                  className="bg-white border border-slate-300 rounded-md py-1.5 px-2 text-xs"
                >
                  <option value="none">Tanpa Diskon</option>
                  <option value="percentage">Persen (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>

                {pricing.discount_type === 'percentage' && (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pricing.discount_value}
                    onChange={(e) =>
                      setPricing({
                        ...pricing,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="%"
                    className="bg-white border border-slate-300 rounded-md py-1.5 px-2 text-xs"
                  />
                )}

                {pricing.discount_type === 'fixed' && (
                  <CurrencyInput
                    value={pricing.discount_value}
                    onChange={(val) => setPricing({ ...pricing, discount_value: val })}
                    className="text-xs py-1"
                  />
                )}
              </div>
            </div>

            {/* Harga Jual Manual Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual Manual (Opsional Override)
              </label>
              <CurrencyInput
                value={pricing.manual_selling_price || 0}
                onChange={(val) =>
                  setPricing({
                    ...pricing,
                    manual_selling_price: val > 0 ? val : undefined,
                  })
                }
                placeholder="Kosongkan jika otomatis"
                className="text-sm py-2"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Jika diisi, formula margin/markup diabaikan. HPP tidak berubah.
              </span>
            </div>
          </div>

          {/* Live Preview Metric Cards */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Hasil Kalkulasi Pada Target ({targetParticipants} Peserta)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">HPP per Peserta:</span>
                <span className="text-sm font-bold text-slate-900">
                  Rp{Math.round(calculationResult.hppPerParticipant).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Harga Jual Bersih:</span>
                <span className="text-sm font-bold text-blue-800">
                  Rp{Math.round(calculationResult.netSellingPricePerPax).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Margin Aktual:</span>
                <span
                  className={`text-sm font-bold ${
                    calculationResult.actualMarginPercentage < pricing.target_percentage
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {calculationResult.actualMarginPercentage.toFixed(2)}%
                </span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Estimasi Total Laba:</span>
                <span
                  className={`text-sm font-bold ${
                    calculationResult.estimatedProfit < 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  Rp{Math.round(calculationResult.estimatedProfit).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Peringatan jika ada */}
            {calculationResult.warnings.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <div>{calculationResult.warnings.join(' ')}</div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Biaya
            </button>
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold shadow-xs"
            >
              Lanjut ke Review & Simpan <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW DAN SIMPAN */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Tahap 4: Review Akhir Paket & Konfirmasi Simpan
            </h2>
            <p className="text-xs text-slate-500">
              Pastikan seluruh parameter dan struktur biaya telah sesuai sebelum disimpan ke database.
            </p>
          </div>

          {/* Ringkasan Metadata Paket */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Kode & Nama:</span>
              <span className="font-bold text-slate-900">{code}</span>
              <span className="block text-slate-700 truncate">{name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Destinasi & Trip:</span>
              <span className="font-semibold text-slate-800">{destination}</span>
              <span className="block text-slate-500">
                {tripType === 'open_trip' ? 'Open Trip' : 'Private Trip'} · {durationDays}D{durationNights}N
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Peserta & Kru:</span>
              <span className="font-semibold text-slate-800">
                Target: {targetParticipants} pax (Min: {minParticipants}, Max: {maxParticipants})
              </span>
              <span className="block text-slate-500">Kru Lapangan: {crewCount} orang</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">PIC & Keberangkatan:</span>
              <span className="font-semibold text-slate-800">{pic}</span>
              <span className="block text-slate-500">{departureDate} s/d {returnDate}</span>
            </div>
          </div>

          {/* Struktur Biaya Final */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                Struktur Komponen HPP
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Biaya Tetap (Fixed Cost)</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.fixedCostTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Biaya Variabel Peserta</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.variableParticipantCostTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Biaya Variabel Kru</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.variableCrewCostTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Biaya Kapasitas (Kendaraan / Kamar)</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.capacityCostTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Cadangan Biaya Tak Terduga ({pricing.contingency_percentage}%)</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.contingencyCost).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t border-slate-200">
                <span>Total HPP Paket</span>
                <span>Rp{Math.round(calculationResult.totalHpp).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-blue-800">
                <span>HPP per Peserta</span>
                <span>Rp{Math.round(calculationResult.hppPerParticipant).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                Harga Jual & Estimasi Laba
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Metode Penetapan</span>
                <span className="font-medium text-slate-800 uppercase">
                  {pricing.pricing_method} ({pricing.target_percentage}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Harga Jual Sebelum Diskon</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.baseSellingPrice).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Diskon Terpasang</span>
                <span className="font-medium text-slate-800">
                  Rp{Math.round(calculationResult.discountAmount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Harga Jual Bersih / Peserta</span>
                <span className="font-bold text-blue-800">
                  Rp{Math.round(calculationResult.netSellingPricePerPax).toLocaleString('id-ID')}
                </span>
              </div>
              {tripType === 'private_trip' && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                  <span>Harga Total Rombongan ({targetParticipants} Pax)</span>
                  <span className="font-bold text-blue-900">
                    Rp{Math.round(calculationResult.sellingPriceGroup || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-bold text-emerald-800 border-t border-slate-200">
                <span>Estimasi Keuntungan Bersih</span>
                <span>Rp{Math.round(calculationResult.estimatedProfit).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Margin Keuntungan Aktual</span>
                <span>{calculationResult.actualMarginPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Simpan Draft, Simpan & Ajukan */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali untuk Mengedit
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave('draft')}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave('pending_approval')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-2xs disabled:opacity-50"
              >
                {isSaving ? 'Memproses...' : 'Ajukan Persetujuan'}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(store.isSuperAdmin() ? 'final' : 'approved')}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan & Selesai'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
