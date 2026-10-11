import * as XLSX from 'xlsx';
import { TourPackage, HppCalculationResult, TourScenario } from '../types';
import { calculateHpp, generateScenarios } from './hppEngine';
import { DEFAULT_COST_CATEGORIES } from './constants';

export function exportPackageToExcel(pkg: TourPackage) {
  const result = calculateHpp(pkg.cost_items, pkg.pricing_settings, {
    participantCount: pkg.target_participants,
    crewCount: pkg.crew_count,
    durationDays: pkg.duration_days,
    durationNights: pkg.duration_nights,
  });

  const tiers = [5, 10, 15, 20, 25, 30];
  const scenarios = generateScenarios(
    pkg.id,
    pkg.cost_items,
    pkg.pricing_settings,
    tiers,
    pkg.crew_count,
    pkg.minimum_participants,
    pkg.duration_days,
    pkg.duration_nights,
    pkg.trip_type === 'private_trip'
  );

  // Workbook baru
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan HPP
  const summaryData = [
    ['TOURCOST - LAPORAN HPP & HARGA PAKET TOUR'],
    ['Waktu Ekspor', new Date().toLocaleString('id-ID')],
    [''],
    ['INFORMASI PAKET'],
    ['Kode Paket', pkg.package_code],
    ['Nama Paket', pkg.name],
    ['Destinasi', pkg.destination],
    ['Jenis Trip', pkg.trip_type === 'open_trip' ? 'Open Trip' : 'Private Trip'],
    ['Durasi', `${pkg.duration_days} Hari ${pkg.duration_nights} Malam`],
    ['Keberangkatan', pkg.departure_date],
    ['Kepulangan', pkg.return_date],
    ['Jumlah Peserta Target', `${pkg.target_participants} Orang`],
    ['Minimum Peserta', `${pkg.minimum_participants} Orang`],
    ['Maksimum Peserta', `${pkg.maximum_participants} Orang`],
    ['Jumlah Kru', `${pkg.crew_count} Orang`],
    ['PIC (Person in Charge)', pkg.person_in_charge],
    ['Status Paket', pkg.status.toUpperCase()],
    [''],
    ['STRUKTUR BIAYA & HPP'],
    ['Biaya Tetap (Fixed Cost)', result.fixedCostTotal],
    ['Biaya Variabel Peserta', result.variableParticipantCostTotal],
    ['Biaya Variabel Kru', result.variableCrewCostTotal],
    ['Biaya Kapasitas / Kendaraan / Kamar', result.capacityCostTotal],
    ['Cadangan Biaya Tak Terduga (Contingency)', result.contingencyCost],
    ['TOTAL HPP PAKET', result.totalHpp],
    ['HPP PER PESERTA PEMBAYAR', result.hppPerParticipant],
    [''],
    ['PENGATURAN HARGA & ESTIMASI KEUNTUNGAN'],
    ['Metode Penetapan', pkg.pricing_settings.pricing_method.toUpperCase()],
    ['Target Margin / Markup (%)', `${pkg.pricing_settings.target_percentage}%`],
    ['Harga Jual per Peserta', result.netSellingPricePerPax],
    [pkg.trip_type === 'private_trip' ? 'Harga Jual Total Rombongan' : 'Total Estimasi Pendapatan', result.totalRevenue],
    ['Estimasi Keuntungan Bersih', result.estimatedProfit],
    ['Margin Keuntungan Aktual (%)', `${result.actualMarginPercentage.toFixed(2)}%`],
    ['Markup Aktual (%)', `${result.actualMarkupPercentage.toFixed(2)}%`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan HPP');

  // 2. Sheet Rincian Biaya
  const costRows = [
    [
      'Kategori',
      'Nama Item Biaya',
      'Jenis Biaya',
      'Kuantitas',
      'Satuan',
      'Harga Satuan (IDR)',
      'Frekuensi',
      'Dasar Kalkulasi',
      'Kapasitas Unit',
      'Cadangan?',
      'Sudah Termasuk?',
      'Subtotal Target Pax (IDR)',
      'Catatan / Vendor',
    ],
  ];

  pkg.cost_items.forEach((item) => {
    const cat = DEFAULT_COST_CATEGORIES.find((c) => c.id === item.category_id);
    const effectiveSubtotal = item.is_included_elsewhere
      ? 0
      : (item.quantity || 1) * (item.unit_price || 0) * (item.frequency || 1);

    costRows.push([
      cat?.name || item.category_id,
      item.item_name,
      item.cost_type,
      item.quantity as any,
      item.unit,
      item.unit_price as any,
      item.frequency as any,
      item.calculation_basis,
      (item.capacity_per_unit || '-') as any,
      item.is_contingency_eligible ? 'Ya' : 'Tidak',
      item.is_included_elsewhere ? 'Ya' : 'Tidak',
      effectiveSubtotal as any,
      item.notes || '',
    ]);
  });

  const wsCosts = XLSX.utils.aoa_to_sheet(costRows);
  XLSX.utils.book_append_sheet(wb, wsCosts, 'Rincian Biaya');

  // 3. Sheet Simulasi Skenario
  const scenarioRows = [
    [
      'Jumlah Peserta',
      'Jumlah Kru',
      'Biaya Tetap',
      'Biaya Variabel',
      'Cadangan Biaya',
      'Total HPP',
      'HPP / Peserta',
      'Harga Jual / Peserta',
      'Harga Rombongan',
      'Total Pendapatan',
      'Estimasi Laba',
      'Margin Aktual (%)',
      'Status Kelayakan',
    ],
  ];

  scenarios.forEach((s) => {
    let status = 'Memenuhi Target';
    if (s.is_loss) status = 'RUGI / Defisit';
    else if (s.is_below_minimum) status = 'Di Bawah Min. Peserta';
    else if (!s.is_target_met) status = 'Di Bawah Target Margin';

    scenarioRows.push([
      s.participant_count as any,
      s.crew_count as any,
      s.total_fixed_cost as any,
      s.total_variable_cost as any,
      s.contingency_cost as any,
      s.total_hpp as any,
      s.hpp_per_participant as any,
      s.selling_price_per_pax as any,
      (s.selling_price_per_group || 0) as any,
      s.total_revenue as any,
      s.estimated_profit as any,
      `${s.actual_margin.toFixed(2)}%`,
      status,
    ]);
  });

  const wsScenarios = XLSX.utils.aoa_to_sheet(scenarioRows);
  XLSX.utils.book_append_sheet(wb, wsScenarios, 'Simulasi Peserta');

  // Unduh File
  const filename = `${pkg.package_code}_HPP_Simulasi_${pkg.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
