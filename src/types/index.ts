export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type TripType = 'open_trip' | 'private_trip';

export type PackageStatus = 'draft' | 'pending_approval' | 'approved' | 'final' | 'archived';

export type CostCalculationBasis =
  | 'per_package'      // Biaya tetap per paket (misal perizinan, banner, honor TL)
  | 'per_participant'  // Biaya variabel per pax (tiket, asuransi, konsumsi)
  | 'per_crew'         // Biaya variabel per kru (konsumsi kru, uang saku kru)
  | 'per_vehicle'      // Biaya per unit kendaraan dengan kapasitas
  | 'per_room'         // Biaya per kamar (twin share / default 2 pax)
  | 'per_room_night'   // Biaya per kamar per malam
  | 'per_day'          // Biaya harian
  | 'per_portion'      // Biaya per porsi
  | 'per_ticket'       // Biaya per tiket
  | 'manual';          // Kuantitas manual kustom

export type CostType = 'fixed' | 'variable_participant' | 'variable_crew' | 'capacity_based';

export interface CostCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface CostItem {
  id: string;
  package_id?: string;
  template_id?: string;
  category_id: string;
  item_name: string;
  cost_type: CostType;
  quantity: number;
  unit: string;
  unit_price: number;
  frequency: number;
  calculation_basis: CostCalculationBasis;
  capacity_per_unit?: number; // misal HiAce: 14 pax, Kamar Hotel: 2 pax
  is_contingency_eligible: boolean; // apakah masuk basis cadangan tak terduga
  is_included_elsewhere: boolean;   // apakah sudah termasuk di vendor lain
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type PricingMethod = 'margin' | 'markup';
export type RoundingIncrement = 0 | 1000 | 5000 | 10000 | 50000;
export type ContingencyBasis = 'total_base_cost' | 'selected_categories_only';

export interface PricingSettings {
  id?: string;
  package_id: string;
  pricing_method: PricingMethod;
  target_percentage: number;       // misal 25 untuk 25%
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;          // misal 5% atau Rp 50.000
  tax_mode: 'none' | 'inclusive' | 'exclusive'; // diteruskan ke pelanggan vs biaya
  tax_percentage: number;          // misal 1.1% atau 11%
  service_fee: number;             // biaya layanan travel opsional
  rounding_increment: RoundingIncrement;
  manual_selling_price?: number;   // opsional override harga jual
  minimum_selling_price?: number;  // batas bawah harga jual
  contingency_percentage: number;  // cadangan biaya tak terduga misal 3% atau 5%
  contingency_basis: ContingencyBasis;
  notes?: string;
}

export interface TourPackage {
  id: string;
  package_code: string;
  name: string;
  destination: string;
  trip_type: TripType;
  departure_date: string;
  return_date: string;
  duration_days: number;
  duration_nights: number;
  minimum_participants: number;
  target_participants: number;
  maximum_participants: number;
  crew_count: number;
  person_in_charge: string;
  notes?: string;
  status: PackageStatus;
  created_by: string;
  created_by_name?: string;
  updated_by: string;
  updated_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  cost_items: CostItem[];
  pricing_settings: PricingSettings;
}

export interface TourScenario {
  id: string;
  package_id: string;
  scenario_name: string;
  participant_count: number;
  crew_count: number;
  total_fixed_cost: number;
  total_variable_cost: number;
  total_additional_cost: number;
  contingency_cost: number;
  total_hpp: number;
  hpp_per_participant: number;
  selling_price_per_pax: number;
  selling_price_per_group?: number;
  total_revenue: number;
  estimated_profit: number;
  actual_margin: number;
  is_below_minimum: boolean;
  is_loss: boolean;
  is_target_met: boolean;
  assumptions?: Record<string, any>;
}

export interface CostTemplate {
  id: string;
  template_name: string;
  trip_type: TripType;
  destination: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: CostItem[];
}

export interface PackageApproval {
  id: string;
  package_id: string;
  package_code: string;
  package_name: string;
  submitted_by: string;
  submitted_by_name: string;
  submitted_at: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  package_id?: string;
  package_code?: string;
  action:
    | 'CREATE_PACKAGE'
    | 'UPDATE_PACKAGE'
    | 'UPDATE_COSTS'
    | 'UPDATE_PRICING'
    | 'SUBMIT_APPROVAL'
    | 'APPROVE_PACKAGE'
    | 'REJECT_PACKAGE'
    | 'FINALIZE_PACKAGE'
    | 'ARCHIVE_PACKAGE'
    | 'DUPLICATE_PACKAGE'
    | 'DELETE_PACKAGE'
    | 'CREATE_TEMPLATE'
    | 'UPDATE_TEMPLATE'
    | 'CHANGE_USER_ROLE'
    | 'TOGGLE_USER_STATUS';
  entity_type: 'package' | 'cost_item' | 'pricing' | 'approval' | 'template' | 'user';
  entity_id: string;
  old_values?: any;
  new_values?: any;
  description: string;
  created_at: string;
}

export interface HppCalculationResult {
  participantCount: number;
  crewCount: number;
  totalBaseCost: number;
  fixedCostTotal: number;
  variableParticipantCostTotal: number;
  variableCrewCostTotal: number;
  capacityCostTotal: number;
  contingencyCost: number;
  totalHpp: number;
  hppPerParticipant: number;
  baseSellingPrice: number;
  discountAmount: number;
  netSellingPricePerPax: number;
  sellingPriceGroup?: number;
  totalRevenue: number;
  estimatedProfit: number;
  actualMarginPercentage: number;
  actualMarkupPercentage: number;
  costBreakdownByCategory: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    percentageOfTotal: number;
  }[];
  validationErrors: string[];
  warnings: string[];
}

export interface AppBranding {
  appName: string;
  tagline: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  logoUrl?: string; // custom image url or data URL base64
  logoText?: string; // 2-letter abbreviation for monogram logo
  themeColor?: string;
}
