import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent, useCollaborators, useAddCollaborator, useRemoveCollaborator } from '../hooks/useEvents';
import { Save, AlertTriangle, Loader2, Calendar, MapPin, Clock, AlignLeft, Users, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function EventSettingsPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useEvent(id!);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: collaborators, isLoading: isLoadingCollaborators } = useCollaborators(id!);
  const addCollaborator = useAddCollaborator();
  const removeCollaborator = useRemoveCollaborator();
  const [inviteEmail, setInviteEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'draft' as 'draft' | 'planning' | 'confirmed' | 'live',
    allowGuestSeatSelection: false,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        venue: event.venue || '',
        date: event.date ? event.date.split('T')[0] : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        status: event.status || 'draft',
        allowGuestSeatSelection: event.allowGuestSeatSelection || false,
      });
    }
  }, [event]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <AlertTriangle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Event Not Found</h2>
        <p className="text-slate-500 mb-6 max-w-md">The event you are looking for does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/events')}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSave = () => {
    updateEvent.mutate({ id: id!, data: formData });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEvent.mutate(id!, {
        onSuccess: () => navigate('/events'),
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-5 sm:px-10 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-slate-100/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Event Settings</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your event details, team, and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateEvent.isPending}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shadow-md shadow-indigo-500/10"
          style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #5C1414 100%)' }}
        >
          {updateEvent.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 sm:px-10 space-y-10">
          
          {/* General Information Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FDF5EE] flex items-center justify-center text-[#7A1F1F]">
                  <AlignLeft size={16} />
                </div>
                General Information
              </h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Event Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="e.g. Annual Tech Conference 2024"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal resize-none"
                  placeholder="Provide some details about the event..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-400" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-indigo-400" />
                    Event Status
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full appearance-none px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pr-10"
                    >
                      <option value="draft">Draft</option>
                      <option value="planning">Planning</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="live">Live</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-400" />
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="e.g. Grand Convention Center"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Guest Seat Selection</h3>
                  <p className="text-xs text-slate-500 mt-1">Allow guests to pick their own seats during registration.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.allowGuestSeatSelection}
                  onClick={() => setFormData(prev => ({ ...prev, allowGuestSeatSelection: !prev.allowGuestSeatSelection }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${formData.allowGuestSeatSelection ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.allowGuestSeatSelection ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Collaborators (Owner Only) */}
          {user?.id === event.owner_id && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40">
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-emerald-500">
                    <Users size={16} />
                  </div>
                  Team & Collaborators
                </h2>
                <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Owner
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    Invite team members to help manage this event. They will be able to view and edit event details, guests, tickets, vendors, and the floor plan.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="team.member@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && inviteEmail) {
                            e.preventDefault();
                            addCollaborator.mutate({ eventId: id!, email: inviteEmail }, {
                              onSuccess: () => setInviteEmail('')
                            });
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Users size={16} className="text-slate-400" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (inviteEmail) {
                          addCollaborator.mutate({ eventId: id!, email: inviteEmail }, {
                            onSuccess: () => setInviteEmail('')
                          });
                        }
                      }}
                      disabled={addCollaborator.isPending || !inviteEmail}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FAF7F2] text-[#3FA65B] hover:bg-emerald-100 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {addCollaborator.isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                      Send Invite
                    </button>
                  </div>
                </div>

                {isLoadingCollaborators ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-3 text-slate-400 font-medium text-sm">
                      <Loader2 className="animate-spin" size={18} />
                      Loading team members...
                    </div>
                  </div>
                ) : collaborators && collaborators.length > 0 ? (
                  <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white">
                    <ul className="divide-y divide-slate-100">
                      {collaborators.map((collab: any) => (
                        <li key={collab._id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[#7A1F1F] flex items-center justify-center font-bold text-sm shadow-inner shadow-white/50">
                              {collab.first_name[0]}{collab.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{collab.first_name} {collab.last_name}</p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{collab.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${collab.first_name} from collaborators?`)) {
                                removeCollaborator.mutate({ eventId: id!, userId: collab._id });
                              }
                            }}
                            disabled={removeCollaborator.isPending}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove collaborator"
                          >
                            <X size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Users size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No collaborators added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Danger Zone (Owner Only) */}
          {user?.id === event.owner_id && (
            <div className="bg-white rounded-3xl shadow-xl shadow-red-500/5 border border-red-100 overflow-hidden relative">
              <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
              <div className="px-8 py-6 border-b border-red-100 bg-gradient-to-b from-red-50/50 to-white flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-600 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                    <AlertTriangle size={16} />
                  </div>
                  Danger Zone
                </h2>
              </div>
              <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Delete Event</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-md">
                    Once you delete an event, there is no going back. All related data including floor plans, guests, and tickets will be permanently removed.
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 text-sm font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
                >
                  <AlertTriangle size={16} />
                  Delete Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
