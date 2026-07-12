import { X, Search, FileSymlink, Trash2, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FloorPlan, PlacedElement } from '../../types';

interface Props {
  templates: FloorPlan[];
  currentUserId?: string;
  onClose: () => void;
  onLoad: (template: FloorPlan) => void;
}

export default function TemplatesModal({ templates, currentUserId, onClose, onLoad }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'my' | 'public'>('my');

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (tab === 'my') {
      return t.ownerId === currentUserId;
    } else {
      return t.isPublic === true;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('planner.templates_title')}</h2>
            <p className="text-sm text-slate-500">{t('planner.templates_subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-2 border-b border-slate-100 gap-6">
          <button 
            className={`pb-3 font-medium text-sm transition-colors border-b-2 ${tab === 'my' ? 'border-[#7A1F1F] text-[#7A1F1F]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab('my')}
          >
            {t('planner.templates_my')}
          </button>
          <button 
            className={`pb-3 font-medium text-sm transition-colors border-b-2 ${tab === 'public' ? 'border-[#7A1F1F] text-[#7A1F1F]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab('public')}
          >
            {t('planner.templates_public')}
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('planner.templates_search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileSymlink className="text-slate-400" size={24} />
              </div>
              <h3 className="text-slate-700 font-semibold mb-1">{t('planner.templates_empty_title')}</h3>
              <p className="text-sm text-slate-500">{t('planner.templates_empty_subtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(template => (
                <div key={template._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#7A1F1F]/50 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{template.name}</h3>
                      {template.isPublic && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          {t('planner.templates_public_tag')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {template.description || t('planner.templates_no_description')}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(template.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{t('planner.templates_items', { count: template.elements.length })}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {template.ownerId === currentUserId ? (
                      <button className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div />
                    )}
                    <button 
                      onClick={() => onLoad(template)}
                      className="px-4 py-1.5 bg-[#7A1F1F] text-white text-sm font-semibold rounded-lg hover:bg-[#601818] transition-colors"
                    >
                      {t('planner.templates_load')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
