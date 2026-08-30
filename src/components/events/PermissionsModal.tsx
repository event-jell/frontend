import { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Check,
  Calendar,
  Layers,
  Users,
  Ticket,
  Briefcase,
  Megaphone,
  UserPlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { CollaboratorPermissions, Collaborator } from '../../types';

export const ROLE_PRESETS: Record<
  string,
  { label: string; description: string; permissions: CollaboratorPermissions }
> = {
  admin: {
    label: 'Admin / Co-Host',
    description: 'Full administrative access across all event modules and team management.',
    permissions: {
      canEditDetails: true,
      canManageFloorPlan: true,
      canManageGuests: true,
      canManageTickets: true,
      canManageVendors: true,
      canManageComms: true,
      canManageTeam: true,
    },
  },
  editor: {
    label: 'Event Editor',
    description: 'Full planning, floor plan, and guest access. Cannot manage team permissions.',
    permissions: {
      canEditDetails: true,
      canManageFloorPlan: true,
      canManageGuests: true,
      canManageTickets: true,
      canManageVendors: true,
      canManageComms: true,
      canManageTeam: false,
    },
  },
  floor_planner: {
    label: 'Floor & Seating Planner',
    description: 'Specialized for floor plan designer, table arrangement, and guest seating.',
    permissions: {
      canEditDetails: false,
      canManageFloorPlan: true,
      canManageGuests: true,
      canManageTickets: false,
      canManageVendors: false,
      canManageComms: false,
      canManageTeam: false,
    },
  },
  guest_coordinator: {
    label: 'Guest & Check-in Coordinator',
    description: 'Manage guest lists, attendee check-in, and guest broadcast communications.',
    permissions: {
      canEditDetails: false,
      canManageFloorPlan: false,
      canManageGuests: true,
      canManageTickets: false,
      canManageVendors: false,
      canManageComms: true,
      canManageTeam: false,
    },
  },
  vendor_manager: {
    label: 'Vendor & Budget Manager',
    description: 'Manage vendor directory, contracts, quotes, and event details.',
    permissions: {
      canEditDetails: true,
      canManageFloorPlan: false,
      canManageGuests: false,
      canManageTickets: false,
      canManageVendors: true,
      canManageComms: false,
      canManageTeam: false,
    },
  },
  viewer: {
    label: 'Viewer / Staff',
    description: 'Read-only observation access. Cannot modify layout, guests, or event data.',
    permissions: {
      canEditDetails: false,
      canManageFloorPlan: false,
      canManageGuests: false,
      canManageTickets: false,
      canManageVendors: false,
      canManageComms: false,
      canManageTeam: false,
    },
  },
};

const PERMISSION_DEFINITIONS = [
  {
    key: 'canEditDetails' as keyof CollaboratorPermissions,
    label: 'Event Details & Settings',
    description: 'Edit event name, dates, time, venue, cover banner, and RSVP settings.',
    icon: Calendar,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    key: 'canManageFloorPlan' as keyof CollaboratorPermissions,
    label: 'Floor Plan & Stage Designer',
    description: 'Design 2D layout canvas, place/move tables, stages, booths, and elements.',
    icon: Layers,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    key: 'canManageGuests' as keyof CollaboratorPermissions,
    label: 'Guest List & Seating',
    description: 'Add, import, and edit guests, assign seats to tables, and check-in attendees.',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    key: 'canManageTickets' as keyof CollaboratorPermissions,
    label: 'Tickets & Pricing',
    description: 'Create and manage ticket tiers, capacities, and pricing structures.',
    icon: Ticket,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    key: 'canManageVendors' as keyof CollaboratorPermissions,
    label: 'Vendors & Budget',
    description: 'Manage vendor contacts, quotes, status, and track event expense budgets.',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    key: 'canManageComms' as keyof CollaboratorPermissions,
    label: 'Communications & Broadcasts',
    description: 'Compose and dispatch email/SMS broadcast announcements to guests.',
    icon: Megaphone,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    key: 'canManageTeam' as keyof CollaboratorPermissions,
    label: 'Team & Collaborator Access',
    description: 'Invite additional team members and manage collaborator permissions.',
    icon: UserPlus,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
  },
];

interface Props {
  collaborator: Collaborator;
  eventName: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (role: string, permissions: CollaboratorPermissions) => void;
}

export default function PermissionsModal({
  collaborator,
  eventName,
  isOpen,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const initialRole = collaborator.role || 'editor';
  const initialPerms: CollaboratorPermissions = collaborator.permissions ||
    ROLE_PRESETS[initialRole]?.permissions ||
    ROLE_PRESETS.editor.permissions;

  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(initialPerms);

  useEffect(() => {
    if (isOpen) {
      const r = collaborator.role || 'editor';
      setSelectedRole(r);
      setPermissions(
        collaborator.permissions ||
        ROLE_PRESETS[r]?.permissions ||
        ROLE_PRESETS.editor.permissions
      );
    }
  }, [isOpen, collaborator]);

  if (!isOpen) return null;

  const handleRoleChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    if (roleKey !== 'custom' && ROLE_PRESETS[roleKey]) {
      setPermissions({ ...ROLE_PRESETS[roleKey].permissions });
    }
  };

  const handleTogglePermission = (key: keyof CollaboratorPermissions) => {
    const updated = {
      ...permissions,
      [key]: !permissions[key],
    };
    setPermissions(updated);

    // Check if updated matches any preset
    let matchingPreset = 'custom';
    for (const [rKey, rVal] of Object.entries(ROLE_PRESETS)) {
      const isMatch = (Object.keys(rVal.permissions) as (keyof CollaboratorPermissions)[]).every(
        k => rVal.permissions[k] === updated[k]
      );
      if (isMatch) {
        matchingPreset = rKey;
        break;
      }
    }
    setSelectedRole(matchingPreset);
  };

  const handleSelectAll = (val: boolean) => {
    const updated: CollaboratorPermissions = {
      canEditDetails: val,
      canManageFloorPlan: val,
      canManageGuests: val,
      canManageTickets: val,
      canManageVendors: val,
      canManageComms: val,
      canManageTeam: val,
    };
    setPermissions(updated);
    setSelectedRole(val ? 'admin' : 'viewer');
  };

  const name = collaborator.first_name && collaborator.first_name !== collaborator.email.split('@')[0]
    ? `${collaborator.first_name} ${collaborator.last_name || ''}`.trim()
    : collaborator.email;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#FAF7F2] to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#9c3030] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-900/10">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Collaborator Permissions
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure what <strong className="text-slate-700">{name}</strong> can do and undo on "{eventName}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-[#7A1F1F] flex items-center justify-center font-bold text-xs shadow-inner">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{name}</p>
              <p className="text-xs text-slate-500 font-medium">{collaborator.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {collaborator.status === 'pending' ? (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Invite Pending
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Active Member
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Role Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#D4A24C]" /> Role Preset
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-xs font-semibold text-[#7A1F1F] hover:underline"
                >
                  Grant All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(ROLE_PRESETS).map(([rKey, rVal]) => {
                const isSelected = selectedRole === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleRoleChange(rKey)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#7A1F1F] bg-rose-50/40 ring-2 ring-[#7A1F1F]/10 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#7A1F1F]' : 'text-slate-800'}`}>
                        {rVal.label}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {rVal.description}
                    </p>
                  </button>
                );
              })}

              {/* Custom Preset Pill */}
              <button
                type="button"
                onClick={() => setSelectedRole('custom')}
                className={`p-3 rounded-2xl border text-left transition-all sm:col-span-2 ${
                  selectedRole === 'custom'
                    ? 'border-[#7A1F1F] bg-rose-50/40 ring-2 ring-[#7A1F1F]/10 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold ${selectedRole === 'custom' ? 'text-[#7A1F1F]' : 'text-slate-800'}`}>
                    Custom Permissions
                  </span>
                  {selectedRole === 'custom' && (
                    <div className="w-4 h-4 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Custom combination of toggles configured below.
                </p>
              </button>
            </div>
          </div>

          {/* Granular Toggles */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Module Permissions
            </h3>

            <div className="space-y-2.5">
              {PERMISSION_DEFINITIONS.map(item => {
                const isEnabled = !!permissions[item.key];
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() => handleTogglePermission(item.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                      isEnabled
                        ? 'border-emerald-200/90 bg-emerald-50/20 hover:bg-emerald-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 pr-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5 ${item.color}`}>
                        <IconComponent size={15} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isEnabled ? 'text-slate-900' : 'text-slate-600'}`}>
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 p-0.5 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSave(selectedRole, permissions)}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7A1F1F, #9c3030)' }}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Check size={14} /> Save Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
