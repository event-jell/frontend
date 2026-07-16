import { useState, useRef, useEffect } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const R = '#7A1F1F';
const RD = '#9c3030';
const G = '#D4A24C';

interface DatePickerProps {
  value: string; // 'yyyy-MM-dd' or ''
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'Select a date' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const pick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (selected) setViewDate(selected); }}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all text-left"
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? format(selected, 'EEE, MMM d, yyyy') : placeholder}
        </span>
        <Calendar size={15} className="text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-[300px] rounded-2xl shadow-2xl border overflow-hidden"
          style={{ background: '#FDFBF8', borderColor: '#EFEAE2' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}>
            <button type="button" onClick={() => setViewDate(v => subMonths(v, 1))}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-white">{format(viewDate, 'MMMM yyyy')}</span>
            <button type="button" onClick={() => setViewDate(v => addMonths(v, 1))}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {weekdayLabels.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-semibold text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {days.map(day => {
                const inMonth = isSameMonth(day, viewDate);
                const isSelected = selected && isSameDay(day, selected);
                const todayFlag = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => pick(day)}
                    className="flex items-center justify-center"
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all ${
                        !inMonth ? 'text-slate-300' : isSelected ? 'text-white font-semibold' : todayFlag ? 'font-semibold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      style={
                        isSelected
                          ? { background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }
                          : todayFlag && inMonth
                            ? { color: R, boxShadow: `inset 0 0 0 1.5px ${G}` }
                            : undefined
                      }
                    >
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #EFEAE2' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              Clear
            </button>
            <button
              type="button"
              onClick={() => { const t = new Date(); setViewDate(t); pick(t); }}
              className="text-xs font-semibold transition-colors"
              style={{ color: R }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
