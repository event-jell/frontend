import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ELEMENT_TEMPLATES, CATEGORIES, CATEGORY_LABELS } from '../../lib/elementTemplates';
import type { ElementTemplate, ElementCategory } from '../../types';

interface Props {
  onAdd: (template: ElementTemplate) => void;
}

// SVG icons for each element type
function ElementIcon({ type, color }: { type: string; color: string }) {
  const c = color === 'transparent' ? '#94A3B8' : color;
  const props = { fill: 'none', stroke: c, strokeWidth: 2 };

  switch (type) {
    case 'table_round':
    case 'table_cocktail':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <circle cx="16" cy="16" r="11" {...props} />
          <circle cx="16" cy="5" r="2.5" fill={c} stroke="none" />
          <circle cx="27" cy="16" r="2.5" fill={c} stroke="none" />
          <circle cx="16" cy="27" r="2.5" fill={c} stroke="none" />
          <circle cx="5" cy="16" r="2.5" fill={c} stroke="none" />
        </svg>
      );
    case 'table_banquet':
    case 'table_square':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="6" y="11" width="20" height="10" rx="2" {...props} />
          <rect x="9" y="7" width="4" height="4" rx="1" fill={c} stroke="none" />
          <rect x="15" y="7" width="4" height="4" rx="1" fill={c} stroke="none" />
          <rect x="9" y="21" width="4" height="4" rx="1" fill={c} stroke="none" />
          <rect x="15" y="21" width="4" height="4" rx="1" fill={c} stroke="none" />
        </svg>
      );
    case 'stage':
    case 'head_table':
    case 'riser':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="4" y="10" width="24" height="12" rx="2" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="2" />
        </svg>
      );
    case 'dance_floor':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke={c} strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      );
    case 'podium':
    case 'chair':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="10" y="6" width="12" height="8" rx="2" {...props} />
          <rect x="8" y="14" width="16" height="10" rx="2" {...props} />
          <line x1="10" y1="24" x2="10" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="24" x2="22" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'exit':
    case 'security':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="4" y="8" width="24" height="16" rx="2" fill="none" stroke={c} strokeWidth="2" strokeDasharray="4 3" />
          <text x="16" y="20" textAnchor="middle" fill={c} fontSize="8" fontWeight="bold">EXIT</text>
        </svg>
      );
    case 'bar':
    case 'buffet':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="4" y="12" width="24" height="10" rx="2" fill={c} opacity="0.15" stroke={c} strokeWidth="2" />
          <line x1="4" y1="16" x2="28" y2="16" stroke={c} strokeWidth="1.5" />
        </svg>
      );
    case 'speaker':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="10" y="6" width="12" height="20" rx="3" {...props} />
          <circle cx="16" cy="14" r="3" {...props} />
          <circle cx="16" cy="22" r="1.5" {...props} />
        </svg>
      );
    case 'projector':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="6" y="12" width="20" height="10" rx="3" {...props} />
          <circle cx="12" cy="17" r="2" {...props} />
          <line x1="20" y1="22" x2="16" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="22" x2="28" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect x="8" y="8" width="16" height="16" rx="3" {...props} />
        </svg>
      );
  }
}

export default function ElementPanel({ onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [width, setWidth] = useState(176);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, w: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const newWidth = Math.max(120, Math.min(400, dragStart.current.w + dx));
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
      className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-10 flex justify-center group"
      onMouseDown={(e) => { 
        isDragging.current = true; 
        dragStart.current = { x: e.clientX, w: width };
        document.body.style.cursor = 'col-resize'; 
      }}
    >
      <div className="w-[2px] h-full group-hover:bg-[#7A1F1F] transition-colors opacity-60" />
    </div>
  );

  const filtered = search
    ? ELEMENT_TEMPLATES.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const renderCategory = (cat: ElementCategory) => {
    const items = (filtered ?? ELEMENT_TEMPLATES).filter(t => t.category === cat);
    if (!items.length) return null;
    
    const cols = width > 320 ? 4 : width > 240 ? 3 : 2;

    return (
      <div key={cat}>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 py-2 mt-1">
          {CATEGORY_LABELS[cat]}
        </h4>
        <div 
          className="grid gap-1.5 px-2" 
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {items.map(template => (
            <button
              key={template.type}
              onClick={() => onAdd(template)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10">
                <ElementIcon type={template.type} color={template.defaultColor} />
              </div>
              <span className="text-xs text-slate-600 font-medium leading-tight">{template.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside style={{ width }} className="relative bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm select-none">
      {resizer}
      {/* Search */}
      <div className="p-2.5 border-b border-slate-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search elements"
            className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map(cat => renderCategory(cat))}
      </div>
    </aside>
  );
}
