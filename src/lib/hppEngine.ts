import { CostItem, PricingSettings, HppCalculationResult, TourScenario } from '../types';
import { DEFAULT_COST_CATEGORIES } from './constants';

export interface CalculationOptions {
  participantCount: number;
  crewCount: number;
  durationDays?: number;
  durationNights?: number;
  overrideSellingPrice?: number;
}

/**
 * Menghitung subtotal untuk sebuah item biaya berdasarkan jenis kalkulasi dan parameter trip
 */
export function calculateItemSubtotal(
  item: CostItem,
  pax: number,
  crew: number,
  days: number = 1,
  nights: number = 0
): { subtotal: number; effectiveQuantity: number } {
  if (item.is_included_elsewhere) {
    return { subtotal: 0, effectiveQuantity: 0 };
  }

  const basePrice = Math.max(0, item.unit_price || 0);
  const qty = Math.max(0, item.quantity || 1);
  const freq = Math.max(1, item.frequency || 1);

  let effectiveQty = qty;

  switch (item.calculation_basis) {
    case 'per_package':
      // Biaya tetap per paket, tidak tergantung jumlah peserta
      effectiveQty = qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };

    case 'per_participant':
    case 'per_ticket':
      // Biaya variabel langsung proporsional dengan jumlah peserta
      effectiveQty = pax * qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };

    case 'per_crew':
      // Biaya variabel khusus kru (misal konsumsi, uang saku kru)
      effectiveQty = crew * qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };

    case 'per_portion':
      // Konsumsi porsi: pax * frekuensi makan (jika freq diatur terpisah)
      effectiveQty = pax * qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };

    case 'per_vehicle': {
      // Biaya per unit kendaraan dengan kapasitas (contoh: HiAce 14 pax, Bus 30 pax)
      const capacity = Math.max(1, item.capacity_per_unit || 14);
      const totalPeople = pax + (item.cost_type === 'capacity_based' ? crew : 0);
      const neededVehicles = Math.ceil(totalPeople / capacity);
      effectiveQty = Math.max(qty, neededVehicles);
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };
    }

    case 'per_room':
    case 'per_room_night': {
      // Biaya kamar hotel: default 2 pax twin share
      const capacity = Math.max(1, item.capacity_per_unit || 2);
      const roomsForPax = Math.ceil(pax / capacity);
      const effectiveNights = nights > 0 ? nights : freq;
      effectiveQty = roomsForPax * qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * effectiveNights,
      };
    }

    case 'per_day':
      effectiveQty = (days > 0 ? days : 1) * qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };

    case 'manual':
    default:
      effectiveQty = qty;
      return {
        effectiveQuantity: effectiveQty,
        subtotal: effectiveQty * basePrice * freq,
      };
  }
}

/**
 * Mesin kalkulasi HPP dan Pricing terpusat
 */
export function calculateHpp(
  costItems: CostItem[],
  pricing: PricingSettings,
  options: CalculationOptions
): HppCalculationResult {
  const { participantCount, crewCount, durationDays = 1, durationNights = 0, overrideSellingPrice } = options;
  const validationErrors: string[] = [];
  const warnings: string[] = [];

  if (participantCount <= 0) {
    validationErrors.push('Jumlah peserta pembayar harus lebih besar dari 0.');
  }

  let fixedCostTotal = 0;
  let variableParticipantCostTotal = 0;
  let variableCrewCostTotal = 0;
  let capacityCostTotal = 0;
  let contingencyEligibleTotal = 0;

  const categoryTotals: Record<string, number> = {};

  costItems.forEach((item) => {
    const { subtotal } = calculateItemSubtotal(item, participantCount, crewCount, durationDays, durationNights);

    if (item.calculation_basis === 'per_package') {
      fixedCostTotal += subtotal;
    } else if (item.calculation_basis === 'per_crew') {
      variableCrewCostTotal += subtotal;
    } else if (item.calculation_basis === 'per_vehicle' || item.calculation_basis === 'per_room' || item.calculation_basis === 'per_room_night') {
      capacityCostTotal += subtotal;
    } else {
      variableParticipantCostTotal += subtotal;
    }

    if (item.is_contingency_eligible) {
      contingencyEligibleTotal += subtotal;
    }

    categoryTotals[item.category_id] = (categoryTotals[item.category_id] || 0) + subtotal;
  });

  const totalBaseCost = fixedCostTotal + variableParticipantCostTotal + variableCrewCostTotal + capacityCostTotal;

  // Kalkulasi Cadangan Tak Terduga (Contingency)
  const contingencyPercentage = Math.max(0, pricing.contingency_percentage || 0);
  let contingencyCost = 0;
  if (contingencyPercentage > 0) {
    const basisAmount =
      pricing.contingency_basis === 'selected_categories_only'
        ? contingencyEligibleTotal
        : totalBaseCost;
    contingencyCost = (basisAmount * contingencyPercentage) / 100;
  }

  const totalHpp = totalBaseCost + contingencyCost;
  const hppPerParticipant = participantCount > 0 ? totalHpp / participantCount : 0;

  // Kalkulasi Harga Jual
  let rawSellingPricePerPax = 0;
  const targetPct = pricing.target_percentage || 0;

  if (overrideSellingPrice !== undefined && overrideSellingPrice > 0) {
    rawSellingPricePerPax = overrideSellingPrice;
  } else if (pricing.manual_selling_price && pricing.manual_selling_price > 0) {
    rawSellingPricePerPax = pricing.manual_selling_price;
  } else {
    if (pricing.pricing_method === 'margin') {
      // Margin: HPP / (1 - margin%)
      if (targetPct >= 100) {
        validationErrors.push('Target margin tidak boleh >= 100%.');
        rawSellingPricePerPax = hppPerParticipant * 2;
      } else if (targetPct < 0) {
        validationErrors.push('Target margin tidak boleh bernilai negatif.');
        rawSellingPricePerPax = hppPerParticipant;
      } else {
        const marginFactor = 1 - targetPct / 100;
        rawSellingPricePerPax = marginFactor > 0 ? hppPerParticipant / marginFactor : hppPerParticipant;
      }
    } else {
      // Markup: HPP * (1 + markup%)
      if (targetPct < 0) {
        validationErrors.push('Target markup tidak boleh bernilai negatif.');
        rawSellingPricePerPax = hppPerParticipant;
      } else {
        rawSellingPricePerPax = hppPerParticipant * (1 + targetPct / 100);
      }
    }
  }

  // Pembulatan Harga
  let baseSellingPrice = rawSellingPricePerPax;
  const rounding = pricing.rounding_increment || 0;
  if (rounding > 0 && baseSellingPrice > 0) {
    baseSellingPrice = Math.round(baseSellingPrice / rounding) * rounding;
  }

  // Diskon
  let discountAmount = 0;
  if (pricing.discount_type === 'percentage') {
    discountAmount = (baseSellingPrice * Math.max(0, pricing.discount_value)) / 100;
  } else if (pricing.discount_type === 'fixed') {
    discountAmount = Math.max(0, pricing.discount_value);
  }

  const netSellingPricePerPax = Math.max(0, baseSellingPrice - discountAmount);
  const totalRevenue = netSellingPricePerPax * Math.max(0, participantCount);
  const estimatedProfit = totalRevenue - totalHpp;

  const actualMarginPercentage = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;
  const actualMarkupPercentage = totalHpp > 0 ? (estimatedProfit / totalHpp) * 100 : 0;

  // Validasi & Peringatan
  if (estimatedProfit < 0) {
    warnings.push(`Peringatan: Harga jual menghasilkan estimasi kerugian sebesar Rp${Math.abs(estimatedProfit).toLocaleString('id-ID')}.`);
  } else if (pricing.pricing_method === 'margin' && actualMarginPercentage < targetPct - 0.5) {
    warnings.push(`Margin aktual (${actualMarginPercentage.toFixed(1)}%) berada di bawah target (${targetPct}%).`);
  }

  if (pricing.minimum_selling_price && netSellingPricePerPax < pricing.minimum_selling_price) {
    warnings.push(`Harga jual berada di bawah batas minimum Rp${pricing.minimum_selling_price.toLocaleString('id-ID')}.`);
  }

  // Breakdown per Kategori
  const costBreakdownByCategory = DEFAULT_COST_CATEGORIES.map((cat) => {
    const amount = categoryTotals[cat.id] || 0;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalAmount: amount,
      percentageOfTotal: totalBaseCost > 0 ? (amount / totalBaseCost) * 100 : 0,
    };
  });

  return {
    participantCount,
    crewCount,
    totalBaseCost,
    fixedCostTotal,
    variableParticipantCostTotal,
    variableCrewCostTotal,
    capacityCostTotal,
    contingencyCost,
    totalHpp,
    hppPerParticipant,
    baseSellingPrice,
    discountAmount,
    netSellingPricePerPax,
    sellingPriceGroup: netSellingPricePerPax * participantCount,
    totalRevenue,
    estimatedProfit,
    actualMarginPercentage,
    actualMarkupPercentage,
    costBreakdownByCategory,
    validationErrors,
    warnings,
  };
}

/**
 * Menghasilkan skenario simulasi untuk variasi jumlah peserta (Open Trip / Private Trip)
 */
export function generateScenarios(
  packageId: string,
  costItems: CostItem[],
  pricing: PricingSettings,
  participantTiers: number[],
  crewCount: number,
  minimumParticipants: number,
  durationDays: number = 1,
  durationNights: number = 0,
  isPrivateTrip: boolean = false
): TourScenario[] {
  return participantTiers.map((pax) => {
    const result = calculateHpp(costItems, pricing, {
      participantCount: pax,
      crewCount,
      durationDays,
      durationNights,
    });

    const isBelowMinimum = pax < minimumParticipants;
    const isLoss = result.estimatedProfit < 0;
    const isTargetMet = !isLoss && result.actualMarginPercentage >= (pricing.target_percentage || 0) - 0.5;

    return {
      id: `scen-${packageId}-${pax}`,
      package_id: packageId,
      scenario_name: `${pax} Peserta`,
      participant_count: pax,
      crew_count: crewCount,
      total_fixed_cost: result.fixedCostTotal,
      total_variable_cost: result.variableParticipantCostTotal + result.variableCrewCostTotal + result.capacityCostTotal,
      total_additional_cost: result.contingencyCost,
      contingency_cost: result.contingencyCost,
      total_hpp: result.totalHpp,
      hpp_per_participant: result.hppPerParticipant,
      selling_price_per_pax: result.netSellingPricePerPax,
      selling_price_per_group: result.netSellingPricePerPax * pax,
      total_revenue: result.totalRevenue,
      estimated_profit: result.estimatedProfit,
      actual_margin: result.actualMarginPercentage,
      is_below_minimum: isBelowMinimum,
      is_loss: isLoss,
      is_target_met: isTargetMet,
      assumptions: {
        method: pricing.pricing_method,
        targetPercentage: pricing.target_percentage,
        isPrivateTrip,
      },
    };
  });
}
