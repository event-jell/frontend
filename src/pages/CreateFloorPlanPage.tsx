import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCreateFloorPlan } from '../hooks/useFloorPlans';

export default function CreateFloorPlanPage() {
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
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 w-full max-w-md p-8">
        <div
          className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0F6E56 0%, #185FA5 100%)' }}
        >
          <Plus size={18} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">New Floor Plan</h2>
        <p className="text-sm text-slate-500 mb-6">Set up your event layout</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">
              Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Main Hall Layout"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Optional description…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]/50"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate('/floor-plans')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createPlan.isPending}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0F6E56 0%, #185FA5 100%)' }}
          >
            {createPlan.isPending ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
