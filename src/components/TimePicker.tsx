import { useState, useRef, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';

const R = '#7A1F1F';
const RD = '#3D0F0F';
const G = '#D4A24C';

interface TimePickerProps {
  value: string; // 'HH:mm' e.g. '18:00' or '09:30' or ''
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const MINUTES = ['00', '15', '30', '45'];

const PRESETS = [
  { label: 'Morning', value: '09:00' },
  { label: 'Noon', value: '12:00' },
  { label: 'Afternoon', value: '15:00' },
  { label: 'Evening', value: '18:00' },
  { label: 'Night', value: '20:00' },
];

function parse24to12(time24: string) {
  if (!time24) return { hour: '06', minute: '00', period: 'PM' as 'AM' | 'PM' };
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 18;
  const m = mStr || '00';
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  const hour12Str = h12 < 10 ? `0${h12}` : `${h12}`;
  return { hour: hour12Str, minute: m, period };
}

function format12to24(hour12: string, minute: string, period: 'AM' | 'PM'): string {
  let h = parseInt(hour12, 10);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const h24Str = h < 10 ? `0${h}` : `${h}`;
  return `${h24Str}:${minute}`;
}

function formatDisplayTime(time24: string): string {
  if (!time24) return '';
  const { hour, minute, period } = parse24to12(time24);
  return `${hour}:${minute} ${period}`;
}

export default function TimePicker({ value, onChange, placeholder = 'Select time', className = '' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { hour, minute, period } = parse24to12(value);

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

  const selectHour = (h: string) => {
    const next24 = format12to24(h, minute, period);
    onChange(next24);
  };

  const selectMinute = (m: string) => {
    const next24 = format12to24(hour, m, period);
    onChange(next24);
  };

  const selectPeriod = (p: 'AM' | 'PM') => {
    const next24 = format12to24(hour, minute, p);
    onChange(next24);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold transition-all text-left outline-none ${
          open ? 'bg-white border-[#7A1F1F] ring-4 ring-[#7A1F1F]/10' : 'hover:bg-slate-100/60'
        } ${className}`}
      >
        <span className={value ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>
          {value ? formatDisplayTime(value) : placeholder}
        </span>
        <Clock size={16} className={`transition-colors ${open ? 'text-[#7A1F1F]' : 'text-slate-400'}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[280px] rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ background: '#FDFBF8', borderColor: '#EFEAE2' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between text-white" style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}>
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#D4A24C]" />
              <span className="text-xs font-bold uppercase tracking-wider">Select Time</span>
            </div>
            <span className="text-sm font-extrabold tracking-wide" style={{ color: G }}>
              {formatDisplayTime(value || '18:00')}
            </span>
          </div>

          {/* Time Picker Columns */}
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2 font-bold text-slate-400 uppercase tracking-wider">
              <span>Hour</span>
              <span>Min</span>
              <span>Period</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Hour Column */}
              <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {HOURS.map(h => {
                  const active = hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => selectHour(h)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#7A1F1F] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              {/* Minute Column */}
              <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {MINUTES.map(m => {
                  const active = minute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMinute(m)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#7A1F1F] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      :{m}
                    </button>
                  );
                })}
              </div>

              {/* AM / PM Column */}
              <div className="space-y-2 flex flex-col justify-center">
                {(['AM', 'PM'] as const).map(p => {
                  const active = period === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => selectPeriod(p)}
                      className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                        active
                          ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Quick Select
              </span>
              <div className="flex flex-wrap gap-1">
                {PRESETS.map(pr => (
                  <button
                    key={pr.value}
                    type="button"
                    onClick={() => {
                      onChange(pr.value);
                      setOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      value === pr.value
                        ? 'bg-[#7A1F1F] text-white border-[#7A1F1F]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#7A1F1F] hover:underline flex items-center gap-1"
            >
              Done <Check size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
