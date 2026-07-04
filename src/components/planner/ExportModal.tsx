import { useState } from 'react';
import { X, Download } from 'lucide-react';

type Format = 'pdf' | 'png' | 'svg' | 'excel';
type Paper = 'a4' | 'a3' | 'custom';
type Orientation = 'landscape' | 'portrait';

interface Props {
  planName: string;
  onClose: () => void;
}

const FORMAT_ICONS: Record<Format, string> = {
  pdf: '📄',
  png: '🖼️',
  svg: '⬡',
  excel: '⊞',
};

export default function ExportModal({ planName, onClose }: Props) {
  const [format, setFormat] = useState<Format>('pdf');
  const [paper, setPaper] = useState<Paper>('a3');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [includeGuests, setIncludeGuests] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeQr, setIncludeQr] = useState(true);

  function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
    return (
      <div className="flex items-center justify-between py-2.5">
        <span className="text-sm text-slate-700">{label}</span>
        <button
          onClick={onChange}
          className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-[#7A1F1F]' : 'bg-slate-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[90vh] overflow-hidden flex">
        {/* Left panel - options */}
        <div className="w-64 border-r border-slate-100 flex flex-col overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Export</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {(['pdf', 'png', 'svg', 'excel'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    format === f ? 'border-[#7A1F1F] bg-[#FAF7F2]' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-lg">{FORMAT_ICONS[f]}</span>
                  <span className="text-xs font-semibold uppercase text-slate-700">{f}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Paper & Scale</p>
            <div className="flex gap-2 mb-3">
              {(['a4', 'a3', 'custom'] as Paper[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPaper(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all uppercase ${
                    paper === p ? 'border-[#7A1F1F] bg-[#FAF7F2] text-[#7A1F1F]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              {(['landscape', 'portrait'] as Orientation[]).map(o => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all capitalize ${
                    orientation === o ? 'border-[#7A1F1F] bg-[#FAF7F2] text-[#7A1F1F]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {o === 'landscape' ? '⊡' : '▭'} {o}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Scale</span>
              <span className="font-medium text-slate-800">1 in = 4 ft</span>
            </div>
          </div>

          <div className="px-5 py-2 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2 mb-1">Include</p>
            <Toggle value={includeLegend} onChange={() => setIncludeLegend(v => !v)} label="Legend & table list" />
            <Toggle value={includeGuests} onChange={() => setIncludeGuests(v => !v)} label="Guest names on tables" />
            <Toggle value={includeGrid} onChange={() => setIncludeGrid(v => !v)} label="Measurement grid" />
            <Toggle value={includeQr} onChange={() => setIncludeQr(v => !v)} label="QR for mobile view" />
          </div>

          <div className="px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3">
              {paper.toUpperCase()} {orientation} · {format.toUpperCase()} · ~1.2 MB · 1 page
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Preview print
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                <Download size={12} />
                Export {format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Right - preview */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xs aspect-[4/3] p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{planName}</h3>
                <p className="text-xs text-slate-500">Grand Ballroom · Main Hall · 140 seats · Scale 1 in = 4 ft</p>
              </div>
              <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">QR</div>
            </div>

            {/* Mini floor plan */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-[#f8fafc] relative">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                {/* Stage */}
                <rect x="95" y="10" width="110" height="28" rx="3" fill="#1E3A8A" />
                <text x="150" y="28" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">STAGE</text>
                {/* Head table */}
                <rect x="95" y="44" width="110" height="20" rx="2" fill="#3B5BDB" />
                <text x="150" y="57" textAnchor="middle" fill="white" fontSize="6" fontWeight="600">HEAD TABLE</text>
                {/* Dance floor */}
                <rect x="95" y="70" width="110" height="60" rx="2" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" />
                <text x="150" y="103" textAnchor="middle" fill="#94A3B8" fontSize="6">DANCE FLOOR</text>
                {/* Tables */}
                {[[55,75],[75,75],[55,105],[75,105],[55,135],[75,135],[205,75],[225,75],[205,105],[225,105],[205,135],[225,135],[130,145],[170,145]].map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r="13" fill="none" stroke="#7A1F1F" strokeWidth="1.5" />
                ))}
                {/* Bars */}
                <rect x="30" y="160" width="60" height="16" rx="2" fill="none" stroke="#EF9F27" strokeWidth="1.5" />
                <text x="60" y="171" textAnchor="middle" fill="#EF9F27" fontSize="6">BAR</text>
                <rect x="210" y="160" width="60" height="16" rx="2" fill="none" stroke="#EF9F27" strokeWidth="1.5" />
                <text x="240" y="171" textAnchor="middle" fill="#EF9F27" fontSize="6">BAR</text>
                {/* Buffet */}
                <rect x="95" y="160" width="110" height="16" rx="2" fill="none" stroke="#EF9F27" strokeWidth="1.5" />
                <text x="150" y="171" textAnchor="middle" fill="#EF9F27" fontSize="6">BUFFET</text>
                {/* Entrance */}
                <rect x="105" y="182" width="90" height="14" rx="2" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" />
                <text x="150" y="192" textAnchor="middle" fill="#94A3B8" fontSize="5">MAIN ENTRANCE</text>
                {/* Exit signs */}
                <rect x="4" y="110" width="24" height="14" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" strokeDasharray="2 2" />
                <text x="16" y="120" textAnchor="middle" fill="#DC2626" fontSize="5">EXIT</text>
                <rect x="272" y="110" width="24" height="14" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" strokeDasharray="2 2" />
                <text x="284" y="120" textAnchor="middle" fill="#DC2626" fontSize="5">EXIT</text>
              </svg>
            </div>

            {/* Legend */}
            {includeLegend && (
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {[['#7A1F1F','Tables (14)'],['#1E3A8A','Stage'],['#EF9F27','Bar / Buffet'],['#DC2626','Exit / Security']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
