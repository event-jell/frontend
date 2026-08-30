import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, Calendar, Users, Layout, Ticket, Store,
  MessageSquare, BarChart2, Settings, ChevronRight, ChevronLeft,
  Menu, X, PanelLeftClose, PanelLeftOpen,
  ChevronsUpDown, Bell, Star, QrCode, LayoutDashboard, Wallet,
  Grid, Plus, Folder, Crown, Wand2, Trash2, UserPlus, Info, Search, HelpCircle, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent, useEvents } from '../hooks/useEvents';
import Logo from '../components/Logo';

const R = '#7A1F1F';
const RD = '#3D0F0F';
const G  = '#D4A24C';

interface Props { children: React.ReactNode }

export default function AppShell({ children }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [secondaryPaneOpen, setSecondaryPaneOpen] = useState(true);
  const [showStarTip, setShowStarTip] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  // Fetch recent events for the workspace panel
  const { data: eventsData } = useEvents();
  const events = eventsData || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  const eventMatch = location.pathname.match(/^\/events\/([^/]+)/);
  const matchedId = eventMatch?.[1] === 'new' ? undefined : eventMatch?.[1];
  const eventId = matchedId ?? params.id;
  const inEventSuite = Boolean(eventId);

  // Fetch event details or read from cache
  const { data: fetchedEvent } = useEvent(eventId || '');
  const cachedEvent = eventId
    ? (queryClient.getQueryData<{ name?: string }>(['events', eventId]) ??
       (queryClient.getQueryData<{ _id?: string; slug?: string; name?: string }[]>(['events']) ?? []).find(
         (e: any) => e._id === eventId || e.slug === eventId,
       ))
    : undefined;
  const event = fetchedEvent || (cachedEvent as any);
  const eventName = event?.name;

  // URL rewrite for slugs
  useEffect(() => {
    if (event?.slug && params.id && params.id !== event.slug) {
      const newPath = location.pathname.replace(`/events/${params.id}`, `/events/${event.slug}`);
      navigate(newPath + location.search + location.hash, { replace: true });
    }
  }, [event, params.id, location.pathname, location.search, location.hash, navigate]);

  const slugOrId = event?.slug || eventId;

  // Left Narrow Sidebar links
  const NARROW_NAV = [
    { icon: Home, label: 'Home', to: '/dashboard', activePath: '/dashboard' },
    { icon: Calendar, label: 'Events', to: '/events', activePath: '/events' },
    { icon: Store, label: 'Vendors', to: '/vendor/listings', activePath: '/vendor/listings' },
    { icon: MessageSquare, label: 'Messages', to: '/messages', activePath: '/messages' },
    { icon: Wallet, label: 'Wallet', to: '/wallet', activePath: '/wallet' },
    { icon: Settings, label: 'Settings', to: '/settings', activePath: '/settings' },
  ];

  // Event Suite navigation inside Expanded Pane
  const SUITE_NAV = slugOrId ? [
    { icon: Home,          label: 'Overview',         to: `/events/${slugOrId}`,           end: true },
    { icon: Layout,        label: 'Floor Plan',       to: `/events/${slugOrId}/planner` },
    { icon: Users,         label: 'Guests',           to: `/events/${slugOrId}/guests` },
    { icon: Ticket,        label: 'Ticketing & QR',   to: `/events/${slugOrId}/ticketing` },
    { icon: QrCode,        label: 'Check-In Scanner', to: `/events/${slugOrId}/checkin` },
    { icon: Store,         label: 'Event Vendors',    to: `/events/${slugOrId}/vendors` },
    { icon: MessageSquare, label: 'Broadcast Comms',  to: `/events/${slugOrId}/event-com` },
    { icon: BarChart2,     label: 'Reports & Ledger', to: `/events/${slugOrId}/reports` },
    { icon: Settings,      label: 'Event Settings',   to: `/events/${slugOrId}/settings` },
  ] : [];

  const handleCreateEvent = () => {
    setCreateMenuOpen(false);
    navigate('/events/new');
  };

  const handleCreateListing = () => {
    setCreateMenuOpen(false);
    navigate('/vendor/listings/new');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200" onClick={closeMobile} />
      )}

      {/* DUAL-PANE SIDEBAR (Desktop always, Mobile slides in) */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-shrink-0 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* PANE 1: Narrow Left Sidebar (Canva Style) */}
        <aside className="w-[72px] h-full bg-[#FCFBFA] border-r border-slate-200/80 flex flex-col items-center py-4 justify-between z-10 select-none">
          <div className="w-full flex flex-col items-center gap-1">
            {/* Top Toggle Button */}
            <button
              onClick={() => setSecondaryPaneOpen(!secondaryPaneOpen)}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              title={secondaryPaneOpen ? 'Collapse panel' : 'Expand panel'}
            >
              {secondaryPaneOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            {/* Create Dropdown Wrapper */}
            <div className="relative mt-3 mb-2" ref={createRef}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="w-11 h-11 rounded-full bg-[#7A1F1F] hover:bg-[#661919] text-white flex items-center justify-center shadow-lg shadow-[#7A1F1F]/20 transition-all active:scale-95"
                title="Create New"
              >
                <Plus size={22} />
              </button>
              <span className="text-[10px] font-bold text-slate-500 mt-1 block text-center">Create</span>

              {createMenuOpen && (
                <div className="absolute left-full ml-2 top-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleCreateEvent}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    ✦ Create New Event
                  </button>
                  <button
                    onClick={handleCreateListing}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    ✦ Create Vendor Listing
                  </button>
                </div>
              )}
            </div>

            {/* Narrow Links */}
            <div className="w-full flex flex-col items-center gap-1.5 px-2 mt-2">
              {NARROW_NAV.map((item) => {
                const isActive = location.pathname.startsWith(item.activePath);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className="w-full flex flex-col items-center group relative py-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#FAF0E8] text-[#7A1F1F]'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon size={20} />
                    </div>
                    <span
                      className={`text-[9px] font-bold mt-1 text-center truncate w-full px-0.5 ${
                        isActive ? 'text-[#7A1F1F]' : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Narrow Bottom Icons */}
          <div className="w-full flex flex-col items-center gap-4 relative" ref={menuRef}>
            {/* Bell/Notification */}
            <button className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white" />
            </button>

            {/* Profile Dropdown Trigger */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold relative hover:ring-2 hover:ring-[#7A1F1F]/20 transition-all"
              style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #a33838 100%)' }}
            >
              <span>{userInitials}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute left-full bottom-0 ml-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2.5 w-60 z-50 text-left text-slate-800 animate-in fade-in slide-in-from-left-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'Guest User'}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/events'); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    My Events
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1.5 flex items-center gap-1.5 border-t border-slate-100 pt-2"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* PANE 2: Contextual Expanded Pane (Canva Style) */}
        <aside
          className={`h-full bg-[#FAF9F6] border-r border-slate-200/80 flex flex-col z-0 select-none overflow-hidden transition-all duration-300 ease-in-out ${
            secondaryPaneOpen ? 'w-[240px]' : 'w-0 border-r-0'
          }`}
        >
          {/* Header Panel */}
          <div className="p-4 border-b border-slate-200/60 flex items-center justify-between min-h-[64px]">
            {inEventSuite ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => navigate('/events')}
                  className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Back to all events"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-800 truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {eventName || 'Event Suite'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <Logo size={28} />
                <span className="text-xs font-black text-[#7A1F1F] tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
                  EventJelly
                </span>
              </div>
            )}
            <button className="p-1 rounded-lg lg:hidden text-slate-400 hover:text-slate-600" onClick={closeMobile}>
              <X size={16} />
            </button>
          </div>

          {/* Main Contextual Scroll Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {inEventSuite ? (
              /* Scenario A: Inside an Event Suite */
              <div className="space-y-1.5">
                {/* Invite collaborators button inside the event */}
                <button
                  onClick={() => navigate(`/events/${slugOrId}/settings`)}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs mb-3 transition-colors"
                >
                  <UserPlus size={14} className="text-[#7A1F1F]" />
                  <span>Invite people</span>
                </button>

                {SUITE_NAV.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#FAF0E8] text-[#7A1F1F]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                      }`}
                    >
                      <item.icon size={15} className={isActive ? 'text-[#7A1F1F]' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ) : (
              /* Scenario B: Global Workspace View */
              <div className="space-y-4">
                {/* Global Invite Button */}
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <UserPlus size={14} className="text-[#7A1F1F]" />
                  <span>Invite people</span>
                </button>

                {/* Star design tip box */}
                {showStarTip && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 relative space-y-1 shadow-2xs">
                    <button
                      onClick={() => setShowStarTip(false)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span>Star events and plans</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Star your most important items by selecting the star icon next to them in Projects.
                    </p>
                  </div>
                )}

                {/* Recent Events Section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Recent designs
                  </span>
                  {events.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic px-1">No recent events created.</p>
                  ) : (
                    <div className="space-y-1">
                      {events.slice(0, 5).map((e) => (
                        <button
                          key={e._id}
                          onClick={() => {
                            closeMobile();
                            navigate(`/events/${e.slug || e._id}`);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 hover:bg-slate-200/40 rounded-xl transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-[#7A1F1F] text-xs flex-shrink-0">
                            {e.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-slate-800 block truncate">
                              {e.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
                              {e.venue}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Section */}
          <div className="p-3 border-t border-slate-200/60 flex items-center justify-between text-slate-400 text-[10px] font-semibold">
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
            >
              <Trash2 size={13} />
              <span>Trash</span>
            </button>
            <span>v0.32.0</span>
          </div>
        </aside>
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Header (replaces standard desktop header) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 bg-[#7A1F1F] border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1 rounded-lg text-white/80 hover:text-white">
              <Menu size={20} />
            </button>
            <Logo size={24} />
            <span className="text-sm font-black text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              EventJelly
            </span>
          </div>
          <button className="p-1 rounded-lg text-white/80 hover:text-white relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
          </button>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto flex flex-col pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar matching Canva mobile style */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-35 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        >
          {inEventSuite ? (
            <>
              <NavLink
                to={`/events/${slugOrId}`}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Home size={18} />
                <span className="text-[10px]">Overview</span>
              </NavLink>

              <NavLink
                to={`/events/${slugOrId}/guests`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Users size={18} />
                <span className="text-[10px]">Guests</span>
              </NavLink>

              <NavLink
                to={`/events/${slugOrId}/planner`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Layout size={18} />
                <span className="text-[10px]">Floor Plan</span>
              </NavLink>

              <NavLink
                to={`/events/${slugOrId}/ticketing`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Ticket size={18} />
                <span className="text-[10px]">Tickets</span>
              </NavLink>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Menu size={18} />
                <span className="text-[10px]">Menu</span>
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                <span className="text-[10px]">Overview</span>
              </NavLink>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Calendar size={18} />
                <span className="text-[10px]">Events</span>
              </NavLink>

              <NavLink
                to="/vendor/listings"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Store size={18} />
                <span className="text-[10px]">Vendor Hub</span>
              </NavLink>

              <NavLink
                to="/wallet"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-[#7A1F1F] font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <Wallet size={18} />
                <span className="text-[10px]">Wallet</span>
              </NavLink>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Menu size={18} />
                <span className="text-[10px]">Menu</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap" style={{ color: '#8A8A8A' }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={13} style={{ color: '#D1C4B8' }} />}
          {item.to ? (
            <NavLink to={item.to} className="hover:text-slate-700 transition-colors">{item.label}</NavLink>
          ) : (
            <span className="font-semibold" style={{ color: '#2A2A2A' }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
