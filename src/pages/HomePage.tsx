import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useFloorPlans,
  useDeleteFloorPlan,
  useDuplicateFloorPlan,
} from '../hooks/useFloorPlans';
import type { FloorPlan } from '../types';

function PlanThumbnail() {
  const { t } = useTranslation();
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full">
      <defs>
        <linearGradient id="grad-thumb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A1F1F" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#D4A24C" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill="url(#grad-thumb)" />
      {[40, 80, 120, 160, 200, 240, 280].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="#7A1F1F" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {[40, 80, 120].map(y => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#7A1F1F" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      <rect x="100" y="14" width="120" height="32" rx="6" fill="#EF9F27" fillOpacity="0.85" />
      <text x="160" y="35" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" letterSpacing="0.5">{t('home.stage')}</text>
      <circle cx="70" cy="95" r="24" fill="none" stroke="#7A1F1F" strokeWidth="2.5" strokeOpacity="0.45" />
      <circle cx="160" cy="95" r="24" fill="none" stroke="#7A1F1F" strokeWidth="2.5" strokeOpacity="0.45" />
      <circle cx="250" cy="95" r="24" fill="none" stroke="#7A1F1F" strokeWidth="2.5" strokeOpacity="0.45" />
      <circle cx="115" cy="145" r="18" fill="none" stroke="#D4A24C" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="205" cy="145" r="18" fill="#D4A24C" fillOpacity="0.12" stroke="#D4A24C" strokeWidth="2" strokeOpacity="0.5" />
      {[70, 160, 250].map((cx, i) => [0, 90, 180, 270].map(deg => (
        <circle key={`${i}-${deg}`}
          cx={cx + 28 * Math.cos(deg * Math.PI / 180)}
          cy={95 + 28 * Math.sin(deg * Math.PI / 180)}
          r="3.5" fill="#7A1F1F" fillOpacity="0.3"
        />
      )))}
    </svg>
  );
}

function PlanCard({ plan, onOpen, onDelete, onDuplicate }: {
  plan: FloorPlan;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group overflow-hidden">
      <div
        className="h-36 bg-slate-50 flex items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={onOpen}
      >
        <PlanThumbnail />
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/10 transition-all duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
            {t('common.open')} <ChevronRight size={12} />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className={`font-bold truncate text-sm ${!plan.name ? 'text-slate-400 italic' : 'text-slate-800'}`}>
              {plan.name || t('home.untitled_plan')}
            </h3>
            {plan.description && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{plan.description}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
            plan.status === 'published'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {plan.status}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
          <Calendar size={10} />
          {new Date(plan.updatedAt).toLocaleDateString()}
          <span className="mx-1 text-slate-200">·</span>
          {plan.elements?.length ?? 0} {t('home.elements')}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
          >
            {t('common.open')} <ChevronRight size={11} />
          </button>
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans, isLoading } = useFloorPlans();
  const deletePlan = useDeleteFloorPlan();
  const duplicatePlan = useDuplicateFloorPlan();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5 uppercase tracking-wide">{t('home.workspace')}</p>
            <h1 className="text-2xl font-bold text-slate-900">{t('home.floor_plans')}</h1>
          </div>
          <button
            onClick={() => navigate('/floor-plans/new')}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
          >
            <Plus size={15} />
            {t('home.new_plan')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={28} className="animate-spin text-[#7A1F1F]" />
            </div>
          ) : !plans?.length ? (
            <div className="text-center py-24">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
              >
                📐
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">{t('home.empty_title')}</h2>
              <p className="text-sm text-slate-500 mb-7">{t('home.empty_subtitle')}</p>
              <button
                onClick={() => navigate('/floor-plans/new')}
                className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
                style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
              >
                <Plus size={15} />
                {t('planner.create_floor')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{t('home.your_plans')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {plans.length} floor plan{plans.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plans.map(plan => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    onOpen={() => navigate(`/events/${plan._id}`)}
                    onDelete={() => deletePlan.mutate(plan._id)}
                    onDuplicate={() => duplicatePlan.mutate(plan._id)}
                  />
                ))}

                {/* New plan card */}
                <button
                  onClick={() => navigate('/floor-plans/new')}
                  className="rounded-2xl border-2 border-dashed border-slate-200 h-[250px] flex flex-col items-center justify-center gap-2 hover:border-[#7A1F1F]/50 hover:bg-[#7A1F1F]/3 transition-all duration-200 group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
                    style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                  >
                    <Plus size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                    {t('home.new_plan')}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
