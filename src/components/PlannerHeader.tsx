import { Save, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import type { FloorPlan } from '../types';
import Logo from './Logo';

interface Props {
  plan: FloorPlan;
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onBack: () => void;
  onRename: (name: string) => void;
}

export default function PlannerHeader({ plan, isSaving, lastSaved, onSave, onBack, onRename }: Props) {
  return (
    <header className="h-13 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0 shadow-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
      >
        <ArrowLeft size={15} />
        Plans
      </button>

      <div className="w-px h-5 bg-slate-200" />

      {/* Brand mark */}
      <Logo size={28} />

      <input
        value={plan.name}
        onChange={e => onRename(e.target.value)}
        className="flex-1 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-slate-50 px-2 py-1.5 rounded-lg min-w-0"
        placeholder="Untitled Plan"
      />

      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" />
            Saving…
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle size={12} className="text-emerald-500" />
            Saved
          </span>
        ) : null}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          style={{ backgroundColor: '#7A1F1F' }}
        >
          <Save size={13} />
          Save
        </button>
      </div>
    </header>
  );
}
