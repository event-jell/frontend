import React, { useState } from 'react';
import { Trash2, Users } from 'lucide-react';
import type { PlacedElement } from '../../types';
import { PRESET_COLORS } from '../../lib/elementTemplates';
import SeatingModal from './SeatingModal';

interface Props {
  element: PlacedElement | null;
  onChange: (updated: PlacedElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onUpdateCanvas?: (w: number, h: number) => void;
  eventId: string;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{children}</p>;
}

function Input({ value, onChange, suffix, type = 'number' }: {
  value: string | number;
  onChange: (v: string) => void;
  suffix?: string;
  type?: string;
}) {
  const [local, setLocal] = React.useState(String(typeof value === 'number' ? Math.round(value) : value));
  React.useEffect(() => {
    setLocal(String(typeof value === 'number' ? Math.round(value) : value));
  }, [value]);

  return (
    <div className="relative flex items-center">
      <input
        type={type}
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 pr-7"
      />
      {suffix && <span className="absolute right-2 text-xs text-slate-400 font-medium">{suffix}</span>}
    </div>
  );
}

function DonutChart({ value, max, color = '#7A1F1F' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? value / max : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle
          cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

export default function RightPanel({ element, onChange, onDelete, onDuplicate, canvasWidth, canvasHeight, onUpdateCanvas, eventId }: Props) {
  const [width, setWidth] = React.useState(224);
  const isDragging = React.useRef(false);
  const [isSeatingModalOpen, setIsSeatingModalOpen] = useState(false);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Calculate width from the right edge of the window
      const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const resizer = (
    <div
      className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-10 flex justify-center group"
      onMouseDown={() => { isDragging.current = true; document.body.style.cursor = 'col-resize'; }}
    >
      <div className="w-[2px] h-full group-hover:bg-[#7A1F1F] transition-colors opacity-60" />
    </div>
  );
  if (!element) {
    return (
      <aside style={{ width }} className="relative bg-white border-l border-slate-100 flex flex-col flex-shrink-0 shadow-sm select-none">
        {resizer}
        <div className="px-4 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Canvas Properties</h3>
        </div>
        <div className="px-4 py-4 border-b border-slate-100">
          <Label>Floor Dimensions</Label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Width</p>
              <Input value={Math.round((canvasWidth || 800) / 40)} onChange={v => onUpdateCanvas?.(Number(v) * 40, canvasHeight || 600)} suffix="ft" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Height</p>
              <Input value={Math.round((canvasHeight || 600) / 40)} onChange={v => onUpdateCanvas?.(canvasWidth || 800, Number(v) * 40)} suffix="ft" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Adjust the physical dimensions of your venue floor plan.</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center opacity-50">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">🖱️</div>
          <p className="text-xs text-slate-500 leading-relaxed">Select an element on the canvas to edit its properties</p>
        </div>
      </aside>
    );
  }

  const update = (patch: Partial<PlacedElement>) => onChange({ ...element, ...patch });
  const PX_PER_FT = 40;

  return (
    <aside style={{ width }} className="relative bg-white border-l border-slate-100 flex flex-col flex-shrink-0 shadow-sm overflow-y-auto select-none">
      {resizer}
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: element.color + '22' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: element.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={element.label}
            onChange={e => update({ label: e.target.value })}
            className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-slate-50 rounded px-1"
          />
          <p className="text-xs text-slate-400 px-1 capitalize">{element.type.replace(/_/g, ' ')} · General Seating</p>
        </div>
        <button onClick={() => onDelete(element.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Transform */}
      <div className="px-4 py-4 border-b border-slate-100">
        <Label>Transform</Label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">X</p>
            <Input value={Math.round(element.x / PX_PER_FT)} onChange={v => update({ x: Number(v) * PX_PER_FT })} suffix="ft" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Y</p>
            <Input value={Math.round(element.y / PX_PER_FT)} onChange={v => update({ y: Number(v) * PX_PER_FT })} suffix="ft" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">W</p>
            <Input value={Math.round(element.width / PX_PER_FT)} onChange={v => update({ width: Number(v) * PX_PER_FT })} suffix="ft" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">H</p>
            <Input value={Math.round(element.height / PX_PER_FT)} onChange={v => update({ height: Number(v) * PX_PER_FT })} suffix="ft" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">↺</span>
          <Input
            value={Math.round(element.rotation)}
            onChange={v => update({ rotation: Number(v) })}
            suffix="°"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="px-4 py-4 border-b border-slate-100">
        <Label>Appearance</Label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => update({ color: c })}
              className="w-7 h-7 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: c,
                outline: element.color === c ? `2.5px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
          <label className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer text-slate-400 hover:border-slate-500 transition-colors text-lg leading-none">
            +
            <input type="color" className="sr-only" value={element.color} onChange={e => update({ color: e.target.value })} />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex-shrink-0">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((element.opacity !== undefined ? element.opacity : 1) * 100)}
            onChange={e => update({ opacity: parseInt(e.target.value, 10) / 100 })}
            className="flex-1 h-1.5 accent-[#7A1F1F]"
          />
          <span className="text-xs font-medium text-slate-600 w-10 text-right">
            {Math.round((element.opacity !== undefined ? element.opacity : 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Seating — only for table/chair elements */}
      {element.capacity !== undefined && element.capacity >= 0 && (
        <div className="px-4 py-4 border-b border-slate-100 space-y-3">
          <Label>Seating</Label>

          {/* Capacity input */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Total seats</span>
            <input
              type="number"
              min="0"
              max="200"
              value={element.capacity}
              onChange={e => onChange({ ...element, capacity: parseInt(e.target.value, 10) || 0 })}
              className="w-14 text-center text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg py-1 focus:outline-none focus:border-[#7A1F1F] focus:ring-2 focus:ring-[#7A1F1F]/20"
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
            <DonutChart value={element.seated} max={element.capacity} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {element.seated} <span className="font-normal text-slate-500">of</span> {element.capacity} assigned
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {Math.max(0, element.capacity - element.seated)} seats open
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSeatingModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7A1F1F]/5 hover:bg-[#7A1F1F]/10 border border-[#7A1F1F]/20 text-xs font-bold text-[#7A1F1F] transition-colors"
          >
            <Users size={13} />
            Manage Seating
          </button>

          {isSeatingModalOpen && (
            <SeatingModal
              element={element}
              eventId={eventId}
              onClose={() => setIsSeatingModalOpen(false)}
              onSave={(assignments) => {
                onChange({
                  ...element,
                  seatAssignments: assignments,
                  seated: assignments.length,
                });
              }}
            />
          )}
        </div>
      )}

      {/* Notes */}
      <div className="px-4 py-4">
        <Label>Notes</Label>
        <textarea
          value={element.notes}
          onChange={e => update({ notes: e.target.value })}
          placeholder="No notes yet. Double-click to add setup instructions, vendor details, or accessibility flags."
          rows={4}
          className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 placeholder:text-slate-400"
        />
      </div>

      {/* Duplicate */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onDuplicate(element.id)}
          className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Duplicate element
        </button>
      </div>
    </aside>
  );
}
