import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, X, AlertCircle, CheckCircle2, ChevronDown, FileText, ClipboardPaste, Download } from 'lucide-react';
import type { Guest } from '../../types';

type Tab = 'csv' | 'paste';

interface ParsedRow {
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  dietary_reqs?: string;
  rsvp_status?: Guest['rsvpStatus'];
  plus_ones?: number;
  _error?: string;
}

interface ColMap {
  name: string;
  email: string;
  phone: string;
  group: string;
  dietary_reqs: string;
  rsvp_status: string;
  plus_ones: string;
}

const GUEST_FIELDS: { key: keyof ColMap; label: string; required?: boolean }[] = [
  { key: 'name',         label: 'Name',                required: true },
  { key: 'email',        label: 'Email' },
  { key: 'phone',        label: 'Phone' },
  { key: 'group',        label: 'Group / Table' },
  { key: 'dietary_reqs',label: 'Dietary Requirements' },
  { key: 'rsvp_status', label: 'RSVP Status' },
  { key: 'plus_ones',   label: '+1 Guests' },
];

const SAMPLE_CSV = `name,email,phone,group,dietary_reqs,rsvp_status,plus_ones
Jane Smith,jane@example.com,+1-555-0100,VIP,,confirmed,1
John Doe,john@example.com,,Family,Vegan,pending,0
Alice Johnson,alice@example.com,+1-555-0102,Friends,Gluten-free,confirmed,2`;

function autoMap(headers: string[]): ColMap {
  const find = (...terms: string[]) =>
    headers.find(h => terms.some(t => h.toLowerCase().includes(t))) ?? '';
  return {
    name:         find('name', 'full name', 'guest'),
    email:        find('email', 'e-mail'),
    phone:        find('phone', 'mobile', 'cell', 'tel'),
    group:        find('group', 'table', 'category'),
    dietary_reqs: find('diet', 'dietary', 'food', 'allerg'),
    rsvp_status:  find('rsvp', 'status', 'response'),
    plus_ones:    find('plus', '+1', 'additional', 'extra'),
  };
}

function normalizeRsvp(val?: string): Guest['rsvpStatus'] {
  const v = (val ?? '').toLowerCase().trim();
  if (v === 'confirmed' || v === 'yes' || v === 'attending') return 'confirmed';
  if (v === 'declined' || v === 'no'  || v === 'not attending') return 'declined';
  if (v === 'maybe'    || v === 'possibly')                      return 'maybe';
  return 'pending';
}

function buildRows(raw: Record<string, string>[], map: ColMap): ParsedRow[] {
  return raw.map(row => {
    const name = row[map.name]?.trim() ?? '';
    const errors: string[] = [];
    if (!name) errors.push('Name required');
    return {
      name,
      email:        row[map.email]?.trim()        || undefined,
      phone:        row[map.phone]?.trim()        || undefined,
      group:        row[map.group]?.trim()        || undefined,
      dietary_reqs: row[map.dietary_reqs]?.trim() || undefined,
      rsvp_status:  normalizeRsvp(row[map.rsvp_status]),
      plus_ones:    parseInt(row[map.plus_ones] ?? '0', 10) || 0,
      _error:       errors[0],
    };
  });
}

interface Props {
  eventId: string;
  onClose: () => void;
  onImport: (guests: Partial<Guest>[]) => Promise<void>;
  importing: boolean;
}

export default function ImportGuestsModal({ eventId: _eventId, onClose, onImport, importing }: Props) {
  const [tab, setTab] = useState<Tab>('csv');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<ColMap>({ name: '', email: '', phone: '', group: '', dietary_reqs: '', rsvp_status: '', plus_ones: '' });
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{ inserted: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = rawRows.length ? buildRows(rawRows, colMap) : [];
  const validRows = rows.filter(r => !r._error);
  const invalidRows = rows.filter(r => r._error);

  const parseCSV = useCallback((text: string, name = '') => {
    const parsed = Papa.parse<Record<string, string>>(text.trim(), {
      header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
    });
    const hdrs = parsed.meta.fields ?? [];
    setHeaders(hdrs);
    setRawRows(parsed.data);
    setColMap(autoMap(hdrs));
    setFileName(name);
    setResult(null);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    parseCSV(pasteText);
    setTab('csv');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!validRows.length) return;
    const guests: Partial<Guest>[] = validRows.map(r => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      group: r.group,
      dietaryReqs: r.dietary_reqs,
      rsvpStatus: r.rsvp_status ?? 'pending',
      plusOnes: r.plus_ones ?? 0,
    }));
    await onImport(guests);
    setResult({ inserted: guests.length });
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'guests-template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Guests</h2>
            <p className="text-sm text-slate-500 mt-0.5">Add up to 2,000 guests at once</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 flex-shrink-0">
          {([['csv', FileText, 'Upload CSV'], ['paste', ClipboardPaste, 'Paste Data']] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-[#7A1F1F] text-[#7A1F1F]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center py-2">
            <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#7A1F1F] transition-colors">
              <Download size={13} />
              Sample template
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* CSV upload tab */}
          {tab === 'csv' && !rawRows.length && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging ? 'border-[#7A1F1F] bg-[#7A1F1F]/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Upload size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Drop a CSV file here, or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Columns: name, email, phone, group, dietary_reqs, rsvp_status, plus_ones</p>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {/* Paste tab */}
          {tab === 'paste' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Paste tab-separated or comma-separated data from Excel or Google Sheets. The first row should be column headers.</p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={`name\temail\tphone\nJane Smith\tjane@example.com\t+1-555-0100\nJohn Doe\tjohn@example.com\t`}
                rows={10}
                className="w-full text-sm font-mono border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 resize-none"
              />
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-40 transition-colors hover:opacity-90"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                Parse Data
              </button>
            </div>
          )}

          {/* Parsed: column mapping + preview */}
          {rawRows.length > 0 && (
            <>
              {/* File name + reset */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText size={15} className="text-slate-400" />
                  {fileName || 'Pasted data'}
                  <span className="text-slate-400">·</span>
                  <span className="font-medium">{rawRows.length} rows</span>
                </div>
                <button onClick={() => { setRawRows([]); setHeaders([]); setFileName(''); setResult(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600">Start over</button>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Map columns</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GUEST_FIELDS.map(({ key, label, required }) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500 mb-0.5 block">
                        {label}{required && <span className="text-red-400"> *</span>}
                      </label>
                      <div className="relative">
                        <select
                          value={colMap[key]}
                          onChange={e => setColMap(m => ({ ...m, [key]: e.target.value }))}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 pr-6 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white appearance-none"
                        >
                          <option value="">— skip —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation summary */}
              {invalidRows.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-700">
                    <strong>{invalidRows.length}</strong> row{invalidRows.length > 1 ? 's' : ''} will be skipped (missing name).{' '}
                    <strong>{validRows.length}</strong> will be imported.
                  </span>
                </div>
              )}

              {/* Preview table */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Preview <span className="text-slate-400 font-normal">(showing first {Math.min(rows.length, 8)} of {rows.length})</span>
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Name</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Email</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Phone</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Group</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">RSVP</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">+1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 8).map((row, i) => (
                          <tr key={i} className={`border-b border-slate-100 last:border-0 ${row._error ? 'bg-red-50' : ''}`}>
                            <td className="px-3 py-2">
                              {row._error
                                ? <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} /><em>missing</em></span>
                                : <span className="font-medium text-slate-800">{row.name}</span>
                              }
                            </td>
                            <td className="px-3 py-2 text-slate-500">{row.email || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{row.phone || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{row.group || '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                row.rsvp_status === 'confirmed' ? 'bg-green-50 text-green-700' :
                                row.rsvp_status === 'declined'  ? 'bg-red-50 text-red-600'   :
                                'bg-amber-50 text-amber-700'
                              }`}>{row.rsvp_status ?? 'pending'}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">{row.plus_ones ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Success state */}
          {result && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Import complete</p>
                <p className="text-xs text-green-600">{result.inserted} guest{result.inserted !== 1 ? 's' : ''} added successfully.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400">
            {validRows.length > 0 ? <><strong className="text-slate-600">{validRows.length}</strong> guests ready to import</> : 'No data loaded'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!validRows.length || importing}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                {importing ? `Importing…` : `Import ${validRows.length > 0 ? validRows.length : ''} guests`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
