-- ==============================================================================
-- TOURCOST — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Sistem Manajemen HPP Paket Tour Wisata Travel Agent Indonesia
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'viewer');
CREATE TYPE trip_type AS ENUM ('open_trip', 'private_trip');
CREATE TYPE package_status AS ENUM ('draft', 'pending_approval', 'approved', 'final', 'archived');
CREATE TYPE pricing_method AS ENUM ('margin', 'markup');
CREATE TYPE discount_type AS ENUM ('none', 'percentage', 'fixed');
CREATE TYPE tax_mode AS ENUM ('none', 'inclusive', 'exclusive');
CREATE TYPE cost_type AS ENUM ('fixed', 'variable_participant', 'variable_crew', 'capacity_based');
CREATE TYPE cost_calculation_basis AS ENUM (
  'per_package',
  'per_participant',
  'per_crew',
  'per_vehicle',
  'per_room',
  'per_room_night',
  'per_day',
  'per_portion',
  'per_ticket',
  'manual'
);

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. COST CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.cost_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TOUR PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.tour_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_type trip_type NOT NULL DEFAULT 'open_trip',
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  duration_days INT NOT NULL CHECK (duration_days >= 1),
  duration_nights INT NOT NULL DEFAULT 0 CHECK (duration_nights >= 0),
  minimum_participants INT NOT NULL CHECK (minimum_participants > 0),
  target_participants INT NOT NULL CHECK (target_participants >= minimum_participants),
  maximum_participants INT NOT NULL CHECK (maximum_participants >= target_participants),
  crew_count INT NOT NULL DEFAULT 1 CHECK (crew_count >= 0),
  person_in_charge TEXT NOT NULL,
  notes TEXT,
  status package_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_package_dates CHECK (return_date >= departure_date)
);

-- 6. COST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  template_id UUID, -- Optional foreign key jika template item
  category_id TEXT REFERENCES public.cost_categories(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  cost_type cost_type NOT NULL DEFAULT 'fixed',
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  frequency NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (frequency >= 1),
  calculation_basis cost_calculation_basis NOT NULL DEFAULT 'per_package',
  capacity_per_unit NUMERIC(10, 2),
  is_contingency_eligible BOOLEAN NOT NULL DEFAULT true,
  is_included_elsewhere BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PRICING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID UNIQUE REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  pricing_method pricing_method NOT NULL DEFAULT 'margin',
  target_percentage NUMERIC(6, 2) NOT NULL DEFAULT 25.00 CHECK (target_percentage >= 0),
  discount_type discount_type NOT NULL DEFAULT 'none',
  discount_value NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  tax_mode tax_mode NOT NULL DEFAULT 'none',
  tax_percentage NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0),
  service_fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  rounding_increment INT NOT NULL DEFAULT 5000,
  manual_selling_price NUMERIC(14, 2),
  minimum_selling_price NUMERIC(14, 2),
  contingency_percentage NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
  contingency_basis TEXT NOT NULL DEFAULT 'total_base_cost',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TOUR SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS public.tour_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  participant_count INT NOT NULL,
  crew_count INT NOT NULL,
  total_fixed_cost NUMERIC(14, 2) NOT NULL,
  total_variable_cost NUMERIC(14, 2) NOT NULL,
  total_additional_cost NUMERIC(14, 2) NOT NULL,
  total_hpp NUMERIC(14, 2) NOT NULL,
  hpp_per_participant NUMERIC(14, 2) NOT NULL,
  selling_price NUMERIC(14, 2) NOT NULL,
  total_revenue NUMERIC(14, 2) NOT NULL,
  estimated_profit NUMERIC(14, 2) NOT NULL,
  actual_margin NUMERIC(6, 2) NOT NULL,
  assumptions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. COST TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.cost_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  trip_type trip_type NOT NULL DEFAULT 'open_trip',
  destination TEXT NOT NULL,
  description TEXT,
  duration_days INT NOT NULL DEFAULT 1,
  duration_nights INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. PACKAGE APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.package_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES public.tour_packages(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  package_id UUID,
  package_code TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. INDEXES UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.tour_packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON public.tour_packages(destination);
CREATE INDEX IF NOT EXISTS idx_packages_departure ON public.tour_packages(departure_date);
CREATE INDEX IF NOT EXISTS idx_cost_items_package ON public.cost_items(package_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_category ON public.cost_items(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_package ON public.audit_logs(package_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 13. SEED DEFAULT COST CATEGORIES
INSERT INTO public.cost_categories (id, name, description, is_active, sort_order)
VALUES
  ('cat-transport', 'Transportasi', 'Sewa bus, mobil, BBM, tol, parkir, tiket pesawat/kereta, driver', true, 1),
  ('cat-accommodation', 'Akomodasi', 'Hotel, guest house, homestay, kamar peserta, kamar kru', true, 2),
  ('cat-consumption', 'Konsumsi', 'Makan peserta, snack, air mineral botol, konsumsi kru lapangan', true, 3),
  ('cat-tickets', 'Tiket & Aktivitas', 'Tiket masuk wisata, retribusi kawasan, wahana, outdoor sport, guide lokal', true, 4),
  ('cat-crew', 'SDM & Kru', 'Honor tour leader, guide resmi, fotografer, videografer, uang saku kru', true, 5),
  ('cat-operational', 'Operasional', 'Dokumentasi, banner, name tag, obat P3K, perlengkapan, perizinan', true, 6),
  ('cat-additional', 'Biaya Tambahan & Cadangan', 'Cadangan biaya tak terduga (contingency), biaya darurat, tipping vendor', true, 7)
ON CONFLICT (id) DO NOTHING;

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Semua user login bisa melihat profil; Super admin bisa update role
CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'super_admin');

-- Tour Packages: Viewer hanya SELECT, Admin & Super Admin bisa INSERT/UPDATE/DELETE
CREATE POLICY "Packages viewable by all authenticated users"
  ON public.tour_packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Packages mutable by admin and super_admin"
  ON public.tour_packages FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.current_user_role() IN ('admin', 'super_admin'));

-- Cost Items, Pricing Settings, Scenarios, Approvals inherit package access
CREATE POLICY "Cost items viewable by all" ON public.cost_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cost items mutable by admin" ON public.cost_items FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Pricing viewable by all" ON public.pricing_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pricing mutable by admin" ON public.pricing_settings FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Audit logs readable by all" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Audit logs appendable" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
