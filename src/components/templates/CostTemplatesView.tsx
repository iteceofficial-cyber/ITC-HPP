import React, { useState } from 'react';
import { FileText, Plus, Copy, Trash2, ArrowRight, Layers } from 'lucide-react';
import { CostTemplate } from '../../types';
import { store } from '../../lib/store';
import { DEFAULT_COST_CATEGORIES } from '../../lib/constants';

interface CostTemplatesViewProps {
  onApplyTemplateToNewPackage: (template: CostTemplate) => void;
}

export const CostTemplatesView: React.FC<CostTemplatesViewProps> = ({
  onApplyTemplateToNewPackage,
}) => {
  const [templates, setTemplates] = useState<CostTemplate[]>(store.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<CostTemplate | null>(
    templates[0] || null
  );

  const canEdit = store.canEdit();

  const handleDuplicate = (id: string) => {
    store.duplicateTemplate(id);
    setTemplates(store.getTemplates());
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus template biaya ini?')) {
      store.deleteTemplate(id);
      const updated = store.getTemplates();
      setTemplates(updated);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(updated[0] || null);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Template Komponen Biaya (Cost Templates)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gunakan template standar agar pembuatan HPP paket tour berulang lebih cepat dan akurat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar List Template */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Template Tersedia ({templates.length})
          </div>

          <div className="space-y-2">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{tmpl.template_name}</h3>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">
                      {tmpl.trip_type === 'open_trip' ? 'Open' : 'Private'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {tmpl.description}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{tmpl.destination}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tmpl.items.length} item biaya</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Template & Items */}
        <div className="md:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedTemplate.template_name}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Destinasi: {selectedTemplate.destination} · Durasi:{' '}
                    {selectedTemplate.duration_days} Hari {selectedTemplate.duration_nights} Malam
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      onClick={() => handleDuplicate(selectedTemplate.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded text-xs font-medium text-slate-700"
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplikasi
                    </button>
                  )}
                  <button
                    onClick={() => onApplyTemplateToNewPackage(selectedTemplate)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs"
                  >
                    <span>Gunakan untuk Buat Paket</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabel Rincian Template Item */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Daftar Komponen Biaya Bawaan ({selectedTemplate.items.length} Item)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Nama Item</th>
                        <th className="p-2.5 text-right">Harga Satuan</th>
                        <th className="p-2.5">Dasar Hitung</th>
                        <th className="p-2.5">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedTemplate.items.map((item) => {
                        const cat = DEFAULT_COST_CATEGORIES.find((c) => c.id === item.category_id);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-800">{cat?.name}</td>
                            <td className="p-2.5 font-medium text-slate-900">{item.item_name}</td>
                            <td className="p-2.5 text-right font-mono">
                              Rp{item.unit_price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-slate-500 capitalize">
                              {item.calculation_basis.replace('_', ' ')}
                            </td>
                            <td className="p-2.5 text-slate-500">{item.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-400 text-sm">
              Pilih template di panel kiri untuk melihat rincian biaya.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
