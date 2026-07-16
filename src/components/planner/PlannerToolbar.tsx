import { useEffect, useRef, useState } from 'react';
import { Undo2, Redo2, MousePointer2, Hand, Square, Minus, Plus, Maximize2, Grid3X3, Ruler, AlignLeft, AlignCenterHorizontal, Lock, Layers, Download, Share2, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PresenceUser } from '../../hooks/usePresence';
import { ELEMENT_TEMPLATES, CATEGORIES, CATEGORY_LABELS } from '../../lib/elementTemplates';
import type { ElementTemplate } from '../../types';
import { useCollaborators, useRemoveCollaborator, useUpdateCollaboratorRole } from '../../hooks/useEvents';
import type { Room } from './StatusBar';

export type ToolMode = 'select' | 'pan' | 'frame';

interface Props {
  activeTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  rulersEnabled: boolean;
  onRulersToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onShare: () => void;
  planName: string;
  eventName: string;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onToggleLock?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  hasSelection?: boolean;
  onlineUsers?: PresenceUser[];
  onBringToFront?: () => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
  onNewRoom?: () => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onAddElement?: (template: ElementTemplate) => void;
  eventId?: string;
  isOwner?: boolean;
  currentUserId?: string;
  rooms?: Room[];
  activeRoomId?: string;
  onRoomChange?: (id: string) => void;
  onAddRoom?: () => void;
  onDeleteRoom?: (id: string) => void;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type MenuName = 'file' | 'edit' | 'view' | 'insert' | 'help';

function MenuAction({ onClick, disabled, checked, children }: {
  onClick: () => void;
  disabled?: boolean;
  checked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded-md transition-colors ${
        disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {checked !== undefined && <span className="w-3 text-[#7A1F1F]">{checked ? '✓' : ''}</span>}
      <span>{children}</span>
    </button>
  );
}

type Collaborator = { _id: string; first_name: string; last_name: string; email: string; role: 'editor' | 'viewer' };

function UserPopover({ user, eventId, isOwner, isSelf, collab, onClose }: {
  user: PresenceUser;
  eventId?: string;
  isOwner: boolean;
  isSelf: boolean;
  collab?: Collaborator;
  onClose: () => void;
}) {
  const updateRole = useUpdateCollaboratorRole();
  const removeCollaborator = useRemoveCollaborator();
  const canManage = isOwner && !isSelf && !!collab && !!eventId;

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-slate-100">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: user.color }}
        >
          {user.initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">{user.name}{isSelf ? ' (you)' : ''}</div>
          <div className="text-xs text-slate-500 truncate">{collab?.email ?? (isSelf ? '' : 'Owner')}</div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online now
        </div>
        {canManage ? (
          <>
            <label className="block text-xs font-medium text-slate-500 mt-2">Permission</label>
            <select
              value={collab.role}
              disabled={updateRole.isPending}
              onChange={e => updateRole.mutate({ eventId: eventId!, userId: user.id, role: e.target.value as 'editor' | 'viewer' })}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              onClick={() => {
                if (window.confirm(`Remove ${user.name}'s access to this event?`)) {
                  removeCollaborator.mutate({ eventId: eventId!, userId: user.id }, { onSuccess: onClose });
                }
              }}
              disabled={removeCollaborator.isPending}
              className="w-full flex items-center justify-center gap-1.5 mt-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {removeCollaborator.isPending && <Loader2 size={12} className="animate-spin" />}
              Remove access
            </button>
          </>
        ) : collab ? (
          <div className="text-xs text-slate-500">{collab.role === 'viewer' ? 'Can view' : 'Can edit'}</div>
        ) : null}
      </div>
    </div>
  );
}

function ToolBtn({ active, disabled, onClick, title, children }: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
        disabled 
          ? 'opacity-40 cursor-not-allowed text-slate-400' 
          : active
            ? 'bg-[#7A1F1F] text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

export default function PlannerToolbar({
  activeTool, onToolChange, zoom,
  onZoomIn, onZoomOut, onFit,
  snapEnabled, onSnapToggle,
  rulersEnabled, onRulersToggle,
  onUndo, onRedo, canUndo, canRedo,
  onExport, onShare, planName, eventName,
  onAlignLeft, onAlignCenter, onToggleLock, onBringToFront,
  darkMode, onToggleDarkMode, hasSelection, onlineUsers = [],
  onSaveTemplate, onLoadTemplate,
  onNewRoom, onDeleteSelected, onDuplicateSelected, onAddElement,
  eventId, isOwner, currentUserId,
  rooms = [], activeRoomId, onRoomChange, onAddRoom, onDeleteRoom,
}: Props) {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [floorMenuOpen, setFloorMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const floorMenuRef = useRef<HTMLDivElement>(null);
  const { data: collaborators } = useCollaborators(eventId ?? '');

  useEffect(() => {
    if (!openMenu && !openUserId && !floorMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setOpenUserId(null);
      if (floorMenuRef.current && !floorMenuRef.current.contains(e.target as Node)) setFloorMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenu(null); setOpenUserId(null); setFloorMenuOpen(false); }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenu, openUserId, floorMenuOpen]);

  const navBtnClass = (name: MenuName) =>
    `px-2 py-1 rounded-md transition-colors ${openMenu === name ? 'bg-slate-100 text-slate-900' : 'hover:text-slate-900'}`;

  return (
    <div className="bg-white border-b border-slate-100 flex-shrink-0 shadow-sm">
      {/* Top row: breadcrumb + project info + actions */}
      <div className="flex items-center px-4 h-11 border-b border-slate-50 gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer">{t('planner.toolbar_home')}</span>
          <span className="text-slate-300">›</span>
          <span className="hover:text-slate-800 cursor-pointer">{t('planner.toolbar_events')}</span>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-800">{t('planner.toolbar_floor_plan')}</span>
        </div>

        <div className="relative" ref={floorMenuRef}>
          <button
            onClick={() => setFloorMenuOpen(o => !o)}
            className="flex items-center gap-2 ml-3 pl-3 py-1 pr-2 border-l border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-[#7A1F1F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initialsFor(eventName || 'Event')}
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-slate-800">{eventName}</span>
              <span className="text-slate-300 mx-1">·</span>
              <span className="text-xs text-slate-500">{planName}</span>
            </div>
            <span className={`text-slate-400 text-xs transition-transform ${floorMenuOpen ? 'rotate-180' : ''}`}>∨</span>
          </button>

          {floorMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Floors</div>
              {rooms.map(room => (
                <div key={room.id} className="group flex items-center">
                  <button
                    onClick={() => { onRoomChange?.(room.id); setFloorMenuOpen(false); }}
                    className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded-md transition-colors ${
                      room.id === activeRoomId ? 'text-[#7A1F1F] font-semibold bg-[#FAF7F2]' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: room.id === activeRoomId ? '#7A1F1F' : '#94A3B8' }}
                    />
                    <span className="truncate">{room.name}</span>
                  </button>
                  <button
                    onClick={() => { onDeleteRoom?.(room.id); setFloorMenuOpen(false); }}
                    className="opacity-0 group-hover:opacity-100 mr-2 p-1 rounded hover:bg-red-100 hover:text-red-500 transition-all text-slate-300"
                    title="Delete floor"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <MenuAction onClick={() => { onAddRoom?.(); setFloorMenuOpen(false); }}>+ New Floor</MenuAction>
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-4 text-sm text-slate-600" ref={menuRef}>
          {/* File */}
          <div className="relative">
            <button onClick={() => setOpenMenu(m => m === 'file' ? null : 'file')} className={navBtnClass('file')}>File</button>
            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <MenuAction onClick={() => { onNewRoom?.(); setOpenMenu(null); }}>New Room</MenuAction>
                <MenuAction onClick={() => { onLoadTemplate?.(); setOpenMenu(null); }}>Load Template…</MenuAction>
                <MenuAction onClick={() => { onSaveTemplate?.(); setOpenMenu(null); }}>Save as Template</MenuAction>
                <div className="h-px bg-slate-100 my-1" />
                <MenuAction onClick={() => { onExport(); setOpenMenu(null); }}>Export…</MenuAction>
                <MenuAction onClick={() => { onShare(); setOpenMenu(null); }}>Share…</MenuAction>
              </div>
            )}
          </div>

          {/* Edit */}
          <div className="relative">
            <button onClick={() => setOpenMenu(m => m === 'edit' ? null : 'edit')} className={navBtnClass('edit')}>Edit</button>
            {openMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <MenuAction onClick={() => { onUndo(); setOpenMenu(null); }} disabled={!canUndo}>Undo</MenuAction>
                <MenuAction onClick={() => { onRedo(); setOpenMenu(null); }} disabled={!canRedo}>Redo</MenuAction>
                <div className="h-px bg-slate-100 my-1" />
                <MenuAction onClick={() => { onDuplicateSelected?.(); setOpenMenu(null); }} disabled={!hasSelection}>Duplicate</MenuAction>
                <MenuAction onClick={() => { onDeleteSelected?.(); setOpenMenu(null); }} disabled={!hasSelection}>Delete</MenuAction>
              </div>
            )}
          </div>

          {/* View */}
          <div className="relative">
            <button onClick={() => setOpenMenu(m => m === 'view' ? null : 'view')} className={navBtnClass('view')}>View</button>
            {openMenu === 'view' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <MenuAction onClick={() => { onZoomIn(); setOpenMenu(null); }}>Zoom In</MenuAction>
                <MenuAction onClick={() => { onZoomOut(); setOpenMenu(null); }}>Zoom Out</MenuAction>
                <MenuAction onClick={() => { onFit(); setOpenMenu(null); }}>Fit to Screen</MenuAction>
                <div className="h-px bg-slate-100 my-1" />
                <MenuAction onClick={() => { onSnapToggle(); setOpenMenu(null); }} checked={snapEnabled}>Snap to Grid</MenuAction>
                <MenuAction onClick={() => { onRulersToggle(); setOpenMenu(null); }} checked={rulersEnabled}>Rulers</MenuAction>
                <MenuAction onClick={() => { onToggleDarkMode?.(); setOpenMenu(null); }} checked={!!darkMode}>Dark Mode</MenuAction>
              </div>
            )}
          </div>

          {/* Insert */}
          <div className="relative">
            <button onClick={() => setOpenMenu(m => m === 'insert' ? null : 'insert')} className={navBtnClass('insert')}>Insert</button>
            {openMenu === 'insert' && (
              <div className="absolute left-0 top-full mt-1 w-56 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                {CATEGORIES.map(cat => (
                  <div key={cat}>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    {ELEMENT_TEMPLATES.filter(tpl => tpl.category === cat).map(tpl => (
                      <MenuAction key={tpl.type} onClick={() => { onAddElement?.(tpl); setOpenMenu(null); }}>
                        {tpl.label}
                      </MenuAction>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <div className="relative">
            <button onClick={() => setOpenMenu(m => m === 'help' ? null : 'help')} className={navBtnClass('help')}>Help</button>
            {openMenu === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-2 px-3 z-50 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 mb-1">Keyboard shortcuts</div>
                <div className="flex justify-between"><span>Select tool</span><span className="font-mono text-slate-400">V</span></div>
                <div className="flex justify-between"><span>Pan tool</span><span className="font-mono text-slate-400">H</span></div>
                <div className="flex justify-between"><span>Frame tool</span><span className="font-mono text-slate-400">F</span></div>
                <div className="flex justify-between"><span>Undo</span><span className="font-mono text-slate-400">Ctrl+Z</span></div>
                <div className="flex justify-between"><span>Redo</span><span className="font-mono text-slate-400">Ctrl+Y</span></div>
                <div className="flex justify-between"><span>Zoom in / out</span><span className="font-mono text-slate-400">+ / -</span></div>
                <div className="flex justify-between"><span>Delete element</span><span className="font-mono text-slate-400">Del</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Online users */}
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-1.5" ref={userMenuRef}>
              {onlineUsers.slice(0, 5).map(u => (
                <div key={u.socketId} className="relative">
                  <button
                    onClick={() => setOpenUserId(id => id === u.id ? null : u.id)}
                    title={`${u.name} (online)`}
                    className="relative w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:ring-2 hover:ring-slate-300 transition-all"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.initials}
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                  </button>
                  {openUserId === u.id && (
                    <UserPopover
                      user={u}
                      eventId={eventId}
                      isOwner={!!isOwner}
                      isSelf={u.id === currentUserId}
                      collab={collaborators?.find(c => c._id === u.id)}
                      onClose={() => setOpenUserId(null)}
                    />
                  )}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={onToggleDarkMode} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button
            onClick={onLoadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Templates
          </button>
          <button
            onClick={onSaveTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Save as Template
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90" style={{ backgroundColor: '#7A1F1F' }}
          >
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      {/* Tool row */}
      <div className="flex items-center px-4 h-10 gap-2">
        {/* Undo/Redo */}
        <div className="flex gap-0.5">
          <ToolBtn onClick={onUndo} title="Undo (Ctrl+Z)" active={false}>
            <Undo2 size={15} className={canUndo ? '' : 'opacity-30'} />
          </ToolBtn>
          <ToolBtn onClick={onRedo} title="Redo (Ctrl+Y)" active={false}>
            <Redo2 size={15} className={canRedo ? '' : 'opacity-30'} />
          </ToolBtn>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Tool selection */}
        <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
          <ToolBtn active={activeTool === 'select'} onClick={() => onToolChange('select')} title="Select (V)">
            <MousePointer2 size={14} />
          </ToolBtn>
          <ToolBtn active={activeTool === 'pan'} onClick={() => onToolChange('pan')} title="Hand / Pan (H)">
            <Hand size={14} />
          </ToolBtn>
          <ToolBtn active={activeTool === 'frame'} onClick={() => onToolChange('frame')} title="Frame (F)">
            <Square size={14} />
          </ToolBtn>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={onZoomOut} title="Zoom out (-)">
            <Minus size={14} />
          </ToolBtn>
          <span className="text-xs font-semibold text-slate-700 w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <ToolBtn onClick={onZoomIn} title="Zoom in (+)">
            <Plus size={14} />
          </ToolBtn>
          <button
            onClick={onFit}
            className="flex items-center gap-1 px-2 h-8 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Maximize2 size={12} />
            Fit
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Snap & Rulers */}
        <button
          onClick={onSnapToggle}
          className={`flex items-center gap-1.5 px-2.5 h-8 text-xs font-medium rounded-lg transition-all ${
            snapEnabled ? 'bg-[#FAF7F2] text-[#7A1F1F]' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Grid3X3 size={13} />
          Snap {snapEnabled ? 'on' : 'off'}
        </button>
        <button
          onClick={onRulersToggle}
          className={`flex items-center gap-1.5 px-2.5 h-8 text-xs font-medium rounded-lg transition-all ${
            rulersEnabled ? 'bg-[#FAF7F2] text-[#7A1F1F]' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Ruler size={13} />
          Rulers
        </button>

        {/* Right alignment tools */}
        <div className="ml-auto flex items-center gap-0.5">
          <ToolBtn disabled={!hasSelection} onClick={() => onAlignLeft?.()} title="Align left edge"><AlignLeft size={14} /></ToolBtn>
          <ToolBtn disabled={!hasSelection} onClick={() => onAlignCenter?.()} title="Align center horizontally"><AlignCenterHorizontal size={14} /></ToolBtn>
          <ToolBtn disabled={!hasSelection} onClick={() => onToggleLock?.()} title="Lock/Unlock"><Lock size={14} /></ToolBtn>
          <ToolBtn disabled={!hasSelection} onClick={() => onBringToFront?.()} title="Bring to front"><Layers size={14} /></ToolBtn>
        </div>
      </div>
    </div>
  );
}
