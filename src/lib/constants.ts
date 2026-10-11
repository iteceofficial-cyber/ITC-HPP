import { CostCategory, PricingSettings } from '../types';

export const DEFAULT_COST_CATEGORIES: CostCategory[] = [
  {
    id: 'cat-transport',
    name: 'Transportasi',
    description: 'Sewa bus, mobil, BBM, tol, parkir, tiket pesawat/kereta/kapal, driver & kru transport',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'cat-accommodation',
    name: 'Akomodasi',
    description: 'Hotel, guest house, homestay, kamar peserta, kamar kru, extra bed',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'cat-consumption',
    name: 'Konsumsi',
    description: 'Makan peserta, snack, air mineral botol, konsumsi kru lapangan',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'cat-tickets',
    name: 'Tiket & Aktivitas',
    description: 'Tiket masuk objek wisata, retribusi kawasan, wahana, outdoor sport, guide lokal',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'cat-crew',
    name: 'SDM & Kru',
    description: 'Honor tour leader (TL), guide resmi, fotografer, videografer, uang saku & makan kru',
    is_active: true,
    sort_order: 5,
  },
  {
    id: 'cat-operational',
    name: 'Operasional',
    description: 'Dokumentasi, banner/merchandise, name tag, obat P3K, perlengkapan, perizinan, komunikasi',
    is_active: true,
    sort_order: 6,
  },
  {
    id: 'cat-additional',
    name: 'Biaya Tambahan & Cadangan',
    description: 'Cadangan biaya tak terduga (contingency), biaya darurat, tipping vendor',
    is_active: true,
    sort_order: 7,
  },
];

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  package_id: '',
  pricing_method: 'margin',
  target_percentage: 25, // default 25% margin
  discount_type: 'none',
  discount_value: 0,
  tax_mode: 'none',
  tax_percentage: 0,
  service_fee: 0,
  rounding_increment: 5000, // pembulatan ke Rp5.000 terdekat
  contingency_percentage: 5, // 5% cadangan biaya tak terduga
  contingency_basis: 'total_base_cost',
  notes: 'Estimasi standar travel operasional IDR',
};

export const CALCULATION_BASIS_LABELS: Record<string, string> = {
  per_package: 'Per Paket (Tetap)',
  per_participant: 'Per Peserta (Variabel)',
  per_crew: 'Per Kru',
  per_vehicle: 'Per Kendaraan (Kapasitas)',
  per_room: 'Per Kamar (Hotel)',
  per_room_night: 'Per Kamar/Malam',
  per_day: 'Per Hari',
  per_portion: 'Per Porsi (Konsumsi)',
  per_ticket: 'Per Tiket',
  manual: 'Kuantitas Manual',
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600 bg-slate-100' },
  pending_approval: { label: 'Menunggu Persetujuan', color: 'text-amber-700 bg-amber-50 border border-amber-200' },
  approved: { label: 'Disetujui', color: 'text-blue-700 bg-blue-50 border border-blue-200' },
  final: { label: 'Final', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  archived: { label: 'Arsip', color: 'text-slate-500 bg-slate-100 border border-slate-200' },
};
