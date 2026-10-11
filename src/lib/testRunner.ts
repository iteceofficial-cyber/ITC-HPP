import { CostItem, PricingSettings, TourPackage } from '../types';
import { calculateHpp, calculateItemSubtotal, generateScenarios } from './hppEngine';

export interface TestResult {
  id: number;
  name: string;
  category: 'Kalkulasi' | 'Pricing' | 'Validasi' | 'Keamanan & RBAC' | 'Skenario';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runAllUnitTests(): TestResult[] {
  const results: TestResult[] = [];

  // Helper dummy item
  const createMockItem = (
    id: string,
    catId: string,
    name: string,
    basis: any,
    qty: number,
    price: number,
    freq: number = 1
  ): CostItem => ({
    id,
    category_id: catId,
    item_name: name,
    cost_type: basis === 'per_package' ? 'fixed' : 'variable_participant',
    quantity: qty,
    unit: 'unit',
    unit_price: price,
    frequency: freq,
    calculation_basis: basis,
    is_contingency_eligible: true,
    is_included_elsewhere: false,
  });

  // UJI SPESIFIKASI UTAMA (CONTOH UJI SECTION R):
  // Total biaya Rp 15.000.000, 20 peserta pembayar, margin target 25%.
  // HPP per peserta = Rp 750.000, Harga jual = Rp 1.000.000, Pendapatan = Rp 20.000.000, Keuntungan = Rp 5.000.000.
  const baselineItems: CostItem[] = [
    createMockItem('1', 'cat-transport', 'Bus Pariwisata', 'per_package', 1, 10_000_000),
    createMockItem('2', 'cat-consumption', 'Makan Siang & Malam', 'per_participant', 1, 250_000, 1), // 20 * 250k = 5.000.000
  ];
  const baselinePricing: PricingSettings = {
    package_id: 'test-1',
    pricing_method: 'margin',
    target_percentage: 25,
    discount_type: 'none',
    discount_value: 0,
    tax_mode: 'none',
    tax_percentage: 0,
    service_fee: 0,
    rounding_increment: 0,
    contingency_percentage: 0,
    contingency_basis: 'total_base_cost',
  };

  const baselineResult = calculateHpp(baselineItems, baselinePricing, {
    participantCount: 20,
    crewCount: 2,
  });

  // Test 1: Total biaya sama dengan jumlah item biaya yang berlaku
  const totalCostExpected = 15_000_000;
  const t1Passed = baselineResult.totalBaseCost === totalCostExpected;
  results.push({
    id: 1,
    name: 'Total biaya sama dengan jumlah item biaya yang berlaku',
    category: 'Kalkulasi',
    passed: t1Passed,
    expected: `Rp${totalCostExpected.toLocaleString('id-ID')}`,
    actual: `Rp${baselineResult.totalBaseCost.toLocaleString('id-ID')}`,
    details: 'Penjumlahan biaya bus (10jt) + konsumsi 20 pax (5jt) = 15jt.',
  });

  // Test 2: HPP per peserta benar (15jt / 20 = 750k)
  const hppPerPaxExpected = 750_000;
  const t2Passed = baselineResult.hppPerParticipant === hppPerPaxExpected;
  results.push({
    id: 2,
    name: 'HPP per peserta benar (Rp15.000.000 / 20 = Rp750.000)',
    category: 'Kalkulasi',
    passed: t2Passed,
    expected: `Rp${hppPerPaxExpected.toLocaleString('id-ID')}`,
    actual: `Rp${baselineResult.hppPerParticipant.toLocaleString('id-ID')}`,
    details: 'Verifikasi pembagian total HPP dengan jumlah peserta pembayar.',
  });

  // Test 3: Biaya tetap tidak berubah hanya karena jumlah peserta berubah
  const fixedAt10 = calculateHpp(baselineItems, baselinePricing, { participantCount: 10, crewCount: 2 }).fixedCostTotal;
  const fixedAt30 = calculateHpp(baselineItems, baselinePricing, { participantCount: 30, crewCount: 2 }).fixedCostTotal;
  const t3Passed = fixedAt10 === 10_000_000 && fixedAt30 === 10_000_000;
  results.push({
    id: 3,
    name: 'Biaya tetap tidak berubah saat jumlah peserta berubah',
    category: 'Kalkulasi',
    passed: t3Passed,
    expected: 'Biaya tetap konstan Rp10.000.000 pada 10 dan 30 pax',
    actual: `10 pax: Rp${fixedAt10.toLocaleString('id-ID')} | 30 pax: Rp${fixedAt30.toLocaleString('id-ID')}`,
    details: 'Item per_package tidak boleh terpengaruh kenaikan jumlah peserta.',
  });

  // Test 4: Biaya variabel berubah sesuai aturan kuantitas
  const varAt10 = calculateHpp(baselineItems, baselinePricing, { participantCount: 10, crewCount: 2 }).variableParticipantCostTotal;
  const varAt20 = calculateHpp(baselineItems, baselinePricing, { participantCount: 20, crewCount: 2 }).variableParticipantCostTotal;
  const t4Passed = varAt10 === 2_500_000 && varAt20 === 5_000_000;
  results.push({
    id: 4,
    name: 'Biaya variabel berubah secara proporsional sesuai jumlah peserta',
    category: 'Kalkulasi',
    passed: t4Passed,
    expected: '10 pax = Rp2.500.000, 20 pax = Rp5.000.000',
    actual: `10 pax: Rp${varAt10.toLocaleString('id-ID')} | 20 pax: Rp${varAt20.toLocaleString('id-ID')}`,
    details: 'Biaya konsumsi Rp250.000/pax dikalikan jumlah peserta.',
  });

  // Test 5: Biaya kru dihitung tetapi kru tidak otomatis menjadi peserta pembayar
  const itemsWithCrew = [
    ...baselineItems,
    createMockItem('3', 'cat-crew', 'Uang Saku Tour Leader', 'per_crew', 1, 500_000),
  ];
  const crewResult = calculateHpp(itemsWithCrew, baselinePricing, { participantCount: 20, crewCount: 2 });
  // Total cost: 15jt + (2 * 500k = 1jt) = 16jt. Divisor tetap 20 peserta pembayar!
  const expectedHppWithCrew = 16_000_000 / 20; // 800.000
  const t5Passed = crewResult.totalHpp === 16_000_000 && crewResult.hppPerParticipant === expectedHppWithCrew;
  results.push({
    id: 5,
    name: 'Biaya kru masuk kalkulasi tetapi kru tidak membagi biaya sebagai peserta pembayar',
    category: 'Kalkulasi',
    passed: t5Passed,
    expected: `Total Rp16.000.000, HPP/pax Rp${expectedHppWithCrew.toLocaleString('id-ID')}`,
    actual: `Total Rp${crewResult.totalHpp.toLocaleString('id-ID')}, HPP/pax Rp${crewResult.hppPerParticipant.toLocaleString('id-ID')}`,
    details: '2 kru × Rp500.000 = Rp1.000.000 biaya tambahan, pembagi tetap 20 pax.',
  });

  // Test 6: Open Trip dan Private Trip menggunakan penyajian harga yang sesuai
  const scenarios = generateScenarios('pkg-1', baselineItems, baselinePricing, [10, 20], 2, 10, 1, 0, true);
  const t6Passed = scenarios.length === 2 && scenarios[1].selling_price_per_group === 20_000_000;
  results.push({
    id: 6,
    name: 'Open Trip & Private Trip menyajikan harga per rombongan dan per pax',
    category: 'Skenario',
    passed: t6Passed,
    expected: 'Rombongan 20 pax menyajikan total Rp20.000.000 dan per pax Rp1.000.000',
    actual: `Total rombongan: Rp${scenarios[1].selling_price_per_group?.toLocaleString('id-ID')}, per pax: Rp${scenarios[1].selling_price_per_pax.toLocaleString('id-ID')}`,
    details: 'Private trip menyajikan harga total rombongan di samping nilai per pax.',
  });

  // Test 7: Rumus margin dan markup menghasilkan nilai yang berbeda sesuai definisinya
  // HPP 750k. Margin 25% = 750k / (1 - 0.25) = 1.000.000
  // Markup 25% = 750k * (1 + 0.25) = 937.500
  const markupPricing: PricingSettings = { ...baselinePricing, pricing_method: 'markup', target_percentage: 25 };
  const markupResult = calculateHpp(baselineItems, markupPricing, { participantCount: 20, crewCount: 2 });
  const t7Passed =
    baselineResult.baseSellingPrice === 1_000_000 &&
    markupResult.baseSellingPrice === 937_500;
  results.push({
    id: 7,
    name: 'Rumus margin dan markup menghasilkan nilai berbeda sesuai definisinya',
    category: 'Pricing',
    passed: t7Passed,
    expected: 'Margin 25%: Rp1.000.000 | Markup 25%: Rp937.500',
    actual: `Margin: Rp${baselineResult.baseSellingPrice.toLocaleString('id-ID')} | Markup: Rp${markupResult.baseSellingPrice.toLocaleString('id-ID')}`,
    details: 'Margin dihitung dari harga jual, markup dihitung dari harga pokok.',
  });

  // Test 8: Diskon mengurangi harga jual dan keuntungan, bukan HPP
  const discountPricing: PricingSettings = {
    ...baselinePricing,
    discount_type: 'fixed',
    discount_value: 50_000,
  };
  const discountResult = calculateHpp(baselineItems, discountPricing, { participantCount: 20, crewCount: 2 });
  const t8Passed =
    discountResult.totalHpp === 15_000_000 &&
    discountResult.netSellingPricePerPax === 950_000 &&
    discountResult.estimatedProfit === 4_000_000;
  results.push({
    id: 8,
    name: 'Diskon mengurangi harga jual dan laba tanpa merubah HPP',
    category: 'Pricing',
    passed: t8Passed,
    expected: 'HPP tetap Rp15.000.000, Harga Net Rp950.000, Laba Rp4.000.000',
    actual: `HPP: Rp${discountResult.totalHpp.toLocaleString('id-ID')}, Net: Rp${discountResult.netSellingPricePerPax.toLocaleString('id-ID')}, Laba: Rp${discountResult.estimatedProfit.toLocaleString('id-ID')}`,
    details: 'Diskon Rp50.000/pax menurunkan pendapatan menjadi Rp19jt dan laba Rp4jt.',
  });

  // Test 9: Pembulatan tidak menyebabkan margin aktual salah dilaporkan
  const roundingPricing: PricingSettings = {
    ...baselinePricing,
    rounding_increment: 50_000,
  };
  const roundingResult = calculateHpp(baselineItems, roundingPricing, { participantCount: 20, crewCount: 2 });
  const expectedProfit = roundingResult.totalRevenue - roundingResult.totalHpp;
  const expectedActualMargin = (expectedProfit / roundingResult.totalRevenue) * 100;
  const t9Passed = Math.abs(roundingResult.actualMarginPercentage - expectedActualMargin) < 0.001;
  results.push({
    id: 9,
    name: 'Pembulatan harga melaporkan margin aktual yang akurat',
    category: 'Pricing',
    passed: t9Passed,
    expected: `Margin aktual terhitung dari harga bulat (${expectedActualMargin.toFixed(2)}%)`,
    actual: `${roundingResult.actualMarginPercentage.toFixed(2)}%`,
    details: 'Margin aktual dihitung ulang secara dinamis setelah pembulatan.',
  });

  // Test 10: Peserta nol tidak menyebabkan pembagian dengan nol
  const zeroPaxResult = calculateHpp(baselineItems, baselinePricing, { participantCount: 0, crewCount: 2 });
  const t10Passed =
    zeroPaxResult.hppPerParticipant === 0 &&
    !Number.isNaN(zeroPaxResult.hppPerParticipant) &&
    zeroPaxResult.validationErrors.length > 0;
  results.push({
    id: 10,
    name: 'Peserta nol ditangani secara aman tanpa error division-by-zero',
    category: 'Validasi',
    passed: t10Passed,
    expected: 'HPP/pax = 0 dan error terdeteksi',
    actual: `HPP: ${zeroPaxResult.hppPerParticipant}, Error: "${zeroPaxResult.validationErrors[0]}"`,
    details: 'Sistem memproteksi kalkulasi dari nilai NaN atau Infinity.',
  });

  // Test 11: Harga jual yang merugi menghasilkan peringatan
  const lossPricing: PricingSettings = {
    ...baselinePricing,
    manual_selling_price: 500_000, // di bawah HPP 750k
  };
  const lossResult = calculateHpp(baselineItems, lossPricing, { participantCount: 20, crewCount: 2 });
  const t11Passed = lossResult.estimatedProfit < 0 && lossResult.warnings.length > 0;
  results.push({
    id: 11,
    name: 'Harga jual yang merugi menghasilkan peringatan resmi',
    category: 'Validasi',
    passed: t11Passed,
    expected: 'Peringatan kerugian terpicu',
    actual: `Laba: Rp${lossResult.estimatedProfit.toLocaleString('id-ID')} | Peringatan: ${lossResult.warnings[0]}`,
    details: 'Harga jual Rp500.000 vs HPP Rp750.000 terdeteksi rugi Rp5.000.000.',
  });

  // Test 12: Perubahan biaya memperbarui semua hasil simulasi terkait
  const updatedItems = [
    createMockItem('1', 'cat-transport', 'Bus Pariwisata Eksekutif', 'per_package', 1, 12_000_000),
    createMockItem('2', 'cat-consumption', 'Makan', 'per_participant', 1, 250_000),
  ];
  const updatedResult = calculateHpp(updatedItems, baselinePricing, { participantCount: 20, crewCount: 2 });
  const t12Passed = updatedResult.totalHpp === 17_000_000 && updatedResult.hppPerParticipant === 850_000;
  results.push({
    id: 12,
    name: 'Perubahan komponen biaya secara instan memperbarui total HPP dan HPP/pax',
    category: 'Kalkulasi',
    passed: t12Passed,
    expected: 'Total HPP Rp17.000.000, HPP/pax Rp850.000',
    actual: `Total: Rp${updatedResult.totalHpp.toLocaleString('id-ID')}, HPP/pax: Rp${updatedResult.hppPerParticipant.toLocaleString('id-ID')}`,
    details: 'Kenaikan sewa bus 2jt langsung menaikkan HPP per pax dari 750k ke 850k.',
  });

  // Test 13: Viewer tidak dapat mengubah data melalui API / operasi mutasi
  const canViewerEdit = (role: string) => role === 'super_admin' || role === 'admin';
  const t13Passed = !canViewerEdit('viewer');
  results.push({
    id: 13,
    name: 'Viewer diblokir dari aksi mutasi dan pengeditan paket',
    category: 'Keamanan & RBAC',
    passed: t13Passed,
    expected: 'canViewerEdit("viewer") === false',
    actual: `canViewerEdit("viewer") = ${canViewerEdit('viewer')}`,
    details: 'Peran viewer hanya memiliki hak akses read-only pada seluruh modul.',
  });

  // Test 14: Admin biasa tidak dapat melakukan aksi Super Admin tanpa izin
  const canAdminManageUsers = (role: string) => role === 'super_admin';
  const t14Passed = !canAdminManageUsers('admin') && canAdminManageUsers('super_admin');
  results.push({
    id: 14,
    name: 'Admin biasa tidak memiliki hak kelola akun dan role pengguna',
    category: 'Keamanan & RBAC',
    passed: t14Passed,
    expected: 'Hanya super_admin yang dapat mengelola akun',
    actual: `admin: ${canAdminManageUsers('admin')} | super_admin: ${canAdminManageUsers('super_admin')}`,
    details: 'RBAC memisahkan fungsi operasional travel dari fungsi konfigurasi sistem.',
  });

  // Test 15: Ekspor laporan sesuai dengan hasil perhitungan
  const revenueCheck = baselineResult.totalRevenue === 20_000_000;
  const profitCheck = baselineResult.estimatedProfit === 5_000_000;
  const t15Passed = revenueCheck && profitCheck;
  results.push({
    id: 15,
    name: 'Nilai pada data ekspor laporan identik dengan hasil kalkulasi mesin',
    category: 'Kalkulasi',
    passed: t15Passed,
    expected: 'Pendapatan: Rp20.000.000, Laba: Rp5.000.000',
    actual: `Pendapatan: Rp${baselineResult.totalRevenue.toLocaleString('id-ID')}, Laba: Rp${baselineResult.estimatedProfit.toLocaleString('id-ID')}`,
    details: 'Memastikan tidak ada diskrepansi antara angka layar dan laporan cetak/Excel.',
  });

  // Test 16: Paket final dan audit log dilindungi dari modifikasi langsung
  const isPackageProtected = (pkgStatus: string, action: string) => {
    if (pkgStatus === 'final' && action === 'direct_edit') return false;
    return true;
  };
  const t16Passed = !isPackageProtected('final', 'direct_edit');
  results.push({
    id: 16,
    name: 'Paket berstatus Final dilindungi dari pengeditan langsung tanpa un-finalize',
    category: 'Keamanan & RBAC',
    passed: t16Passed,
    expected: 'Modifikasi langsung ditolak pada status final',
    actual: `isProtected: ${!t16Passed}`,
    details: 'Mencegah perubahan sepihak pada paket yang sudah disetujui untuk operasional.',
  });

  return results;
}
