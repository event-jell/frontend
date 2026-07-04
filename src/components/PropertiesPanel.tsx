import type { PlacedElement } from '../types';

interface Props {
  element: PlacedElement | null;
  onChange: (updated: PlacedElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30"
    />
  );
}

export default function PropertiesPanel({
  element,
  onChange,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}: Props) {
  if (!element) {
    return (
      <aside className="w-56 bg-white border-l border-slate-100 flex flex-col shadow-sm">
        <div className="px-4 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A1F1F' }}>Properties</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2">
          <div className="text-3xl opacity-20">🖱️</div>
          <p className="text-xs text-slate-400 text-center">Select an element to edit its properties</p>
        </div>
      </aside>
    );
  }

  const update = (patch: Partial<PlacedElement>) => onChange({ ...element, ...patch });

  return (
    <aside className="w-56 bg-white border-l border-slate-100 flex flex-col overflow-y-auto shadow-sm">
      <div className="px-4 py-4 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A1F1F' }}>Properties</h3>
        <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{element.label}</p>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <Field label="Label">
          <input
            value={element.label}
            onChange={e => update({ label: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30"
          />
        </Field>

        <Field label="Color">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={element.color}
              onChange={e => update({ color: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5"
            />
            <span className="text-xs font-mono text-slate-500">{element.color}</span>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <NumInput value={element.x} onChange={v => update({ x: v })} min={0} />
          </Field>
          <Field label="Y">
            <NumInput value={element.y} onChange={v => update({ y: v })} min={0} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="W">
            <NumInput value={element.width} onChange={v => update({ width: v })} min={10} />
          </Field>
          <Field label="H">
            <NumInput value={element.height} onChange={v => update({ height: v })} min={10} />
          </Field>
        </div>

        <Field label="Rotation °">
          <NumInput value={element.rotation} onChange={v => update({ rotation: v })} min={-360} max={360} />
        </Field>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onBringForward(element.id)}
              className="text-xs py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              ↑ Forward
            </button>
            <button
              onClick={() => onSendBackward(element.id)}
              className="text-xs py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              ↓ Backward
            </button>
          </div>

          <button
            onClick={() => onDuplicate(element.id)}
            className="w-full text-xs py-2 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#EF9F27', color: 'white' }}
          >
            Duplicate
          </button>

          <button
            onClick={() => onDelete(element.id)}
            className="w-full text-xs py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}
