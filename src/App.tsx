import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PackageList } from './components/packages/PackageList';
import { PackageDetail } from './components/packages/PackageDetail';
import { PackageWizard } from './components/packages/PackageWizard';
import { SimulationWorkbench } from './components/simulation/SimulationWorkbench';
import { QuickCalculatorView } from './components/calculator/QuickCalculatorView';
import { CostTemplatesView } from './components/templates/CostTemplatesView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { AdminManagementView } from './components/admin/AdminManagementView';
import { AuditLogView } from './components/audit/AuditLogView';
import { TestRunnerView } from './components/testing/TestRunnerView';
import { SettingsView } from './components/settings/SettingsView';
import { ReportsView } from './components/reports/ReportsView';
import { LoginView } from './components/auth/LoginView';
import { BrandCustomizerModal } from './components/common/BrandCustomizerModal';
import { store } from './lib/store';
import { TourPackage, CostTemplate } from './types';

// Helper mapping Hash ke ActiveTab
function parseHash(hash: string): {
  tab: ActiveTab;
  pkgId?: string;
  isLogin?: boolean;
} {
  const clean = hash.replace(/^#\/?/, '').split('?')[0];
  const parts = clean.split('/');
  const main = parts[0] || 'dashboard';

  if (main === 'login') {
    return { tab: 'dashboard', isLogin: true };
  }
  if (main === 'packages') {
    return { tab: 'packages', pkgId: parts[1] };
  }
  if (main === 'create-package' || main === 'create_package') {
    return { tab: 'create_package' };
  }
  if (main === 'edit-package') {
    return { tab: 'create_package', pkgId: parts[1] };
  }
  if (main === 'calculator') {
    return { tab: 'calculator' };
  }
  if (main === 'simulation') {
    return { tab: 'simulation', pkgId: parts[1] };
  }
  if (main === 'templates') {
    return { tab: 'templates' };
  }
  if (main === 'reports') {
    return { tab: 'reports', pkgId: parts[1] };
  }
  if (main === 'approvals') {
    return { tab: 'approvals' };
  }
  if (main === 'admin-management' || main === 'admin_management') {
    return { tab: 'admin_management' };
  }
  if (main === 'audit-log' || main === 'audit_log') {
    return { tab: 'audit_log' };
  }
  if (main === 'testing') {
    return { tab: 'testing' };
  }
  if (main === 'settings') {
    return { tab: 'settings' };
  }
  return { tab: 'dashboard' };
}

function tabToHash(tab: ActiveTab, pkgId?: string): string {
  if (tab === 'packages') {
    return pkgId ? `#/packages/${pkgId}` : '#/packages';
  }
  if (tab === 'create_package') {
    return pkgId ? `#/edit-package/${pkgId}` : '#/create-package';
  }
  if (tab === 'simulation') {
    return pkgId ? `#/simulation/${pkgId}` : '#/simulation';
  }
  if (tab === 'admin_management') return '#/admin-management';
  if (tab === 'audit_log') return '#/audit-log';
  return `#/${tab}`;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(store.isAuthenticated());
  const [packages, setPackages] = useState<TourPackage[]>(store.getPackages());
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(null);
  const [editingPackage, setEditingPackage] = useState<TourPackage | null>(null);
  const [simulationTargetPkg, setSimulationTargetPkg] = useState<TourPackage | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);

  // Inisialisasi tab dari URL hash saat pertama kali dimuat
  const initialRoute = typeof window !== 'undefined' ? parseHash(window.location.hash) : { tab: 'dashboard' as ActiveTab };
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialRoute.tab);

  // Subscribe ke perubahan store (reactive update & data sync)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const updatedList = store.getPackages();
      setPackages(updatedList);
      setIsAuthenticated(store.isAuthenticated());

      if (selectedPackage) {
        const refreshed = updatedList.find((p) => p.id === selectedPackage.id);
        if (refreshed) setSelectedPackage(refreshed);
      }
    });
    return () => unsubscribe();
  }, [selectedPackage]);

  // Dengarkan perubahan URL Hash browser ("pindah link" aman, tidak hilang)
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseHash(window.location.hash);
      setActiveTab(route.tab);

      const allPkgs = store.getPackages();
      if (route.tab === 'packages' && route.pkgId) {
        const found = allPkgs.find((p) => p.id === route.pkgId);
        if (found) setSelectedPackage(found);
      } else if (route.tab === 'packages' && !route.pkgId) {
        setSelectedPackage(null);
      }

      if (route.tab === 'create_package' && route.pkgId) {
        const found = allPkgs.find((p) => p.id === route.pkgId);
        if (found) setEditingPackage(found);
      }

      if (route.tab === 'simulation' && route.pkgId) {
        const found = allPkgs.find((p) => p.id === route.pkgId);
        if (found) setSimulationTargetPkg(found);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Jalankan sekali saat mount jika ada ID di hash
    if (initialRoute.pkgId) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const pendingApprovalsCount = packages.filter((p) => p.status === 'pending_approval').length;

  // Handlers navigasi yang menjaga URL Hash tersinkron
  const handleSelectPackage = (pkg: TourPackage) => {
    setSelectedPackage(pkg);
    setEditingPackage(null);
    setActiveTab('packages');
    window.location.hash = tabToHash('packages', pkg.id);
  };

  const handleEditPackage = (pkg: TourPackage) => {
    setEditingPackage(pkg);
    setSelectedPackage(null);
    setActiveTab('create_package');
    window.location.hash = tabToHash('create_package', pkg.id);
  };

  const handleOpenCreateNew = () => {
    setEditingPackage(null);
    setSelectedPackage(null);
    setActiveTab('create_package');
    window.location.hash = tabToHash('create_package');
  };

  const handleOpenSimulation = (pkg: TourPackage) => {
    setSimulationTargetPkg(pkg);
    setActiveTab('simulation');
    window.location.hash = tabToHash('simulation', pkg.id);
  };

  const handlePackageSaved = (savedPkg: TourPackage) => {
    setSelectedPackage(savedPkg);
    setEditingPackage(null);
    setActiveTab('packages');
    window.location.hash = tabToHash('packages', savedPkg.id);
  };

  const handleApplyTemplate = (tmpl: CostTemplate) => {
    const dummyPackageFromTmpl: TourPackage = {
      id: `pkg-${Date.now()}`,
      package_code: `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: tmpl.template_name,
      destination: tmpl.destination,
      trip_type: tmpl.trip_type,
      departure_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      return_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      duration_days: tmpl.duration_days,
      duration_nights: tmpl.duration_nights,
      minimum_participants: 10,
      target_participants: 20,
      maximum_participants: 30,
      crew_count: 2,
      person_in_charge: store.getCurrentUser().full_name,
      status: 'draft',
      created_by: store.getCurrentUser().id,
      updated_by: store.getCurrentUser().id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cost_items: tmpl.items.map((it) => ({
        ...it,
        id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      })),
      pricing_settings: {
        package_id: '',
        pricing_method: 'margin',
        target_percentage: 25,
        discount_type: 'none',
        discount_value: 0,
        tax_mode: 'none',
        tax_percentage: 0,
        service_fee: 0,
        rounding_increment: 5000,
        contingency_percentage: 5,
        contingency_basis: 'total_base_cost',
      },
    };
    setEditingPackage(dummyPackageFromTmpl);
    setSelectedPackage(null);
    setActiveTab('create_package');
    window.location.hash = tabToHash('create_package');
  };

  const handleConvertCalculatorToPackage = (data: {
    fixedCost: number;
    variableCostPerPax: number;
    crewCost: number;
    pax: number;
    margin: number;
  }) => {
    const pkgFromCalc: TourPackage = {
      id: `pkg-${Date.now()}`,
      package_code: `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `Paket Tour Baru (${data.pax} Pax)`,
      destination: 'Indonesia',
      trip_type: 'open_trip',
      departure_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      return_date: new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0],
      duration_days: 3,
      duration_nights: 2,
      minimum_participants: Math.max(1, Math.round(data.pax * 0.7)),
      target_participants: data.pax,
      maximum_participants: Math.round(data.pax * 1.5),
      crew_count: 2,
      person_in_charge: store.getCurrentUser().full_name,
      status: 'draft',
      created_by: store.getCurrentUser().id,
      updated_by: store.getCurrentUser().id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cost_items: [
        {
          id: `ci-calc-1`,
          category_id: 'cat-transport',
          item_name: 'Komponen Biaya Tetap Operasional',
          cost_type: 'fixed',
          quantity: 1,
          unit: 'paket',
          unit_price: data.fixedCost,
          frequency: 1,
          calculation_basis: 'per_package',
          is_contingency_eligible: true,
          is_included_elsewhere: false,
        },
        {
          id: `ci-calc-2`,
          category_id: 'cat-consumption',
          item_name: 'Komponen Biaya Variabel per Pax',
          cost_type: 'variable_participant',
          quantity: 1,
          unit: 'pax',
          unit_price: data.variableCostPerPax,
          frequency: 1,
          calculation_basis: 'per_participant',
          is_contingency_eligible: true,
          is_included_elsewhere: false,
        },
        {
          id: `ci-calc-3`,
          category_id: 'cat-crew',
          item_name: 'Honor & Uang Saku Kru Lapangan',
          cost_type: 'fixed',
          quantity: 1,
          unit: 'kru',
          unit_price: data.crewCost,
          frequency: 1,
          calculation_basis: 'per_package',
          is_contingency_eligible: false,
          is_included_elsewhere: false,
        },
      ],
      pricing_settings: {
        package_id: '',
        pricing_method: 'margin',
        target_percentage: data.margin,
        discount_type: 'none',
        discount_value: 0,
        tax_mode: 'none',
        tax_percentage: 0,
        service_fee: 0,
        rounding_increment: 5000,
        contingency_percentage: 5,
        contingency_basis: 'total_base_cost',
      },
    };
    setEditingPackage(pkgFromCalc);
    setSelectedPackage(null);
    setActiveTab('create_package');
    window.location.hash = tabToHash('create_package');
  };

  // Navigasi tab utama
  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'packages') {
      setSelectedPackage(null);
    }
    if (tab !== 'create_package') {
      setEditingPackage(null);
    }
    window.location.hash = tabToHash(tab);
  };

  const handleLogout = () => {
    store.logout();
    setIsAuthenticated(false);
    window.location.hash = '#/login';
  };

  // Jika belum login, tampilkan layar Login
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Kiri */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenBrandModal={() => setShowBrandModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreatePackageClick={handleOpenCreateNew}
          onOpenSettingsClick={() => handleSelectTab('settings')}
          onOpenBrandModal={() => setShowBrandModal(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              packages={packages}
              onSelectPackage={handleSelectPackage}
              onOpenCreate={handleOpenCreateNew}
              onOpenSimulation={handleOpenSimulation}
            />
          )}

          {activeTab === 'packages' && (
            <>
              {selectedPackage ? (
                <PackageDetail
                  pkg={selectedPackage}
                  onBack={() => {
                    setSelectedPackage(null);
                    window.location.hash = '#/packages';
                  }}
                  onEdit={handleEditPackage}
                  onPackageUpdated={setSelectedPackage}
                />
              ) : (
                <PackageList
                  packages={packages}
                  onSelectPackage={handleSelectPackage}
                  onEditPackage={handleEditPackage}
                  onCreateNew={handleOpenCreateNew}
                  onOpenSimulation={handleOpenSimulation}
                />
              )}
            </>
          )}

          {activeTab === 'create_package' && (
            <PackageWizard
              initialPackage={editingPackage}
              onCancel={() => {
                setEditingPackage(null);
                handleSelectTab('packages');
              }}
              onSaved={handlePackageSaved}
            />
          )}

          {activeTab === 'calculator' && (
            <QuickCalculatorView onConvertToPackage={handleConvertCalculatorToPackage} />
          )}

          {activeTab === 'simulation' && (
            <SimulationWorkbench
              packages={packages}
              initialSelectedPackageId={simulationTargetPkg?.id}
            />
          )}

          {activeTab === 'templates' && (
            <CostTemplatesView onApplyTemplateToNewPackage={handleApplyTemplate} />
          )}

          {activeTab === 'reports' && (
            <ReportsView packages={packages} onSelectPackage={handleSelectPackage} />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              packages={packages}
              onSelectPackage={handleSelectPackage}
              onRefresh={() => setPackages(store.getPackages())}
            />
          )}

          {activeTab === 'admin_management' && <AdminManagementView />}

          {activeTab === 'audit_log' && <AuditLogView />}

          {activeTab === 'testing' && <TestRunnerView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modal Customizer Nama Web & Logo Tampilan */}
      <BrandCustomizerModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
      />
    </div>
  );
}
