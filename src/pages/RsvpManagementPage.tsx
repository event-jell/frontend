import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import { useGuests } from '../hooks/useGuests';
import SEO from '../components/SEO';
import { 
  QrCode, Copy, Check, Share2, Users, CheckCircle2, XCircle, 
  HelpCircle, Eye, Download, FileSpreadsheet, RefreshCw, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function RsvpManagementPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: isLoadingEvent } = useEvent(id!);
  const { data: guests = [], isLoading: isLoadingGuests } = useGuests(id!);
  const updateEvent = useUpdateEvent();

  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rsvpUrl = `${window.location.origin}/events/${event?.slug || id}/rsvp`;
  const qrPngUrl = `/api/events/${event?.slug || id}/qr-code`;
  const qrSvgUrl = `/api/events/${event?.slug || id}/qr-code?format=svg`;

  const stats = useMemo(() => {
    const total = guests.length;
    const attending = guests.filter(g => g.rsvpStatus === 'confirmed').length;
    const declined = guests.filter(g => g.rsvpStatus === 'declined').length;
    const maybe = guests.filter(g => g.rsvpStatus === 'maybe').length;
    const scans = event?.qrScans || 0;
    const conversionRate = scans > 0 ? Math.round((total / scans) * 100) : 0;

    return { total, attending, declined, maybe, scans, conversionRate };
  }, [guests, event]);

  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      const matchesStatus = filterStatus === 'all' || g.rsvpStatus === filterStatus;
      const matchesSearch = 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.phone?.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [guests, filterStatus, searchQuery]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rsvpUrl);
    setCopied(true);
    toast.success('RSVP Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join our event: ${event?.name}`,
        text: `RSVP to ${event?.name} here:`,
        url: rsvpUrl,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  const handleToggleRsvp = () => {
    if (!event) return;
    const newStatus = !event.rsvpDisabled;
    updateEvent.mutate({
      id: event._id,
      data: { rsvpDisabled: newStatus }
    }, {
      onSuccess: () => {
        toast.success(newStatus ? 'RSVP Submissions Frozen' : 'RSVP Submissions Restored');
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Guests Count', 'Dietary Requirements', 'Notes', 'Custom Answers'];
    const rows = guests.map(g => [
      g.name,
      g.email || '',
      g.phone || '',
      g.rsvpStatus,
      g.plusOnes,
      g.dietaryReqs || '',
      g.notes || '',
      JSON.stringify(g.customFields || {})
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.name || 'event'}_rsvps.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQR = async (format: 'png' | 'svg') => {
    const url = format === 'svg' ? qrSvgUrl : qrPngUrl;
    toast.loading('Preparing QR code download...');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${event?.slug || 'event'}_rsvp_qr.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.dismiss();
      toast.success('QR Code downloaded!');
    } catch {
      toast.dismiss();
      toast.error('Failed to download QR code. Please try again.');
    }
  };

  if (isLoadingEvent || isLoadingGuests) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#7A1F1F]/20 border-t-[#7A1F1F] rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center text-slate-400">
        Event not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 py-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEO title={`${event.name} - RSVP & QR Manager`} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-black text-[#7A1F1F] tracking-widest uppercase bg-[#FAF0E8] px-2.5 py-1 rounded-full">
            RSVP Dashboard
          </span>
          <h1 className="text-2xl font-extrabold text-slate-850 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            RSVP & QR Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track invitation scan rates, collect guest details, and manage check-in passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/events/${event.slug || id}/rsvp`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-150 text-slate-600 text-xs font-bold rounded-xl transition-all border border-slate-200"
          >
            <Eye size={14} /> Preview Form
          </Link>
          <button
            onClick={handleToggleRsvp}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
              event.rsvpDisabled
                ? 'bg-emerald-50 border-emerald-250 text-emerald-600 hover:bg-emerald-100'
                : 'bg-red-50 border-red-250 text-red-650 hover:bg-red-100'
            }`}
          >
            {event.rsvpDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
            {event.rsvpDisabled ? 'Resume RSVPs' : 'Freeze RSVPs'}
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">QR Scans</span>
            <QrCode size={18} className="text-[#D4A24C]" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.scans}</p>
          <p className="text-[10px] text-slate-400 mt-1">Unique QR codes scanned</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">RSVP Submissions</span>
            <Users size={18} className="text-[#7A1F1F]" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total guests responded</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Conversion Rate</span>
            <RefreshCw size={16} className="text-emerald-500 animate-spin-slow" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.conversionRate}%</p>
          <p className="text-[10px] text-slate-400 mt-1">Scans to RSVP conversion</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Attending</span>
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.attending}</p>
          <p className="text-[10px] text-slate-400 mt-1">Confirmed attendee guests</p>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code and Sharing Actions */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-850">Unique Invitation QR Code</h2>
          
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-150 rounded-2xl">
            <img src={qrPngUrl} alt="Event RSVP QR" className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-slate-100" />
            <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-3 tracking-widest">
              Scan to Register Attendance
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Public RSVP URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={rsvpUrl}
                  className="flex-1 px-3 py-2 bg-slate-55 border border-slate-200 rounded-xl text-xs text-slate-500 select-all outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-slate-100 hover:bg-slate-150 rounded-xl text-slate-650 transition-colors border border-slate-200"
                  title="Copy Link"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareLink}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <Share2 size={13} /> Share Link
              </button>
              <div className="relative group">
                <button
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-850 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-900 transition-colors"
                >
                  <Download size={13} /> Export QR
                </button>
                <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 min-w-[120px] z-20">
                  <button
                    onClick={() => handleDownloadQR('png')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-650 font-bold hover:bg-slate-50 rounded-lg"
                  >
                    As PNG
                  </button>
                  <button
                    onClick={() => handleDownloadQR('svg')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-650 font-bold hover:bg-slate-50 rounded-lg"
                  >
                    As SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest responses Table */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-slate-850">Response Feed</h2>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 text-xs font-bold rounded-xl transition-all border border-emerald-150 w-fit"
            >
              <FileSpreadsheet size={13} /> Export RSVPs (CSV)
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]"
            />
            <div className="sm:col-span-2 flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'confirmed', 'maybe', 'declined'].map(st => {
                const label = st === 'all' ? 'All RSVPs' : st === 'confirmed' ? 'Attending' : st === 'maybe' ? 'Maybe' : 'Declined';
                return (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                      filterStatus === st
                        ? 'bg-slate-850 text-white border-slate-850'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-450 uppercase">
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">RSVP Status</th>
                  <th className="py-3 px-4">Plus-ones</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Date Responded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuests.length > 0 ? (
                  filteredGuests.map(g => (
                    <tr key={g._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{g.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          g.rsvpStatus === 'confirmed'
                            ? 'bg-green-50 text-green-600'
                            : g.rsvpStatus === 'maybe'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-650'
                        }`}>
                          {g.rsvpStatus === 'confirmed' ? 'Attending' : g.rsvpStatus === 'maybe' ? 'Maybe' : 'Declined'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-500">
                        {g.rsvpStatus === 'confirmed' ? `+ ${g.plusOnes || 0}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-700">{g.email || 'No email'}</p>
                        {g.phone && <p className="text-[10px] text-slate-400 mt-0.5">{g.phone}</p>}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-400">
                        {g.dateResponded 
                          ? new Date(g.dateResponded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                      No guests match the search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
