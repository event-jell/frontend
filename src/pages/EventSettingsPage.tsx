import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent, useCollaborators, useAddCollaborator, useRemoveCollaborator, useUpdateCollaboratorRole, useUpdateCollaboratorPermissions, useRecentContacts } from '../hooks/useEvents';
import { Save, AlertTriangle, Loader2, Calendar, MapPin, Clock, AlignLeft, Users, UserPlus, X, ClipboardList, Plus, Trash2, GripVertical, ChevronDown, Upload, Video, Sparkles, Check, Shield, Sliders, Settings2, Key, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { RsvpField, Collaborator, CollaboratorPermissions } from '../types';
import { uploadApi } from '../lib/api';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import PermissionsModal, { ROLE_PRESETS } from '../components/events/PermissionsModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { SUPPORTED_CURRENCIES, getCurrencyForCountry } from '../utils/formatters';
import { toast } from 'sonner';

export default function EventSettingsPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useEvent(id!);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: collaborators, isLoading: isLoadingCollaborators } = useCollaborators(id!);
  const { data: recentContacts } = useRecentContacts();
  const addCollaborator = useAddCollaborator();
  const removeCollaborator = useRemoveCollaborator();
  const updateCollaboratorRole = useUpdateCollaboratorRole();
  const updateCollaboratorPermissions = useUpdateCollaboratorPermissions();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [customInvitePerms, setCustomInvitePerms] = useState<CollaboratorPermissions | null>(null);
  const [isCustomInviteOpen, setIsCustomInviteOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaborator | null>(null);
  const [collabToRemove, setCollabToRemove] = useState<Collaborator | null>(null);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'rsvp' | 'team' | 'danger'>('general');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestIndex, setSelectedSuggestIndex] = useState(-1);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'draft' as 'draft' | 'planning' | 'confirmed' | 'live',
    currency: getCurrencyForCountry(user?.country),
    allowGuestSeatSelection: false,
    coverImage: '',
    isVirtual: false,
    virtualLink: '',
    dates: [] as { date: string; startTime: string; endTime: string }[],
  });

  const [rsvpFields, setRsvpFields] = useState<RsvpField[]>([]);
  const [newField, setNewField] = useState<Partial<RsvpField>>({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
  });
  const [newOption, setNewOption] = useState('');
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setFormData(prev => ({ ...prev, coverImage: res.url }));
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

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
        currency: event.currency || getCurrencyForCountry(user?.country),
        allowGuestSeatSelection: event.allowGuestSeatSelection || false,
        coverImage: event.coverImage || '',
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        dates: event.dates || [],
      });
      setRsvpFields(event.rsvpFields ?? []);
    }
  }, [event, user?.country]);

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
    updateEvent.mutate({ id: id!, data: { ...formData, rsvpFields } });
  };

  const handleDelete = () => {
    setIsDeleteEventOpen(true);
  };

  const isOwner = user?.id === event.owner_id;

  const tabs = [
    { id: 'general' as const, label: 'General Info', icon: AlignLeft },
    { id: 'rsvp' as const, label: 'RSVP Form Fields', icon: ClipboardList },
    ...(isOwner ? [
      { id: 'team' as const, label: 'Team & Collaborators', icon: Users },
      { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle }
    ] : [])
  ];

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

      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          
          {/* Side Tabs Navigation */}
          <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 bg-white md:bg-transparent p-1 md:p-0 rounded-2xl border md:border-0 border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all outline-none ${
                    isActive
                      ? 'bg-[#FAF0E8] text-[#7A1F1F]'
                      : 'text-slate-600 hover:bg-slate-100/50 hover:text-[#7A1F1F]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#7A1F1F]' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Settings Section Content area */}
          <div className="flex-1 w-full">
          
            {activeTab === 'general' && (
              /* General Information Card */
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Event Banner (Optional)</label>
                {formData.coverImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[21/9] max-w-xl">
                    <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: '' })}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white hover:bg-black/80 transition-colors shadow-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl py-8 cursor-pointer hover:bg-slate-50 transition-colors max-w-xl"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin text-[#7A1F1F] mb-2" size={24} />
                        <span className="text-sm text-slate-500 font-medium">Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2" size={24} />
                        <span className="text-sm text-slate-550 font-bold">Upload new event banner</span>
                        <span className="text-xs text-slate-400 mt-1">JPEG or PNG, up to 5MB</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Location Type Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-[#7A1F1F]" />
                    Location Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isVirtual: false }))}
                      className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                        !formData.isVirtual
                          ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Physical
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isVirtual: true }))}
                      className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.isVirtual
                          ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Virtual
                    </button>
                  </div>
                </div>

                {/* Event Status selector */}
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
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Event Currency selector */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Coins size={16} className="text-[#7A1F1F]" />
                    Event Currency
                  </label>
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full appearance-none px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/10 transition-all pr-10"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.symbol}) - {c.country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional Location Details Input */}
              {formData.isVirtual ? (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Video size={16} className="text-emerald-500" />
                    Virtual Join Link
                  </label>
                  <input
                    type="text"
                    value={formData.virtualLink}
                    onChange={e => setFormData({ ...formData, virtualLink: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="e.g. https://zoom.us/j/1234567890"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-400" />
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="e.g. Grand Convention Center"
                  />
                </div>
              )}

              {/* Dates & Times Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={16} className="text-[#7A1F1F]" />
                    Event Date & Time (Multiple Dates Supported)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      dates: [...prev.dates, { date: prev.date || '', startTime: prev.startTime || '', endTime: prev.endTime || '' }]
                    }))}
                    className="text-xs text-[#7A1F1F] bg-[#FAF0E8] border border-[#7A1F1F]/20 hover:bg-[#FAF0E8]/80 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus size={14} /> Add Date Row
                  </button>
                </div>

                {formData.dates.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Date</label>
                      <DatePicker
                        value={formData.date}
                        onChange={val => setFormData({ ...formData, date: val })}
                        placeholder="Select event date"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Start Time</label>
                        <TimePicker
                          value={formData.startTime}
                          onChange={val => setFormData({ ...formData, startTime: val })}
                          placeholder="Start time"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">End Time</label>
                        <TimePicker
                          value={formData.endTime}
                          onChange={val => setFormData({ ...formData, endTime: val })}
                          placeholder="End time"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {formData.dates.map((d, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3.5 bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 relative group">
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <label className="text-xs font-bold text-slate-500 block">Date {index + 1}</label>
                          <DatePicker
                            value={d.date}
                            onChange={val => {
                              const copy = [...formData.dates];
                              copy[index].date = val;
                              setFormData({ ...formData, dates: copy });
                            }}
                            placeholder="Select date"
                          />
                        </div>
                        <div className="w-full sm:w-3/12 space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 block">Start Time</label>
                          <TimePicker
                            value={d.startTime}
                            onChange={val => {
                              const copy = [...formData.dates];
                              copy[index].startTime = val;
                              setFormData({ ...formData, dates: copy });
                            }}
                          />
                        </div>
                        <div className="w-full sm:w-3/12 space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 block">End Time</label>
                          <TimePicker
                            value={d.endTime}
                            onChange={val => {
                              const copy = [...formData.dates];
                              copy[index].endTime = val;
                              setFormData({ ...formData, dates: copy });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = formData.dates.filter((_, i) => i !== index);
                            setFormData({ ...formData, dates: copy });
                          }}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all sm:mb-0.5 shrink-0 flex items-center justify-center border border-slate-200 bg-white"
                          title="Remove Date Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

            )}

            {activeTab === 'rsvp' && (
              /* ─── RSVP Form Builder ─── */
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF5EE] flex items-center justify-center text-[#7A1F1F]">
                    <ClipboardList size={16} />
                  </div>
                  RSVP Form Fields
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {rsvpFields.length} custom field{rsvpFields.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Define the questions guests must answer when they RSVP. First Name, Last Name, and Email are always collected automatically.
              </p>
            </div>
            <div className="p-8 space-y-4">

              {/* Default locked fields */}
              <div className="space-y-2">
                {[
                  { label: 'First Name', type: 'text' },
                  { label: 'Last Name', type: 'text' },
                  { label: 'Email Address', type: 'email' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl opacity-60 cursor-not-allowed">
                    <GripVertical size={14} className="text-slate-300" />
                    <span className="text-sm font-medium text-slate-700 flex-1">{f.label}</span>
                    <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{f.type}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Always required</span>
                  </div>
                ))}
              </div>

              {/* Custom fields list */}
              {rsvpFields.length > 0 && (
                <div className="space-y-2">
                  {rsvpFields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-[#7A1F1F]/30 transition-colors group">
                      <GripVertical size={14} className="text-slate-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                          <span className="text-xs bg-[#FDF5EE] text-[#7A1F1F] px-2 py-0.5 rounded-full">{field.type}</span>
                          {field.required && (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Required</span>
                          )}
                        </div>
                        {field.placeholder && (
                          <p className="text-xs text-slate-400 mt-0.5">Placeholder: {field.placeholder}</p>
                        )}
                        {field.type === 'select' && field.options && field.options.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">Options: {field.options.join(', ')}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setRsvpFields(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new field builder */}
              <div className="border border-dashed border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowFieldBuilder(v => !v)}
                  className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#7A1F1F] hover:bg-[#FDF5EE]/50 transition-colors"
                >
                  <Plus size={16} />
                  Add a field
                  <ChevronDown size={14} className={`ml-auto transition-transform ${showFieldBuilder ? 'rotate-180' : ''}`} />
                </button>

                {showFieldBuilder && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Field Label *</label>
                        <input
                          value={newField.label ?? ''}
                          onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                          placeholder='e.g. "Dietary Requirement"'
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Field Type</label>
                        <select
                          value={newField.type ?? 'text'}
                          onChange={e => setNewField(f => ({ ...f, type: e.target.value as RsvpField['type'] }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="select">Dropdown / Select</option>
                          <option value="checkbox">Checkbox (Yes/No)</option>
                          <option value="number">Number</option>
                          <option value="phone">Phone Number</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                    </div>

                    {newField.type !== 'checkbox' && newField.type !== 'select' && (
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Placeholder text</label>
                        <input
                          value={newField.placeholder ?? ''}
                          onChange={e => setNewField(f => ({ ...f, placeholder: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                          placeholder='e.g. "Enter your dietary needs…"'
                        />
                      </div>
                    )}

                    {newField.type === 'select' && (
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Options</label>
                        <div className="space-y-2">
                          {(newField.options ?? []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="flex-1 text-sm text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">{opt}</span>
                              <button onClick={() => setNewField(f => ({ ...f, options: (f.options ?? []).filter((_, j) => j !== i) }))}
                                className="p-1 text-slate-400 hover:text-red-500"><X size={14} /></button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              value={newOption}
                              onChange={e => setNewOption(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && newOption.trim()) {
                                  e.preventDefault();
                                  setNewField(f => ({ ...f, options: [...(f.options ?? []), newOption.trim()] }));
                                  setNewOption('');
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                              placeholder='Type an option, press Enter'
                            />
                            <button
                              onClick={() => { if (newOption.trim()) { setNewField(f => ({ ...f, options: [...(f.options ?? []), newOption.trim()] })); setNewOption(''); } }}
                              className="px-3 py-2 bg-[#7A1F1F] text-white text-sm rounded-xl hover:opacity-90"
                            >Add</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newField.required ?? false}
                          onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
                          className="w-4 h-4 accent-[#7A1F1F] rounded"
                        />
                        <span className="text-sm font-medium text-slate-700">Required field</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (!newField.label?.trim()) return;
                          const field: RsvpField = {
                            id: `field_${Date.now()}`,
                            label: newField.label!.trim(),
                            type: newField.type ?? 'text',
                            required: newField.required ?? false,
                            placeholder: newField.placeholder,
                            options: newField.type === 'select' ? (newField.options ?? []) : undefined,
                          };
                          setRsvpFields(prev => [...prev, field]);
                          setNewField({ label: '', type: 'text', required: false, placeholder: '', options: [] });
                          setNewOption('');
                          setShowFieldBuilder(false);
                        }}
                        disabled={!newField.label?.trim()}
                        className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#7A1F1F' }}
                      >
                        Add Field
                      </button>
                      <button
                        onClick={() => { setShowFieldBuilder(false); setNewField({ label: '', type: 'text', required: false, placeholder: '', options: [] }); }}
                        className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {rsvpFields.length > 0 && (
                <p className="text-xs text-slate-400">
                  Click <strong>Save Changes</strong> at the top to apply your RSVP form updates.
                </p>
              )}
            </div>
          </div>

            )}

            {activeTab === 'team' && isOwner && (
              /* Collaborators (Owner Only) */
              <div className="space-y-6">
                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100/80 overflow-hidden">
                  {/* Card Header */}
                  <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A1F1F]/10 to-[#7A1F1F]/5 text-[#7A1F1F] flex items-center justify-center border border-[#7A1F1F]/10 shadow-sm">
                        <Users size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                          Event Team & Collaborators
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Manage who has access to coordinate and edit this specific event
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Owner View
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Scoped Security Callout */}
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 to-orange-50/40 border border-amber-200/60 text-slate-700">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield size={16} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <p className="font-bold text-amber-900">Single-Event Scoped Access</p>
                        <p className="text-slate-600 mt-0.5">
                          Collaborators invited here are strictly limited to <strong className="text-slate-800 font-bold">"{event.name}"</strong>. They will only have access to the specific modules and permissions you designate below, and cannot see your other events or account settings.
                        </p>
                      </div>
                    </div>

                    {/* Invite Section Card */}
                    <div className="bg-slate-50/70 rounded-2xl border border-slate-200/70 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <UserPlus size={14} className="text-[#7A1F1F]" />
                          Invite New Team Member
                        </h3>
                        {customInvitePerms && inviteRole === 'custom' && (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles size={11} /> Custom Permissions Set
                          </span>
                        )}
                      </div>

                      {/* Input Row 1: Email with Autocomplete */}
                      <div className="relative" ref={autocompleteContainerRef}>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 pointer-events-none text-slate-400">
                            <Users size={17} />
                          </div>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => {
                              setInviteEmail(e.target.value);
                              setShowAutocomplete(true);
                              setSelectedSuggestIndex(-1);
                            }}
                            onFocus={() => setShowAutocomplete(true)}
                            placeholder="Enter teammate's email address (e.g. sarah@example.com)"
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/10 transition-all placeholder:text-slate-400"
                            onKeyDown={e => {
                              const existingCollabEmails = new Set((collaborators || []).map((c: any) => (c.email || '').toLowerCase()));
                              if (user?.email) existingCollabEmails.add(user.email.toLowerCase());
                              const currentSuggestions = (recentContacts || []).filter(c => {
                                const em = (c.email || '').toLowerCase();
                                if (existingCollabEmails.has(em)) return false;
                                if (!inviteEmail.trim()) return true;
                                const q = inviteEmail.toLowerCase().trim();
                                return em.includes(q) || (c.name && c.name.toLowerCase().includes(q));
                              }).slice(0, 5);

                              if (e.key === 'ArrowDown' && showAutocomplete && currentSuggestions.length > 0) {
                                e.preventDefault();
                                setSelectedSuggestIndex(prev => Math.min(prev + 1, currentSuggestions.length - 1));
                              } else if (e.key === 'ArrowUp' && showAutocomplete && currentSuggestions.length > 0) {
                                e.preventDefault();
                                setSelectedSuggestIndex(prev => Math.max(prev - 1, -1));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showAutocomplete && selectedSuggestIndex >= 0 && currentSuggestions[selectedSuggestIndex]) {
                                  const sel = currentSuggestions[selectedSuggestIndex];
                                  setInviteEmail(sel.email);
                                  if (sel.role) setInviteRole(sel.role);
                                  setShowAutocomplete(false);
                                  setSelectedSuggestIndex(-1);
                                }
                              } else if (e.key === 'Escape') {
                                setShowAutocomplete(false);
                              }
                            }}
                          />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showAutocomplete && (() => {
                          const existingCollabEmails = new Set((collaborators || []).map((c: any) => (c.email || '').toLowerCase()));
                          if (user?.email) existingCollabEmails.add(user.email.toLowerCase());
                          const currentSuggestions = (recentContacts || []).filter(c => {
                            const em = (c.email || '').toLowerCase();
                            if (existingCollabEmails.has(em)) return false;
                            if (!inviteEmail.trim()) return true;
                            const q = inviteEmail.toLowerCase().trim();
                            return em.includes(q) || (c.name && c.name.toLowerCase().includes(q));
                          }).slice(0, 5);

                          if (currentSuggestions.length === 0) return null;

                          return (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 py-2 z-50 overflow-hidden">
                              <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles size={12} className="text-[#D4A24C]" /> Suggested Recent Contacts
                                </span>
                                <span className="text-[10px] lowercase font-normal">press ↑↓ or click</span>
                              </div>
                              <ul className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                                {currentSuggestions.map((contact, idx) => {
                                  const isSelected = idx === selectedSuggestIndex;
                                  const initials = contact.name
                                    ? contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    : contact.email[0].toUpperCase();
                                  return (
                                    <li
                                      key={contact.email}
                                      onMouseEnter={() => setSelectedSuggestIndex(idx)}
                                      onClick={() => {
                                        setInviteEmail(contact.email);
                                        if (contact.role) setInviteRole(contact.role);
                                        setShowAutocomplete(false);
                                        setSelectedSuggestIndex(-1);
                                      }}
                                      className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                        isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[#7A1F1F] flex items-center justify-center font-bold text-xs shadow-inner">
                                          {initials}
                                        </div>
                                        <div>
                                          {contact.name && (
                                            <p className="text-xs font-bold text-slate-800">{contact.name}</p>
                                          )}
                                          <p className="text-xs text-slate-500 font-medium">{contact.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                                          {contact.role || 'Editor'}
                                        </span>
                                        {isSelected && <Check size={14} className="text-emerald-600" />}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Input Row 2: Role Preset, Customize Button, and Submit */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1">
                          <select
                            value={inviteRole}
                            onChange={e => {
                              const r = e.target.value;
                              setInviteRole(r);
                              if (r === 'custom') {
                                setIsCustomInviteOpen(true);
                              } else {
                                setCustomInvitePerms(ROLE_PRESETS[r]?.permissions || null);
                              }
                            }}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/10 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="admin">👑 Admin / Co-Host (Full Access)</option>
                            <option value="editor">✏️ Event Editor (Full Planning)</option>
                            <option value="floor_planner">📐 Floor & Seating Planner</option>
                            <option value="guest_coordinator">👥 Guest & Check-in Coordinator</option>
                            <option value="vendor_manager">🤝 Vendor & Budget Manager</option>
                            <option value="viewer">👁️ Viewer / Staff (Read-Only)</option>
                            <option value="custom">⚙️ Custom Permissions...</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCustomInviteOpen(true)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          <Sliders size={14} className="text-[#7A1F1F]" />
                          <span>Customize Permissions</span>
                        </button>

                        <button
                          onClick={() => {
                            if (inviteEmail) {
                              setShowAutocomplete(false);
                              addCollaborator.mutate(
                                {
                                  eventId: id!,
                                  email: inviteEmail,
                                  role: inviteRole,
                                  permissions: customInvitePerms || ROLE_PRESETS[inviteRole]?.permissions || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setInviteEmail('');
                                    setCustomInvitePerms(null);
                                    setInviteRole('editor');
                                    toast.success(`Invitation delivered to ${inviteEmail}!`);
                                  },
                                }
                              );
                            }
                          }}
                          disabled={addCollaborator.isPending || !inviteEmail}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                          style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #992626 100%)' }}
                        >
                          {addCollaborator.isPending ? (
                            <>
                              <Loader2 size={15} className="animate-spin" /> Sending...
                            </>
                          ) : (
                            <>
                              <UserPlus size={15} /> Send Invitation
                            </>
                          )}
                        </button>
                      </div>

                      {addCollaborator.isError && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          {(addCollaborator.error as any)?.response?.data?.message ?? 'Could not send invite.'}
                        </p>
                      )}
                    </div>

                    {/* Team Members List */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          Current Collaborators ({collaborators?.length || 0})
                        </h3>
                      </div>

                      {isLoadingCollaborators ? (
                        <div className="flex justify-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3 text-slate-400 font-medium text-sm">
                            <Loader2 className="animate-spin text-[#7A1F1F]" size={20} />
                            Loading team members...
                          </div>
                        </div>
                      ) : collaborators && collaborators.length > 0 ? (
                        <div className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100 shadow-sm">
                          {collaborators.map((collab: any) => {
                            const isPending = collab.status === 'pending';
                            const roleKey = collab.role || 'editor';
                            const preset = ROLE_PRESETS[roleKey];
                            const perms: CollaboratorPermissions =
                              collab.permissions || preset?.permissions || ROLE_PRESETS.editor.permissions;

                            const activePermsCount = Object.values(perms).filter(Boolean).length;
                            const roleTitle = preset?.label || (roleKey === 'custom' ? 'Custom Permissions' : roleKey.charAt(0).toUpperCase() + roleKey.slice(1));

                            const name = isPending
                              ? collab.email
                              : `${collab.first_name || ''} ${collab.last_name || ''}`.trim() || collab.email;

                            const initials = isPending
                              ? '⏳'
                              : `${(collab.first_name || 'U')[0]}${(collab.last_name || 'U')[0]}`.toUpperCase();

                            return (
                              <div
                                key={collab._id}
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                              >
                                {/* Member Info */}
                                <div className="flex items-start gap-4 min-w-0">
                                  <div className="relative flex-shrink-0">
                                    <div
                                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                        isPending
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-gradient-to-br from-rose-100 to-indigo-100 text-[#7A1F1F] border border-rose-200/50'
                                      }`}
                                    >
                                      {initials}
                                    </div>
                                    {/* Status Dot */}
                                    <span
                                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                        isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                      }`}
                                      title={isPending ? 'Invite pending registration' : 'Active team member'}
                                    />
                                  </div>

                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                                      {isPending ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                                          Invite Pending
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                          Active Member
                                        </span>
                                      )}
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {roleTitle}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate">
                                      {isPending ? 'Invitation email delivered • Awaiting user sign up' : collab.email}
                                    </p>

                                    {/* Compact Capability Matrix */}
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 rounded-lg">
                                        <Shield size={11} className="text-[#7A1F1F]" />
                                        {activePermsCount === 7 ? (
                                          <span className="text-emerald-700 font-bold">Full Access (7/7 Modules)</span>
                                        ) : activePermsCount === 0 ? (
                                          <span className="text-slate-400 italic">Read-Only</span>
                                        ) : (
                                          <span>
                                            <strong className="text-slate-800">{activePermsCount} of 7</strong> Permissions Enabled
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCollab(collab)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-[#7A1F1F] hover:text-[#7A1F1F] transition-all shadow-sm"
                                  >
                                    <Shield size={13} className="text-[#7A1F1F]" />
                                    Edit Permissions
                                  </button>

                                  <button
                                    onClick={() => setCollabToRemove(collab)}
                                    disabled={removeCollaborator.isPending}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                    title="Revoke access"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 px-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80">
                          <div className="w-12 h-12 rounded-2xl bg-white text-slate-300 flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                            <Users size={24} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mb-1">No Collaborators Yet</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Invite planners, seating coordinators, or co-hosts to collaborate on this event.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Permissions Modal for Editing Collaborator */}
          {editingCollab && (
            <PermissionsModal
              isOpen={!!editingCollab}
              eventName={event?.name || 'Event'}
              collaborator={editingCollab}
              isSaving={updateCollaboratorPermissions.isPending}
              onClose={() => setEditingCollab(null)}
              onSave={(role, permissions) => {
                updateCollaboratorPermissions.mutate(
                  {
                    eventId: id!,
                    userId: editingCollab._id,
                    role,
                    permissions,
                  },
                  {
                    onSuccess: () => {
                      setEditingCollab(null);
                      toast.success('Permissions updated successfully!');
                    },
                    onError: () => {
                      toast.error('Failed to update permissions.');
                    },
                  }
                );
              }}
            />
          )}

          {/* Permissions Modal for Customizing New Invite */}
          {isCustomInviteOpen && (
            <PermissionsModal
              isOpen={isCustomInviteOpen}
              eventName={event?.name || 'Event'}
              collaborator={{
                _id: 'new_invite',
                first_name: inviteEmail ? inviteEmail.split('@')[0] : 'New',
                last_name: 'Collaborator',
                email: inviteEmail || 'team.member@example.com',
                role: inviteRole,
                permissions: customInvitePerms || ROLE_PRESETS[inviteRole]?.permissions || ROLE_PRESETS.editor.permissions,
                status: 'pending',
              }}
              isSaving={false}
              onClose={() => setIsCustomInviteOpen(false)}
              onSave={(role, permissions) => {
                setInviteRole(role);
                setCustomInvitePerms(permissions);
                setIsCustomInviteOpen(false);
                toast.success('Custom permissions configured for this invitation.');
              }}
            />
          )}

          {/* Confirm Modal for Removing Collaborator / Canceling Invite */}
          {collabToRemove && (
            <ConfirmModal
              isOpen={!!collabToRemove}
              title={collabToRemove.status === 'pending' ? 'Cancel Invitation' : 'Remove Collaborator'}
              message={
                collabToRemove.status === 'pending' ? (
                  <p>
                    Are you sure you want to cancel the invitation sent to{' '}
                    <strong className="text-slate-900 font-bold">{collabToRemove.email}</strong>? The invitation link will be immediately invalidated.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to remove{' '}
                    <strong className="text-slate-900 font-bold">
                      {collabToRemove.first_name && collabToRemove.first_name !== collabToRemove.email.split('@')[0]
                        ? `${collabToRemove.first_name} ${collabToRemove.last_name || ''}`.trim()
                        : collabToRemove.email}
                    </strong>{' '}
                    from event collaborators? They will immediately lose access to view, edit, and coordinate{' '}
                    <strong className="text-slate-900 font-bold">"{event?.name}"</strong>.
                  </p>
                )
              }
              confirmText={collabToRemove.status === 'pending' ? 'Cancel Invite' : 'Remove Member'}
              variant="danger"
              isLoading={removeCollaborator.isPending}
              onClose={() => setCollabToRemove(null)}
              onConfirm={() => {
                if (collabToRemove) {
                  removeCollaborator.mutate(
                    { eventId: id!, userId: collabToRemove._id },
                    {
                      onSuccess: () => {
                        setCollabToRemove(null);
                        toast.success(
                          collabToRemove.status === 'pending'
                            ? 'Invitation cancelled'
                            : 'Collaborator removed successfully'
                        );
                      },
                      onError: () => {
                        toast.error('Failed to remove collaborator');
                      },
                    }
                  );
                }
              }}
            />
          )}

          {/* Confirm Modal for Deleting Event */}
          {isDeleteEventOpen && (
            <ConfirmModal
              isOpen={isDeleteEventOpen}
              title="Delete Event Permanently"
              message={
                <p>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-900 font-bold">"{event?.name}"</strong>? All associated floor plan designs, tables, guest seating lists, tickets, and communications will be permanently wiped. This action <strong className="text-red-600 font-bold">cannot be undone</strong>.
                </p>
              }
              confirmText="Delete Event"
              variant="danger"
              isLoading={deleteEvent.isPending}
              onClose={() => setIsDeleteEventOpen(false)}
              onConfirm={() => {
                deleteEvent.mutate(id!, {
                  onSuccess: () => {
                    setIsDeleteEventOpen(false);
                    toast.success('Event deleted successfully');
                    navigate('/events');
                  },
                  onError: () => {
                    toast.error('Failed to delete event');
                  },
                });
              }}
            />
          )}

            {activeTab === 'danger' && isOwner && (
              /* Danger Zone (Owner Only) */
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
    </div>
  );
}
