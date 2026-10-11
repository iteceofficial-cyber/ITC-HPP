import React, { useState } from 'react';
import {
  X,
  Upload,
  Globe,
  Compass,
  Plane,
  Mountain,
  Palmtree,
  Luggage,
  MapPin,
  Ship,
  Sparkles,
  Check,
  Building,
  Phone,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { store } from '../../lib/store';
import { AppBranding } from '../../types';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (branding: AppBranding) => void;
}

const PRESET_ICONS = [
  { id: 'compass', name: 'Kompas Petualang', icon: Compass },
  { id: 'plane', name: 'Pesawat / Penerbangan', icon: Plane },
  { id: 'mountain', name: 'Gunung & Alam', icon: Mountain },
  { id: 'globe', name: 'Jelajah Dunia', icon: Globe },
  { id: 'palmtree', name: 'Pantai & Resort', icon: Palmtree },
  { id: 'luggage', name: 'Koper & Wisata', icon: Luggage },
  { id: 'mappin', name: 'Destinasi / Titik Kumpul', icon: MapPin },
  { id: 'ship', name: 'Kapal Phinisi & Laut', icon: Ship },
];

const PRESET_COLORS = [
  { name: 'Navy Modern', hex: '#1d4ed8' },
  { name: 'Deep Slate', hex: '#0f172a' },
  { name: 'Emerald Hijau', hex: '#059669' },
  { name: 'Indigo Ungu', hex: '#4338ca' },
  { name: 'Ocean Cyan', hex: '#0284c7' },
  { name: 'Amber Sunset', hex: '#d97706' },
  { name: 'Maroon Merah', hex: '#be123c' },
];

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const currentBranding = store.getBranding();

  const [appName, setAppName] = useState<string>(currentBranding.appName || 'TourCost');
  const [tagline, setTagline] = useState<string>(
    currentBranding.tagline || 'Sistem HPP & Costing Travel Agent'
  );
  const [companyName, setCompanyName] = useState<string>(
    currentBranding.companyName || 'PT TOURCOST NUSANTARA TRAVEL'
  );
  const [companyAddress, setCompanyAddress] = useState<string>(
    currentBranding.companyAddress || 'Jl. Pariwisata Raya No. 88, Jakarta Selatan'
  );
  const [companyContact, setCompanyContact] = useState<string>(
    currentBranding.companyContact || 'Telp: (021) 7890-1234 · Email: ops@tourcost.id'
  );
  const [logoUrl, setLogoUrl] = useState<string>(currentBranding.logoUrl || '');
  const [logoText, setLogoText] = useState<string>(currentBranding.logoText || 'TC');
  const [themeColor, setThemeColor] = useState<string>(currentBranding.themeColor || '#1d4ed8');

  const [activeLogoTab, setActiveLogoTab] = useState<'upload' | 'preset' | 'url' | 'monogram'>(
    logoUrl ? 'upload' : 'preset'
  );
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<string>('compass');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle upload gambar logo kustom
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoUrl(dataUrl);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Generate SVG data URL dari preset icon
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetIcon(presetId);
    // Render dynamic SVG data URL sederhana untuk preset
    const svgMap: Record<string, string> = {
      compass:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      plane:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>',
      mountain:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
      globe:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      palmtree:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h11z"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-11"/><path d="M5.89 13 8 10l-2.11 3z"/><path d="M9 10a12 12 0 0 1 3 12"/><path d="M13 10a10.5 10.5 0 0 0 3 12"/></svg>',
      luggage:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><circle cx="8" cy="20" r="1"/><circle cx="16" cy="20" r="1"/></svg>',
      mappin:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      ship:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 6"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><line x1="12" y1="2" x2="12" y2="5"/></svg>',
    };

    const rawSvg = svgMap[presetId] || svgMap.compass;
    // Embed with background color
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${themeColor}"/><g transform="translate(20, 20) scale(2.5)">${rawSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}</g></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
    setLogoUrl(dataUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      setErrorMsg('Nama website/aplikasi tidak boleh kosong.');
      return;
    }

    setSaving(true);
    const updated: AppBranding = {
      appName: appName.trim(),
      tagline: tagline.trim(),
      companyName: companyName.trim(),
      companyAddress: companyAddress.trim(),
      companyContact: companyContact.trim(),
      logoUrl: logoUrl.trim(),
      logoText: (logoText || appName.slice(0, 2)).toUpperCase(),
      themeColor,
    };

    await store.updateBranding(updated);
    // Push segera ke server database agar tersimpan permanen
    await store.pushToServer();

    setSaving(false);
    if (onSaved) onSaved(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Nama Web & Logo Tampilan</h2>
              <p className="text-xs text-slate-400">
                Ubah identitas aplikasi, logo tampilan awal, dan kop surat biro travel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Preview"
                className="h-12 w-12 object-contain rounded-xl bg-white/10 p-1 border border-white/20 shadow-md"
              />
            ) : (
              <div
                style={{ backgroundColor: themeColor }}
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md border border-white/20"
              >
                {logoText || appName.slice(0, 2).toUpperCase() || 'TC'}
              </div>
            )}
            <div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span>{appName || 'Nama Aplikasi'}</span>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-700/60">
                  TRAVEL PRO
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {tagline || 'Sistem Manajemen HPP & Costing Travel'}
              </div>
              <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                {companyName || 'Nama PT / Travel Agent'}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block text-[11px] font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              Live Preview Tampilan Awal & Navbar
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800">
              {errorMsg}
            </div>
          )}

          {/* Section: Nama Website & Identitas */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              1. Identitas Nama Website & Travel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Website / Aplikasi *
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: TourCost / Dufan Tour / Jelajah Wisata"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Contoh: Sistem HPP & Costing Travel Agent"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Legal Travel (Kop Surat)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT PESONA WISATA NUSANTARA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Jl. Pariwisata Raya No. 88, Jakarta"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kontak / Telp / Email
                </label>
                <input
                  type="text"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="Telp: (021) 7890-1234 · Email: info@travel.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Logo Tampilan Awal */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
              2. Logo Tampilan Awal & Warna Tema
            </h3>

            {/* Logo Mode Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveLogoTab('upload')}
                className={`py-1.5 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  activeLogoTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File Gambar
              </button>
              <button
                type="button"
                onClick={() => setActiveLogoTab('preset')}
                className={`py-1.5 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  activeLogoTab === 'preset'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Pilihan Ikon Travel
              </button>
              <button
                type="button"
                onClick={() => setActiveLogoTab('url')}
                className={`py-1.5 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  activeLogoTab === 'url'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Link URL Gambar
              </button>
              <button
                type="button"
                onClick={() => setActiveLogoTab('monogram')}
                className={`py-1.5 px-3 font-semibold text-xs border-b-2 transition-colors ${
                  activeLogoTab === 'monogram'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Singkatan Huruf
              </button>
            </div>

            {/* Tab 1: Upload File */}
            {activeLogoTab === 'upload' && (
              <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center space-y-2">
                <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-700">
                  Unggah file logo (PNG, JPG, SVG, WebP)
                </div>
                <p className="text-[11px] text-slate-400">
                  Disarankan gambar persegi / transparan (Maks. 2MB). Akan tersimpan otomatis di
                  database.
                </p>
                <label className="inline-block px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold cursor-pointer shadow-xs transition-colors">
                  <span>Pilih File dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-red-600 hover:text-red-700 font-semibold text-[11px]"
                    >
                      Hapus Logo Kustom
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Pilihan Preset Ikon Travel */}
            {activeLogoTab === 'preset' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500">
                  Pilih ikon travel profesional untuk logo tampilan awal:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_ICONS.map((p) => {
                    const IconComp = p.icon;
                    const isSelected = selectedPresetIcon === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          style={{ backgroundColor: themeColor }}
                          className="h-8 w-8 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Link URL */}
            {activeLogoTab === 'url' && (
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">URL Gambar Logo</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo-travel.png"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 block">
                  Pastikan link URL gambar dapat diakses secara publik (HTTPS).
                </span>
              </div>
            )}

            {/* Tab 4: Monogram Huruf */}
            {activeLogoTab === 'monogram' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Singkatan Huruf (1-3 Karakter)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={logoText}
                      onChange={(e) => {
                        setLogoText(e.target.value.toUpperCase());
                        setLogoUrl('');
                      }}
                      placeholder="TC"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm font-bold uppercase focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pilihan Warna Tema */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-blue-600" />
                Pilihan Warna Aksen Tema Logo
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setThemeColor(c.hex);
                      if (activeLogoTab === 'preset') {
                        handleSelectPreset(selectedPresetIcon);
                      }
                    }}
                    className={`h-7 px-2.5 rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5 transition-transform ${
                      themeColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-900 scale-105' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {themeColor === c.hex && <Check className="h-3 w-3" />}
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{saving ? 'Menyimpan ke Database...' : 'Simpan Identitas & Logo Web'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
