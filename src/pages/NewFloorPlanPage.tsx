import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { useCreateFloorPlan } from '../hooks/useFloorPlans';

export default function NewFloorPlanPage() {
  const navigate = useNavigate();
  const createPlan = useCreateFloorPlan();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const plan = await createPlan.mutateAsync({ name: name.trim(), description: desc });
    navigate(`/events/${plan._id}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center gap-4">
        <button
          onClick={() => navigate('/floor-plans')}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Floor Plan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Set up your event layout</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center">
        <div className="w-full max-w-lg">

          {/* Icon hero */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
              style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
            >
              <LayoutGrid size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Create a Floor Plan</h2>
            <p className="text-slate-500 mt-1 text-sm">Give your layout a name and an optional description to get started.</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="e.g. Main Hall Layout"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-[#7A1F1F]/60 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                Description <span className="text-slate-300 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={3}
                placeholder="What is this floor plan for?"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-[#7A1F1F]/60 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/floor-plans')}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || createPlan.isPending}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all shadow-sm hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
              >
                {createPlan.isPending ? 'Creating…' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
