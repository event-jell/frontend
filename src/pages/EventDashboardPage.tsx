import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents';
import {
  Layout, Users, Ticket, Store, MessageSquare,
  BarChart2, Settings, Loader2, ArrowUpRight,
} from 'lucide-react';

const SUITE_ITEMS = [
  {
    icon: Layout,
    label: 'Floor Planner',
    desc: 'Design your stage & layout',
    path: 'planner',
    gradient: 'from-emerald-500 to-teal-600',
    light: '#ECFDF5',
    accent: '#059669',
  },
  {
    icon: Users,
    label: 'Guest List',
    desc: 'Manage RSVPs and seating',
    path: 'guests',
    gradient: 'from-blue-500 to-indigo-600',
    light: '#EFF6FF',
    accent: '#3B82F6',
  },
  {
    icon: Ticket,
    label: 'Ticketing',
    desc: 'Sell and track tickets',
    path: 'ticketing',
    gradient: 'from-violet-500 to-purple-600',
    light: '#F5F3FF',
    accent: '#7C3AED',
  },
  {
    icon: Store,
    label: 'Vendors',
    desc: 'Coordinate with suppliers',
    path: 'vendors',
    gradient: 'from-amber-400 to-orange-500',
    light: '#FFFBEB',
    accent: '#D97706',
  },
  {
    icon: MessageSquare,
    label: 'Event Com',
    desc: 'Communicate with attendees',
    path: 'event-com',
    gradient: 'from-green-400 to-emerald-600',
    light: '#F0FDF4',
    accent: '#16A34A',
  },
  {
    icon: BarChart2,
    label: 'Reports',
    desc: 'Analytics and insights',
    path: 'reports',
    gradient: 'from-indigo-500 to-blue-600',
    light: '#EEF2FF',
    accent: '#4F46E5',
  },
  {
    icon: Settings,
    label: 'Settings',
    desc: 'Event configuration',
    path: 'settings',
    gradient: 'from-slate-400 to-slate-600',
    light: '#F8FAFC',
    accent: '#64748B',
  },
];

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id!);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 size={28} className="animate-spin text-[#7A1F1F]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-3">
        <p className="text-slate-500 text-sm">Event not found</p>
        <button
          onClick={() => navigate('/events')}
          className="text-sm text-[#7A1F1F] hover:underline font-medium"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* Banner */}
      <div
        className="relative px-8 pt-10 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-4 right-48 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative max-w-4xl">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
            Event Dashboard
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">{event.name}</h1>
          {event.description && (
            <p className="text-white/70 text-sm mt-1">{event.description}</p>
          )}
        </div>
      </div>

      {/* Module grid */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUITE_ITEMS.map(({ icon: Icon, label, desc, path, gradient, light, accent }) => (
            <button
              key={path}
              onClick={() => navigate(`/events/${id}/${path}`)}
              className="group relative bg-white rounded-2xl border border-slate-100 p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              {/* Subtle gradient tint on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"
                style={{ background: `radial-gradient(circle at top left, ${light}, transparent 70%)` }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}
                  >
                    <Icon size={18} />
                  </div>
                  <ArrowUpRight
                    size={15}
                    className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-0.5">{label}</h3>
                <p className="text-xs text-slate-400 leading-snug">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
