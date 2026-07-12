import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, Calendar, Users, Layout, Ticket, Store,
  MessageSquare, BarChart2, Settings, ChevronRight,
  Menu, X, LayoutGrid, PanelLeftClose, PanelLeftOpen,
  ChevronsUpDown, Bell, Star, Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import PreferencesModal from '../components/PreferencesModal';

const R = '#7A1F1F';
const RD = '#3D0F0F';
const G  = '#D4A24C';

function NavItem({
  icon: Icon, label, to, badge, onClick, collapsed, end: endProp,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
  onClick?: () => void;
  collapsed?: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={endProp}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 outline-none ${
          collapsed ? 'justify-center px-0' : ''
        } ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/8'}`
      }
      style={({ isActive }) =>
        isActive
          ? { background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 2px 12px rgba(122,31,31,0.4)` }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && badge != null && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
              isActive ? 'bg-white/20 text-white' : 'text-white/50'
            }`} style={!isActive ? { background: 'rgba(255,255,255,0.1)' } : {}}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="h-4" />;
  return (
    <p className="px-2.5 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-widest select-none"
      style={{ color: 'rgba(212,162,76,0.55)' }}>
      {children}
    </p>
  );
}

interface Props { children: React.ReactNode }

export default function AppShell({ children }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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
  const eventId = eventMatch?.[1] ?? params.id;
  const inEventSuite = Boolean(eventId);

  const GLOBAL_NAV = [
    { icon: LayoutGrid, label: 'Floor Plans', to: '/floor-plans', end: true },
    { icon: Calendar,   label: 'All Events',  to: '/events',      end: true },
  ];

  const SUITE_NAV = eventId ? [
    { icon: Home,          label: 'Dashboard',  to: `/events/${eventId}`,           end: true },
    { icon: Layout,        label: 'Planner',    to: `/events/${eventId}/planner` },
    { icon: Users,         label: 'Guests',     to: `/events/${eventId}/guests` },
    { icon: Ticket,        label: 'Ticketing',  to: `/events/${eventId}/ticketing` },
    { icon: Store,         label: 'Vendors',    to: `/events/${eventId}/vendors` },
    { icon: MessageSquare, label: 'Event Com',  to: `/events/${eventId}/event-com` },
    { icon: BarChart2,     label: 'Reports',    to: `/events/${eventId}/reports` },
    { icon: Settings,      label: 'Settings',   to: `/events/${eventId}/settings` },
  ] : [];

  const sidebarWidth = collapsed ? 'w-[52px]' : 'w-[172px]';

  const Sidebar = (
    <aside className={[
      'fixed lg:static inset-y-0 left-0 z-40 flex flex-col flex-shrink-0',
      'transition-all duration-300 ease-in-out',
      sidebarWidth,
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ].join(' ')}
      style={{ background: RD, borderRight: '1px solid rgba(212,162,76,0.1)' }}>

      {/* Header */}
      <div className={`py-4 flex items-center gap-2.5 ${collapsed ? 'px-0 justify-center' : 'px-3'}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-tight truncate"
              style={{ fontFamily: 'Playfair Display, serif' }}>EventJelly</p>
          </div>
        )}
        <button className="p-1 rounded-lg lg:hidden" style={{ color: 'rgba(255,255,255,0.4)' }} onClick={closeMobile}>
          <X size={15} />
        </button>
        <button
          className="hidden lg:flex p-1 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-2 flex flex-col overflow-y-auto overflow-x-hidden ${collapsed ? 'px-1' : 'px-2'}`}>
        {inEventSuite ? (
          <>
            <SectionLabel collapsed={collapsed}>Event</SectionLabel>
            {SUITE_NAV.map(item => (
              <NavItem key={item.to} {...item} onClick={closeMobile} collapsed={collapsed} />
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <NavItem icon={LayoutGrid} label="All Plans"  to="/floor-plans" end onClick={closeMobile} collapsed={collapsed} />
              <NavItem icon={Calendar}   label="All Events" to="/events"      end onClick={closeMobile} collapsed={collapsed} />
            </div>
          </>
        ) : (
          <>
            <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
            {GLOBAL_NAV.map(item => (
              <NavItem key={item.to} {...item} onClick={closeMobile} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className={`p-2 space-y-0.5 relative`}
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} ref={menuRef}>
        <NavItem icon={Settings} label="Settings" to="/settings" onClick={closeMobile} collapsed={collapsed} />
        <button
          onClick={() => setPrefsOpen(true)}
          title={collapsed ? t('common.language') : undefined}
          className={`w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-white/50 hover:text-white/80 hover:bg-white/8 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Globe size={15} className="flex-shrink-0" />
          {!collapsed && <span className="flex-1 truncate text-left">{t('common.language')}</span>}
        </button>

        {/* User menu popup */}
        {userMenuOpen && (
          <div className={`absolute bottom-full mb-2 ${collapsed ? 'left-2 w-64' : 'left-2 right-2'} rounded-xl overflow-hidden z-50 shadow-2xl`}
            style={{ background: 'white', border: '1px solid rgba(122,31,31,0.1)' }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg,${RD},${R})` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${G},${R})` }}>
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user ? `${user.firstName} ${user.lastName}` : t('common.guest')}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email || ''}</p>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                style={{ background: 'rgba(212,162,76,0.2)', color: G }}>
                <Star size={8} />Premium
              </div>
            </div>
            <div className="py-1" style={{ borderTop: '1px solid rgba(122,31,31,0.08)' }}>
              {[['Profile', '/settings'], ['Projects', '/events'], ['Settings', '/settings']].map(([l, p]) => (
                <button key={l} onClick={() => { setUserMenuOpen(false); navigate(p); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
                  style={{ color: '#2A2A2A' }}>{l}</button>
              ))}
            </div>
            <div className="py-1" style={{ borderTop: '1px solid rgba(122,31,31,0.08)' }}>
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-red-50"
                style={{ color: R }}>{t('common.sign_out')}</button>
            </div>
          </div>
        )}

        {/* User row */}
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          style={userMenuOpen ? { background: 'rgba(255,255,255,0.07)' } : {}}
          onMouseEnter={e => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${R},${G})` }}
            title={collapsed ? (user ? `${user.firstName} ${user.lastName}` : t('common.guest')) : undefined}>
            {userInitials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user ? `${user.firstName} ${user.lastName}` : t('common.guest')}</p>
                <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('common.account')}</p>
              </div>
              <ChevronsUpDown size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            </>
          )}
        </div>

        {!collapsed && (
          <div className="pt-2 pb-1 text-center text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
            v0.29.2
          </div>
        )}
      </div>
      <PreferencesModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F0EB' }}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={closeMobile} />
      )}

      {Sidebar}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: RD, borderBottom: '1px solid rgba(212,162,76,0.12)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Menu size={18} />
            </button>
            <Logo />
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>EventJelly</span>
          </div>
          <button className="p-2 rounded-xl relative" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
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
