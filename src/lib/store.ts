import {
  TourPackage,
  UserProfile,
  CostTemplate,
  AuditLog,
  UserRole,
  PackageStatus,
  CostItem,
  AppBranding,
} from '../types';
import { DEMO_PACKAGES, DEMO_PROFILES, DEMO_TEMPLATES, DEMO_AUDIT_LOGS } from './demoData';
import { supabase, isSupabaseConfigured } from './supabase';

export const DEFAULT_BRANDING: AppBranding = {
  appName: 'TourCost',
  tagline: 'HPP & Costing Travel Agent',
  companyName: 'PT TOURCOST NUSANTARA TRAVEL',
  companyAddress: 'Jl. Pariwisata Raya No. 88, Jakarta Selatan',
  companyContact: 'Telp: (021) 7890-1234 · Email: ops@tourcost.id',
  logoUrl: '',
  logoText: 'TC',
  themeColor: '#1d4ed8',
};

class TourCostStore {
  private packages: TourPackage[] = [];
  private templates: CostTemplate[] = [];
  private users: UserProfile[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: UserProfile;
  private branding: AppBranding = DEFAULT_BRANDING;
  private authenticated: boolean = true;
  private listeners: Set<() => void> = new Set();
  public isServerConnected: boolean = true;
  public lastSyncedAt: string = '';

  constructor() {
    // 1. Muat awal dari cache jika ada
    const savedPackages = typeof window !== 'undefined' ? localStorage.getItem('tourcost_packages_v1') : null;
    const savedTemplates = typeof window !== 'undefined' ? localStorage.getItem('tourcost_templates_v1') : null;
    const savedUsers = typeof window !== 'undefined' ? localStorage.getItem('tourcost_users_v1') : null;
    const savedLogs = typeof window !== 'undefined' ? localStorage.getItem('tourcost_logs_v1') : null;
    const savedCurrentUserId = typeof window !== 'undefined' ? localStorage.getItem('tourcost_active_user_id') : null;
    const savedBranding = typeof window !== 'undefined' ? localStorage.getItem('tourcost_branding_v1') : null;
    const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('tourcost_authenticated') : null;

    this.packages = savedPackages ? JSON.parse(savedPackages) : DEMO_PACKAGES;
    this.templates = savedTemplates ? JSON.parse(savedTemplates) : DEMO_TEMPLATES;
    this.users = savedUsers ? JSON.parse(savedUsers) : DEMO_PROFILES;
    this.auditLogs = savedLogs ? JSON.parse(savedLogs) : DEMO_AUDIT_LOGS;
    this.branding = savedBranding ? JSON.parse(savedBranding) : DEFAULT_BRANDING;
    this.authenticated = savedAuth ? savedAuth === 'true' : true;

    const matchedUser = this.users.find((u) => u.id === savedCurrentUserId);
    this.currentUser = matchedUser || this.users[0]; // Default Super Admin

    // 2. Muat otomatis dari backend server database agar data selalu terhubung antar link & device
    if (typeof window !== 'undefined') {
      this.initServerSync();

      // Dengarkan perubahan antar tab/link di browser
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('tourcost_')) {
          this.reloadFromLocalStorage();
        }
      });
    }
  }

  // Muat ulang dari localStorage jika ada perubahan antar tab/link
  public reloadFromLocalStorage() {
    try {
      const savedPackages = localStorage.getItem('tourcost_packages_v1');
      const savedBranding = localStorage.getItem('tourcost_branding_v1');
      const savedUsers = localStorage.getItem('tourcost_users_v1');
      if (savedPackages) this.packages = JSON.parse(savedPackages);
      if (savedBranding) this.branding = JSON.parse(savedBranding);
      if (savedUsers) this.users = JSON.parse(savedUsers);
      this.notify();
    } catch (e) {
      console.warn('Gagal memuat ulang dari local storage:', e);
    }
  }

  // Mengambil data terpusat dari Server Database (/api/data) & sinkronisasi dua arah
  public async initServerSync() {
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          let hasLocalOnlyChanges = false;

          // 1. Merge paket tour secara cerdas (tidak pernah menimpa paket baru lokal dengan paket lama server)
          if (Array.isArray(data.packages)) {
            const mergedMap = new Map<string, TourPackage>();
            // Masukkan data server dulu
            data.packages.forEach((sp: TourPackage) => mergedMap.set(sp.id, sp));

            // Periksa data lokal: jika belum ada di server atau lokal lebih baru, pertahankan data lokal!
            this.packages.forEach((lp) => {
              const sp = mergedMap.get(lp.id);
              if (!sp) {
                // Ada di lokal tapi belum ada di server -> pertahankan & tandai untuk dikirim ke server
                mergedMap.set(lp.id, lp);
                hasLocalOnlyChanges = true;
              } else {
                const localTime = new Date(lp.updated_at || lp.created_at || 0).getTime();
                const serverTime = new Date(sp.updated_at || sp.created_at || 0).getTime();
                if (localTime > serverTime) {
                  mergedMap.set(lp.id, lp);
                  hasLocalOnlyChanges = true;
                }
              }
            });

            this.packages = Array.from(mergedMap.values());
          }

          // 2. Merge templates biaya
          if (Array.isArray(data.templates)) {
            const tmplMap = new Map<string, CostTemplate>();
            data.templates.forEach((st: CostTemplate) => tmplMap.set(st.id, st));
            this.templates.forEach((lt) => {
              if (!tmplMap.has(lt.id)) {
                tmplMap.set(lt.id, lt);
                hasLocalOnlyChanges = true;
              }
            });
            this.templates = Array.from(tmplMap.values());
          }

          // 3. Merge branding / identitas web & logo
          if (data.branding && typeof data.branding === 'object') {
            if (this.branding.appName && this.branding.appName !== DEFAULT_BRANDING.appName) {
              if (data.branding.appName === DEFAULT_BRANDING.appName) {
                hasLocalOnlyChanges = true;
              } else {
                this.branding = { ...this.branding, ...data.branding };
              }
            } else {
              this.branding = { ...this.branding, ...data.branding };
            }
          }

          // 4. Merge users & audit logs
          if (Array.isArray(data.users) && data.users.length > 0) {
            const userMap = new Map(data.users.map((u: UserProfile) => [u.id, u]));
            this.users.forEach((lu) => {
              if (!userMap.has(lu.id)) userMap.set(lu.id, lu);
            });
            this.users = Array.from(userMap.values()) as UserProfile[];
          }
          if (Array.isArray(data.auditLogs)) {
            const logIds = new Set(data.auditLogs.map((l: AuditLog) => l.id));
            this.auditLogs.forEach((ll) => {
              if (!logIds.has(ll.id)) data.auditLogs.unshift(ll);
            });
            this.auditLogs = data.auditLogs;
          }

          this.isServerConnected = true;
          this.lastSyncedAt = new Date().toLocaleTimeString('id-ID');
          this.persistLocalOnly();

          // Jika ada data lokal yang belum tersimpan di server, sync balik ke server sekarang!
          if (hasLocalOnlyChanges) {
            await this.pushToServer();
          }
        }
      }
    } catch (err) {
      console.warn('Backend server database belum merespon, menggunakan data lokal tersimpan:', err);
      this.isServerConnected = false;
    }
  }

  // Push seluruh data lokal ke server untuk memastikan sinkronisasi 100% antar link & browser
  public async pushToServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: this.packages,
          templates: this.templates,
          users: this.users,
          auditLogs: this.auditLogs,
          branding: this.branding,
        }),
      });
      if (res.ok) {
        this.isServerConnected = true;
        this.lastSyncedAt = new Date().toLocaleTimeString('id-ID');
        this.notify();
        return true;
      }
    } catch (e) {
      console.warn('Gagal push sinkronisasi ke server:', e);
    }
    return false;
  }

  private persistLocalOnly() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tourcost_packages_v1', JSON.stringify(this.packages));
      localStorage.setItem('tourcost_templates_v1', JSON.stringify(this.templates));
      localStorage.setItem('tourcost_users_v1', JSON.stringify(this.users));
      localStorage.setItem('tourcost_logs_v1', JSON.stringify(this.auditLogs));
      localStorage.setItem('tourcost_branding_v1', JSON.stringify(this.branding));
      localStorage.setItem('tourcost_authenticated', this.authenticated ? 'true' : 'false');
      localStorage.setItem('tourcost_active_user_id', this.currentUser.id);
    }
    this.notify();
  }

  private async persist(serverEndpoint?: { path: string; method: string; body?: any }) {
    // 1. Simpan segera ke localStorage (instan)
    this.persistLocalOnly();

    // 2. Kirim sinkronisasi ke server secara asinkron
    if (serverEndpoint && typeof window !== 'undefined') {
      try {
        const res = await fetch(serverEndpoint.path, {
          method: serverEndpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: serverEndpoint.body ? JSON.stringify(serverEndpoint.body) : undefined,
        });
        if (res.ok) {
          this.isServerConnected = true;
          this.lastSyncedAt = new Date().toLocaleTimeString('id-ID');
        }
      } catch (err) {
        console.warn('Gagal sync ke server backend:', err);
      }
    }
  }

  // --- BRANDING & LOGO MANAGEMENT ---
  public getBranding(): AppBranding {
    return { ...this.branding };
  }

  public async updateBranding(updates: Partial<AppBranding>) {
    this.branding = { ...this.branding, ...updates };
    if (typeof document !== 'undefined' && this.branding.appName) {
      document.title = `${this.branding.appName} — Manajemen HPP Paket Tour`;
    }
    this.persist({
      path: '/api/branding',
      method: 'POST',
      body: this.branding,
    });
  }

  // --- AUTHENTICATION (LOGIN / LOGOUT) ---
  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public async login(email: string): Promise<{ success: boolean; error?: string }> {
    const normalized = (email || '').toLowerCase().trim();
    const user = this.users.find((u) => u.email.toLowerCase() === normalized);

    if (!user) {
      return { success: false, error: 'Email tidak ditemukan dalam sistem.' };
    }
    if (!user.is_active) {
      return { success: false, error: 'Akun Anda dinonaktifkan oleh Super Admin.' };
    }

    this.currentUser = user;
    this.authenticated = true;
    this.persistLocalOnly();

    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
    } catch (e) {
      console.warn('Login server sync notification failed:', e);
    }

    return { success: true };
  }

  public loginAsUser(user: UserProfile) {
    this.currentUser = user;
    this.authenticated = true;
    this.persistLocalOnly();
  }

  public logout() {
    this.authenticated = false;
    this.persistLocalOnly();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- CURRENT USER & RBAC ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    this.persistLocalOnly();
  }

  public switchRole(role: UserRole) {
    const targetUser = this.users.find((u) => u.role === role);
    if (targetUser) {
      this.currentUser = targetUser;
    } else {
      this.currentUser = { ...this.currentUser, role };
    }
    this.persistLocalOnly();
  }

  public canEdit(): boolean {
    return this.currentUser.role === 'super_admin' || this.currentUser.role === 'admin';
  }

  public isSuperAdmin(): boolean {
    return this.currentUser.role === 'super_admin';
  }

  // --- PACKAGES CRUD ---
  public getPackages(): TourPackage[] {
    return [...this.packages];
  }

  public getPackageById(id: string): TourPackage | undefined {
    return this.packages.find((p) => p.id === id);
  }

  public savePackage(pkg: TourPackage): { success: boolean; error?: string } {
    if (!this.canEdit()) {
      return { success: false, error: 'Akses ditolak: Viewer tidak memiliki izin mengubah data paket.' };
    }

    const existingIndex = this.packages.findIndex((p) => p.id === pkg.id);
    const now = new Date().toISOString();

    let targetPackage: TourPackage;

    if (existingIndex >= 0) {
      const existing = this.packages[existingIndex];
      if (existing.status === 'final' && this.currentUser.role !== 'super_admin') {
        return { success: false, error: 'Paket berstatus Final dilindungi. Hanya Super Admin yang dapat merevisi.' };
      }

      targetPackage = {
        ...pkg,
        updated_by: this.currentUser.id,
        updated_by_name: this.currentUser.full_name,
        updated_at: now,
      };

      this.packages[existingIndex] = targetPackage;

      this.logAudit({
        user_id: this.currentUser.id,
        user_name: this.currentUser.full_name,
        package_id: pkg.id,
        package_code: pkg.package_code,
        action: 'UPDATE_PACKAGE',
        entity_type: 'package',
        entity_id: pkg.id,
        description: `Memperbarui paket "${pkg.name}" (${pkg.package_code})`,
        old_values: { name: existing.name, status: existing.status, itemsCount: existing.cost_items.length },
        new_values: { name: pkg.name, status: pkg.status, itemsCount: pkg.cost_items.length },
      });
    } else {
      targetPackage = {
        ...pkg,
        created_by: this.currentUser.id,
        created_by_name: this.currentUser.full_name,
        updated_by: this.currentUser.id,
        updated_by_name: this.currentUser.full_name,
        created_at: now,
        updated_at: now,
      };

      this.packages.unshift(targetPackage);

      this.logAudit({
        user_id: this.currentUser.id,
        user_name: this.currentUser.full_name,
        package_id: pkg.id,
        package_code: pkg.package_code,
        action: 'CREATE_PACKAGE',
        entity_type: 'package',
        entity_id: pkg.id,
        description: `Membuat paket baru "${pkg.name}" (${pkg.package_code})`,
      });
    }

    // Simpan ke file server database
    this.persist({
      path: '/api/packages',
      method: 'POST',
      body: targetPackage,
    });

    return { success: true };
  }

  public duplicatePackage(id: string): { success: boolean; newPackage?: TourPackage; error?: string } {
    if (!this.canEdit()) {
      return { success: false, error: 'Akses ditolak: Viewer tidak dapat menduplikasi paket.' };
    }

    const source = this.getPackageById(id);
    if (!source) {
      return { success: false, error: 'Paket sumber tidak ditemukan.' };
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `TC-${year}-CPY${randomSuffix}`;
    const newId = `pkg-dup-${Date.now()}`;
    const now = new Date().toISOString();

    const duplicated: TourPackage = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      package_code: newCode,
      name: `${source.name} (Salinan)`,
      status: 'draft',
      approved_by: undefined,
      approved_by_name: undefined,
      approved_at: undefined,
      created_by: this.currentUser.id,
      created_by_name: this.currentUser.full_name,
      updated_by: this.currentUser.id,
      updated_by_name: this.currentUser.full_name,
      created_at: now,
      updated_at: now,
      pricing_settings: {
        ...source.pricing_settings,
        package_id: newId,
      },
      cost_items: source.cost_items.map((ci) => ({
        ...ci,
        id: `ci-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        package_id: newId,
      })),
    };

    this.packages.unshift(duplicated);

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      package_id: newId,
      package_code: newCode,
      action: 'DUPLICATE_PACKAGE',
      entity_type: 'package',
      entity_id: newId,
      description: `Menduplikasi paket "${source.name}" menjadi "${duplicated.name}" (${newCode})`,
    });

    // Simpan ke server
    this.persist({
      path: `/api/packages/${id}/duplicate`,
      method: 'POST',
      body: { userId: this.currentUser.id, userName: this.currentUser.full_name },
    });

    return { success: true, newPackage: duplicated };
  }

  public deletePackage(id: string): { success: boolean; error?: string } {
    if (!this.canEdit()) {
      return { success: false, error: 'Akses ditolak: Viewer tidak dapat menghapus paket.' };
    }

    const pkg = this.getPackageById(id);
    if (!pkg) {
      return { success: false, error: 'Paket tidak ditemukan.' };
    }

    if (pkg.status === 'final' && this.currentUser.role !== 'super_admin') {
      return { success: false, error: 'Paket final dilindungi. Hanya Super Admin yang dapat menghapus paket final.' };
    }

    this.packages = this.packages.filter((p) => p.id !== id);

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      package_id: pkg.id,
      package_code: pkg.package_code,
      action: 'DELETE_PACKAGE',
      entity_type: 'package',
      entity_id: pkg.id,
      description: `Menghapus paket "${pkg.name}" (${pkg.package_code})`,
    });

    // Simpan ke server
    this.persist({
      path: `/api/packages/${id}`,
      method: 'DELETE',
    });

    return { success: true };
  }

  // --- APPROVALS FLOW ---
  public submitForApproval(packageId: string, comments?: string): { success: boolean; error?: string } {
    if (!this.canEdit()) {
      return { success: false, error: 'Izin tidak cukup.' };
    }

    const pkg = this.getPackageById(packageId);
    if (!pkg) return { success: false, error: 'Paket tidak ditemukan.' };

    pkg.status = 'pending_approval';
    pkg.updated_at = new Date().toISOString();

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      package_id: pkg.id,
      package_code: pkg.package_code,
      action: 'SUBMIT_APPROVAL',
      entity_type: 'approval',
      entity_id: pkg.id,
      description: `Mengajukan paket "${pkg.name}" untuk persetujuan. Catatan: ${comments || '-'}`,
    });

    this.persist({
      path: `/api/packages/${packageId}/status`,
      method: 'POST',
      body: {
        status: 'pending_approval',
        reviewerId: this.currentUser.id,
        reviewerName: this.currentUser.full_name,
        comments,
        action: 'submit',
      },
    });

    return { success: true };
  }

  public reviewApproval(
    packageId: string,
    action: 'approved' | 'rejected',
    comments?: string
  ): { success: boolean; error?: string } {
    if (this.currentUser.role !== 'super_admin') {
      return { success: false, error: 'Hanya Super Admin yang berwenang menyetujui atau menolak paket.' };
    }

    const pkg = this.getPackageById(packageId);
    if (!pkg) return { success: false, error: 'Paket tidak ditemukan.' };

    const now = new Date().toISOString();
    if (action === 'approved') {
      pkg.status = 'approved';
      pkg.approved_by = this.currentUser.id;
      pkg.approved_by_name = this.currentUser.full_name;
      pkg.approved_at = now;
    } else {
      pkg.status = 'draft';
    }
    pkg.updated_at = now;

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      package_id: pkg.id,
      package_code: pkg.package_code,
      action: action === 'approved' ? 'APPROVE_PACKAGE' : 'REJECT_PACKAGE',
      entity_type: 'approval',
      entity_id: pkg.id,
      description: `${action === 'approved' ? 'Menyetujui' : 'Menolak'} paket "${pkg.name}". Komentar: ${comments || 'Tanpa catatan'}`,
    });

    this.persist({
      path: `/api/packages/${packageId}/status`,
      method: 'POST',
      body: {
        status: pkg.status,
        reviewerId: this.currentUser.id,
        reviewerName: this.currentUser.full_name,
        comments,
        action,
      },
    });

    return { success: true };
  }

  public setPackageStatus(packageId: string, status: PackageStatus): { success: boolean; error?: string } {
    if (!this.isSuperAdmin() && status === 'final') {
      return { success: false, error: 'Hanya Super Admin yang dapat menetapkan paket ke status Final.' };
    }

    const pkg = this.getPackageById(packageId);
    if (!pkg) return { success: false, error: 'Paket tidak ditemukan.' };

    pkg.status = status;
    pkg.updated_at = new Date().toISOString();

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      package_id: pkg.id,
      package_code: pkg.package_code,
      action: status === 'final' ? 'FINALIZE_PACKAGE' : 'UPDATE_PACKAGE',
      entity_type: 'package',
      entity_id: pkg.id,
      description: `Mengubah status paket "${pkg.name}" menjadi ${status.toUpperCase()}`,
    });

    this.persist({
      path: `/api/packages/${packageId}/status`,
      method: 'POST',
      body: {
        status,
        reviewerId: this.currentUser.id,
        reviewerName: this.currentUser.full_name,
        action: status === 'final' ? 'finalize' : 'update',
      },
    });

    return { success: true };
  }

  // --- TEMPLATES ---
  public getTemplates(): CostTemplate[] {
    return [...this.templates];
  }

  public saveTemplate(template: CostTemplate) {
    const idx = this.templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.templates[idx] = template;
    } else {
      this.templates.unshift(template);
    }
    this.persist({
      path: '/api/templates',
      method: 'POST',
      body: template,
    });
  }

  public duplicateTemplate(id: string) {
    const src = this.templates.find((t) => t.id === id);
    if (!src) return;
    const dup: CostTemplate = {
      ...JSON.parse(JSON.stringify(src)),
      id: `tmpl-${Date.now()}`,
      template_name: `${src.template_name} (Salinan)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.templates.unshift(dup);
    this.persist({
      path: '/api/templates',
      method: 'POST',
      body: dup,
    });
  }

  public deleteTemplate(id: string) {
    this.templates = this.templates.filter((t) => t.id !== id);
    this.persist({
      path: `/api/templates/${id}`,
      method: 'DELETE',
    });
  }

  // --- USER MANAGEMENT (SUPER ADMIN ONLY) ---
  public getUsers(): UserProfile[] {
    return [...this.users];
  }

  public updateUserRole(userId: string, newRole: UserRole): { success: boolean; error?: string } {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Hanya Super Admin yang dapat mengubah role pengguna.' };
    }

    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const oldRole = user.role;
    user.role = newRole;
    user.updated_at = new Date().toISOString();

    if (this.currentUser.id === userId) {
      this.currentUser.role = newRole;
    }

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      action: 'CHANGE_USER_ROLE',
      entity_type: 'user',
      entity_id: userId,
      description: `Mengubah hak akses "${user.full_name}" dari ${oldRole} menjadi ${newRole}`,
    });

    this.persist({
      path: `/api/users/${userId}/role`,
      method: 'POST',
      body: { role: newRole },
    });

    return { success: true };
  }

  public toggleUserStatus(userId: string): { success: boolean; error?: string } {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Hanya Super Admin yang dapat mengaktifkan/menonaktifkan pengguna.' };
    }

    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    user.is_active = !user.is_active;
    user.updated_at = new Date().toISOString();

    this.logAudit({
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      action: 'TOGGLE_USER_STATUS',
      entity_type: 'user',
      entity_id: userId,
      description: `${user.is_active ? 'Mengaktifkan' : 'Menonaktifkan'} akun pengguna "${user.full_name}"`,
    });

    this.persist({
      path: `/api/users/${userId}/status`,
      method: 'POST',
    });

    return { success: true };
  }

  public addUser(name: string, email: string, role: UserRole): { success: boolean; error?: string } {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Hanya Super Admin yang dapat menambah pengguna baru.' };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      full_name: name,
      email,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.persist({
      path: '/api/users',
      method: 'POST',
      body: newUser,
    });

    return { success: true };
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  private logAudit(entry: Omit<AuditLog, 'id' | 'created_at'>) {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
  }

  public async resetToDemo() {
    this.packages = DEMO_PACKAGES;
    this.templates = DEMO_TEMPLATES;
    this.users = DEMO_PROFILES;
    this.auditLogs = DEMO_AUDIT_LOGS;
    this.currentUser = DEMO_PROFILES[0];
    this.persistLocalOnly();

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Gagal reset server:', e);
    }
  }
}

export const store = new TourCostStore();
