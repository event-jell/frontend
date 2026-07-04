import { Undo2, Redo2, MousePointer2, Hand, Square, Minus, Plus, Maximize2, Grid3X3, Ruler, AlignLeft, AlignCenterHorizontal, Lock, Layers, Download, Share2 } from 'lucide-react';
import type { PresenceUser } from '../../hooks/usePresence';

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
}: Props) {
  return (
    <div className="bg-white border-b border-slate-100 flex-shrink-0 shadow-sm">
      {/* Top row: breadcrumb + project info + actions */}
      <div className="flex items-center px-4 h-11 border-b border-slate-50 gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer">🏠</span>
          <span className="text-slate-300">›</span>
          <span className="hover:text-slate-800 cursor-pointer">Events</span>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-800">Floor Plan</span>
        </div>

        <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-100">
          <div className="w-6 h-6 rounded-md bg-[#7A1F1F] flex items-center justify-center text-white text-xs font-bold">LC</div>
          <div>
            <span className="text-sm font-semibold text-slate-800">{eventName}</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xs text-slate-500">{planName}</span>
          </div>
          <span className="text-slate-400 text-xs">∨</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-4 ml-4 text-sm text-slate-600">
          {['File', 'Edit', 'View', 'Insert', 'Help'].map(item => (
            <button key={item} className="hover:text-slate-900 transition-colors">{item}</button>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Online users */}
          {onlineUsers.length > 0 && (
            <div className="flex -space-x-1.5" title={`${onlineUsers.length} user${onlineUsers.length > 1 ? 's' : ''} online`}>
              {onlineUsers.slice(0, 5).map(u => (
                <div
                  key={u.socketId}
                  title={`${u.name} (online)`}
                  className="relative w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-default"
                  style={{ backgroundColor: u.color }}
                >
                  {u.initials}
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
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
