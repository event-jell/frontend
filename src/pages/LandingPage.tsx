import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Layout, Users, Ticket, Store, MessageSquare, BarChart2,
  ArrowRight, Check, Zap, ChevronRight, Calendar, Star,
  TrendingUp, Bell, MapPin, Clock,
} from 'lucide-react';
import Logo from '../components/Logo';

/* Palette constants – single source of truth */
const C = {
  red:    '#7A1F1F',
  redDk:  '#3D0F0F',
  redMd:  '#5C1414',
  gold:   '#D4A24C',
  goldDk: '#C9962E',
  cream:  '#FAF7F2',
  creamDk:'#F0EAE0',
  charcoal:'#2A2A2A',
  gray:   '#8A8A8A',
  green:  '#3FA65B',
} as const;

const CSS = `
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes blob1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(40px,-30px) scale(1.08); }
    66%      { transform: translate(-20px,20px) scale(0.94); }
  }
  @keyframes blob2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(-35px,20px) scale(1.06); }
    66%      { transform: translate(25px,-30px) scale(0.92); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes shimmerGold {
    from { background-position: -200% center; }
    to   { background-position:  200% center; }
  }
  @keyframes pulseRed {
    0%   { box-shadow: 0 0 0 0 rgba(122,31,31,0.5); }
    70%  { box-shadow: 0 0 0 12px rgba(122,31,31,0); }
    100% { box-shadow: 0 0 0 0 rgba(122,31,31,0); }
  }
  @keyframes pulseGold {
    0%   { box-shadow: 0 0 0 0 rgba(212,162,76,0.5); }
    70%  { box-shadow: 0 0 0 10px rgba(212,162,76,0); }
    100% { box-shadow: 0 0 0 0 rgba(212,162,76,0); }
  }
  @keyframes barGrow {
    from { width:0%; }
  }
  @keyframes twinkle {
    0%,100% { opacity:0.12; transform:scale(1); }
    50%     { opacity:0.45; transform:scale(1.5); }
  }
  @keyframes cursor1 {
    0%,100% { transform: translate(390px,96px); }
    30%     { transform: translate(415px,75px); }
    65%     { transform: translate(370px,115px); }
  }
  @keyframes cursor2 {
    0%,100% { transform: translate(55px,115px); }
    35%     { transform: translate(78px,94px); }
    70%     { transform: translate(38px,136px); }
  }
  @keyframes screenFadeIn {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spinSlow {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }

  .reveal { opacity:0; transform:translateY(32px); transition: opacity 0.65s ease, transform 0.65s ease; }
  .reveal.in-view { opacity:1; transform:translateY(0); }
  .reveal-scale { opacity:0; transform:scale(0.9); transition: opacity 0.55s ease, transform 0.55s ease; }
  .reveal-scale.in-view { opacity:1; transform:scale(1); }

  .btn-gold {
    background: linear-gradient(90deg, #D4A24C 0%, #C9962E 40%, #D4A24C 60%, #BF8820 100%);
    background-size: 200% auto;
    animation: shimmerGold 3s linear infinite;
    color: #2A2A2A;
    font-weight: 700;
  }
  .btn-gold:hover { filter: brightness(1.08); }

  .screen-anim { animation: screenFadeIn 0.4s ease both; }
`;

function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-scale').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Particles() {
  const dots = Array.from({ length: 22 }, (_, i) => ({
    x: (i * 43 + 15) % 100,
    y: (i * 59 + 11) % 100,
    delay: (i * 0.45) % 6,
    size: i % 3 === 0 ? 2 : 1.3,
    gold: i % 5 === 0,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.size, height: d.size,
            backgroundColor: d.gold ? 'rgba(212,162,76,0.7)' : 'rgba(255,255,255,0.35)',
            animation: `twinkle ${2.5 + (i % 4) * 0.7}s ${d.delay}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  );
}

/* ─── Dashboard Screen ───────────────────────────────────────────────────── */
function DashboardScreen() {
  return (
    <div className="screen-anim w-full h-full overflow-hidden" style={{ background: C.cream }}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
        <div>
          <p className="text-[9px]" style={{ color: C.gray }}>Event Dashboard</p>
          <p className="text-[11px] font-bold" style={{ color: C.charcoal, fontFamily: 'Playfair Display, serif' }}>
            Sophia &amp; Daniel's Wedding
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.red }}>
            <Bell size={10} className="text-white" />
          </div>
          <div className="w-6 h-6 rounded-full text-[7px] font-bold text-white flex items-center justify-center"
            style={{ background: C.redMd }}>SP</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 p-3">
        {[
          { label: 'Days to Go',    value: '47',     icon: Clock,      color: C.red,    bg: 'rgba(122,31,31,0.08)' },
          { label: 'Tasks Done',    value: '18/24',  icon: Check,      color: C.green,  bg: 'rgba(63,166,91,0.08)' },
          { label: 'Budget Used',   value: '62%',    icon: TrendingUp, color: C.gold,   bg: 'rgba(212,162,76,0.1)' },
          { label: 'Guests Conf.',  value: '142',    icon: Users,      color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-2.5 bg-white border border-slate-100 shadow-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-1.5" style={{ background: bg }}>
              <Icon size={11} style={{ color }} />
            </div>
            <p className="text-[11px] font-extrabold" style={{ color: C.charcoal }}>{value}</p>
            <p className="text-[8px] mt-0.5" style={{ color: C.gray }}>{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 px-3 pb-2">
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-3">
          <p className="text-[9px] font-semibold mb-2" style={{ color: C.charcoal }}>Event Progress</p>
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-14 h-14">
              <circle cx="24" cy="24" r="18" fill="none" stroke={C.creamDk} strokeWidth="5" />
              <circle cx="24" cy="24" r="18" fill="none" stroke={C.red} strokeWidth="5"
                strokeDasharray="113 113" strokeDashoffset="43" strokeLinecap="round"
                transform="rotate(-90 24 24)" />
              <text x="24" y="27" textAnchor="middle" fontSize="9" fontWeight="800" fill={C.red}>62%</text>
            </svg>
          </div>
          <div className="space-y-1 mt-1">
            {[['Venue', 100, C.red], ['Catering', 80, C.gold], ['Decor', 45, '#6366F1']].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center gap-1.5">
                <span className="text-[7px] w-10" style={{ color: C.gray }}>{l}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: C.creamDk }}>
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: c as string }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3">
          <p className="text-[9px] font-semibold mb-2" style={{ color: C.charcoal }}>Recent Activity</p>
          <div className="space-y-2">
            {[
              { text: 'Guest list updated',  sub: '142 confirmed · 12 pending', dot: C.green },
              { text: 'Venue deposit paid',  sub: '$3,500 — Grand Ballroom',    dot: C.gold  },
              { text: 'Catering confirmed',  sub: 'La Belle Cuisine · 3-course', dot: C.red  },
              { text: 'Floor plan approved', sub: 'Main Hall · 12 tables',      dot: '#6366F1' },
            ].map(({ text, sub, dot }) => (
              <div key={text} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: dot }} />
                <div>
                  <p className="text-[8.5px] font-semibold" style={{ color: C.charcoal }}>{text}</p>
                  <p className="text-[7.5px]" style={{ color: C.gray }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2.5">
          <p className="text-[8px] font-semibold mb-1.5" style={{ color: C.gray }}>Quick Actions</p>
          <div className="flex gap-1.5 flex-wrap">
            {['Add Guests', 'Send Invites', 'Update Budget', 'Floor Plan', 'View Reports'].map(a => (
              <button key={a} className="px-2 py-1 rounded-lg text-[7.5px] font-semibold border"
                style={{ borderColor: C.red, color: C.red, background: 'rgba(122,31,31,0.04)' }}>{a}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floor Plan Screen ──────────────────────────────────────────────────── */
function FloorPlanScreen() {
  const TABLES = [
    { id: 't1', cx: 45, cy: 115 }, { id: 't2', cx: 100, cy: 115 },
    { id: 't3', cx: 45, cy: 188 }, { id: 't4', cx: 100, cy: 188 },
    { id: 't5', cx: 380, cy: 115 }, { id: 't6', cx: 435, cy: 115 },
    { id: 't7', cx: 380, cy: 188 }, { id: 't8', cx: 435, cy: 188 },
  ];
  return (
    <div className="screen-anim w-full h-full flex" style={{ background: C.cream }}>
      <div className="w-14 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col items-center py-2 gap-2">
        <p className="text-[6.5px] font-semibold" style={{ color: C.gray }}>ELEMENTS</p>
        {[['⬜','Table'],['▬','Stage'],['🍹','Bar'],['🎤','Dance'],['🚪','Door']].map(([ic, lb]) => (
          <div key={lb} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg w-full cursor-pointer hover:bg-slate-50">
            <span className="text-sm">{ic}</span>
            <span className="text-[6px]" style={{ color: C.gray }}>{lb}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 relative overflow-hidden"
        style={{ background: '#EEEBE6', backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1px,transparent 1px)', backgroundSize: '18px 18px' }}>
        <svg viewBox="0 0 480 270" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect x="140" y="6" width="200" height="26" rx="5" fill={C.red} />
          <text x="240" y="23" textAnchor="middle" fill="white" fontSize="9" fontWeight="800" letterSpacing="1">STAGE</text>
          <rect x="145" y="38" width="190" height="20" rx="4" fill="rgba(122,31,31,0.12)" stroke={C.red} strokeWidth="1.5" />
          <text x="240" y="51" textAnchor="middle" fill={C.red} fontSize="8" fontWeight="700">HEAD TABLE</text>
          <rect x="138" y="64" width="204" height="56" rx="4"
            fill="rgba(212,162,76,0.04)" stroke="rgba(212,162,76,0.35)" strokeWidth="1" strokeDasharray="5 4" />
          <text x="240" y="96" textAnchor="middle" fill="rgba(180,120,40,0.4)" fontSize="9" fontWeight="600">DANCE FLOOR</text>
          {TABLES.map(({ id, cx, cy }) => (
            <g key={id}>
              <circle cx={cx} cy={cy} r={20} fill="rgba(122,31,31,0.06)" stroke="rgba(122,31,31,0.3)" strokeWidth="1.2" />
              {[0,45,90,135,180,225,270,315].map(deg => (
                <circle key={deg}
                  cx={cx + 26*Math.cos(deg*Math.PI/180)} cy={cy + 26*Math.sin(deg*Math.PI/180)}
                  r="3" fill="rgba(122,31,31,0.28)" />
              ))}
              <text x={cx} y={cy+3} textAnchor="middle" fill="rgba(122,31,31,0.85)" fontSize="7.5" fontWeight="700">{id.toUpperCase()}</text>
            </g>
          ))}
          <rect x="5" y="232" width="86" height="18" rx="3" fill="rgba(212,162,76,0.1)" stroke="rgba(212,162,76,0.6)" strokeWidth="1.2" />
          <text x="48" y="244" textAnchor="middle" fill="rgba(160,100,0,0.9)" fontSize="8" fontWeight="700">BAR S1</text>
          <rect x="389" y="232" width="86" height="18" rx="3" fill="rgba(212,162,76,0.1)" stroke="rgba(212,162,76,0.6)" strokeWidth="1.2" />
          <text x="432" y="244" textAnchor="middle" fill="rgba(160,100,0,0.9)" fontSize="8" fontWeight="700">BAR S2</text>
          <g style={{ animation: 'cursor1 5.5s ease-in-out infinite' }}>
            <polygon points="0,0 0,13 3.5,9.5 5.5,14 7.5,13.5 5.5,9 9.5,9" fill={C.red} stroke="white" strokeWidth="0.8" />
            <rect x="11" y="-1" width="52" height="12" rx="3" fill={C.red} />
            <text x="37" y="8.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Amara M.</text>
          </g>
          <g style={{ animation: 'cursor2 6.2s ease-in-out infinite', animationDelay: '1.1s' }}>
            <polygon points="0,0 0,13 3.5,9.5 5.5,14 7.5,13.5 5.5,9 9.5,9" fill={C.gold} stroke="white" strokeWidth="0.8" />
            <rect x="11" y="-1" width="46" height="12" rx="3" fill={C.gold} />
            <text x="34" y="8.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">James T.</text>
          </g>
        </svg>
      </div>
      <div className="w-20 flex-shrink-0 bg-white border-l border-slate-100 p-2">
        <p className="text-[7px] font-semibold mb-2" style={{ color: C.gray }}>PROPERTIES</p>
        <div className="space-y-2">
          {[['Selected','Table T1'],['Capacity','10 seats'],['Section','A']].map(([l,v]) => (
            <div key={l}>
              <p className="text-[7px] mb-0.5" style={{ color: C.gray }}>{l}</p>
              <p className="text-[8px] font-semibold" style={{ color: C.charcoal }}>{v}</p>
            </div>
          ))}
          <div>
            <p className="text-[7px] mb-1" style={{ color: C.gray }}>Fill Color</p>
            <div className="flex gap-1 flex-wrap">
              {[C.red, C.gold, '#6366F1', C.green, '#F97316'].map(c => (
                <div key={c} className="w-3.5 h-3.5 rounded-full cursor-pointer" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <p className="text-[7px] mb-1" style={{ color: C.gray }}>Seated</p>
            <p className="text-[10px] font-bold" style={{ color: C.red }}>116 / 140</p>
            <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: C.creamDk }}>
              <div className="h-full rounded-full" style={{ width: '83%', background: C.red }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Ticket Design Screen ───────────────────────────────────────────────── */
function TicketScreen() {
  return (
    <div className="screen-anim w-full h-full flex" style={{ background: C.cream }}>
      <div className="w-2/5 flex-shrink-0 bg-white border-r border-slate-100 p-3 overflow-hidden">
        <p className="text-[10px] font-bold mb-3" style={{ color: C.charcoal, fontFamily: 'Playfair Display, serif' }}>
          Ticket Design
        </p>
        <div className="space-y-2.5">
          {[
            ['Event Name', "Sophia & Daniel's Wedding"],
            ['Date & Time', 'Sat, 14 Sept 2025 · 4:00 PM'],
            ['Venue', 'Grand Marquee, Lagos'],
            ['Ticket Type', 'General Admission'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[7.5px] font-semibold mb-0.5" style={{ color: C.gray }}>{label}</p>
              <div className="px-2 py-1.5 rounded-lg border" style={{ borderColor: C.creamDk, background: C.cream }}>
                <p className="text-[8px]" style={{ color: C.charcoal }}>{value}</p>
              </div>
            </div>
          ))}
          <div>
            <p className="text-[7.5px] font-semibold mb-1" style={{ color: C.gray }}>Template</p>
            <div className="flex gap-1.5">
              {['Classic', 'Modern', 'Floral'].map((t, i) => (
                <div key={t} className="flex-1 py-1 rounded-lg border text-center text-[7px] font-semibold cursor-pointer"
                  style={i === 0
                    ? { borderColor: C.red, color: C.red, background: 'rgba(122,31,31,0.06)' }
                    : { borderColor: '#E2E8F0', color: C.gray }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-1.5 rounded-xl text-[8.5px] font-bold text-white"
            style={{ background: `linear-gradient(135deg,${C.red},${C.redMd})` }}>
            Generate Ticket
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="w-full max-w-[200px] rounded-2xl overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(160deg,${C.redDk} 0%,${C.red} 50%,${C.redMd} 100%)` }}>
          <div className="px-4 pt-4 pb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,162,76,0.7)' }}>
                  Wedding Celebration
                </p>
                <p className="text-[13px] font-bold text-white leading-tight mt-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Sophia & Daniel
                </p>
              </div>
              <div className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: 'rgba(212,162,76,0.4)', background: 'rgba(212,162,76,0.12)' }}>
                <Star size={14} style={{ color: C.gold }} />
              </div>
            </div>
            <div className="border-t pt-2.5 grid grid-cols-2 gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {[['DATE','Sept 14, 2025'],['TIME','4:00 PM'],['VENUE','Grand Marquee'],['TABLE','T7 · Seat 4']].map(([l,v]) => (
                <div key={l}>
                  <p className="text-[6px] font-semibold" style={{ color: 'rgba(212,162,76,0.6)' }}>{l}</p>
                  <p className="text-[8px] text-white font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-3 mb-3 rounded-xl p-2.5 flex items-center justify-between gap-2"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="rounded-full"
                  style={{ width: i%3===0?2:1, height:20, background:`rgba(255,255,255,${0.25+(i%4)*0.15})` }} />
              ))}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[6px]" style={{ color: 'rgba(255,255,255,0.4)' }}>TICKET NO.</p>
              <p className="text-[8px] text-white font-mono font-bold">EJ-24190</p>
              <div className="w-10 h-10 mt-1 rounded-lg bg-white p-0.5">
                <div className="grid w-full h-full" style={{ gridTemplateColumns:'repeat(5,1fr)', gap:1 }}>
                  {Array.from({length:25}).map((_,i)=>(
                    <div key={i} className="rounded-sm"
                      style={{ background:[0,2,4,10,14,20,22,24,6,18,12].includes(i)?C.redDk:'transparent' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 pb-3 flex items-center justify-between">
            <p className="text-[7px] font-semibold" style={{ color: C.gold }}>EventJelly™</p>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full" style={{ background: C.gold, animation: 'pulseGold 2s infinite' }} />
              <p className="text-[6.5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Planner Workstation Screen ─────────────────────────────────────────── */
function PlannerScreen() {
  const today = new Date();
  const days = ['S','M','T','W','T','F','S'];
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const calDays = Array.from({ length: 35 }, (_, i) => {
    const d = i - firstDay + 1;
    return { n: d, in: d >= 1 && d <= 31, event: [14,21,28].includes(d) };
  });
  return (
    <div className="screen-anim w-full h-full flex flex-col" style={{ background: C.cream }}>
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-100">
        <p className="text-[10px] font-bold" style={{ color: C.charcoal, fontFamily: 'Playfair Display, serif' }}>
          Planner Workstation
        </p>
        <div className="flex gap-1">
          {['Calendar','Timeline','Tasks','AI'].map((t,i)=>(
            <button key={t} className="px-2 py-0.5 rounded-lg text-[7px] font-semibold"
              style={i===0?{background:C.red,color:'white'}:{color:C.gray}}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden gap-2 p-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2.5 w-44 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold" style={{ color: C.charcoal }}>
              {today.toLocaleString('default',{month:'short'})} {today.getFullYear()}
            </p>
            <div className="flex gap-0.5">
              {['‹','›'].map(a=>(
                <button key={a} className="w-4 h-4 rounded text-[7px] flex items-center justify-center"
                  style={{ background: C.creamDk, color: C.gray }}>{a}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d,i)=><div key={i} className="text-center text-[6px] font-semibold py-0.5" style={{color:C.gray}}>{d}</div>)}
            {calDays.map((d,i)=>(
              <div key={i} className="aspect-square flex items-center justify-center rounded text-[7px] relative cursor-pointer"
                style={{
                  color: d.n===today.getDate()&&d.in?'white':d.in?C.charcoal:'#D1D5DB',
                  background: d.n===today.getDate()&&d.in?C.red:d.event&&d.in?'rgba(122,31,31,0.07)':'transparent',
                  fontWeight: d.event?700:400,
                }}>
                {d.in?d.n:''}
                {d.event&&d.in&&d.n!==today.getDate()&&(
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{background:C.gold}} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-2.5">
            <p className="text-[8.5px] font-bold mb-2" style={{ color: C.charcoal }}>Project Timeline</p>
            <div className="space-y-1.5">
              {[
                {task:'Venue Booking', start:0, width:25, color:C.red, done:true},
                {task:'Guest Invites', start:15,width:35, color:C.gold,done:true},
                {task:'Catering Plan', start:30,width:30, color:'#6366F1',done:false},
                {task:'Decorations',  start:50,width:40, color:C.green,done:false},
                {task:'Photography',  start:65,width:25, color:'#F97316',done:false},
              ].map(({task,start,width,color,done})=>(
                <div key={task} className="flex items-center gap-2">
                  <p className="text-[7px] w-16 flex-shrink-0" style={{color:C.gray}}>{task}</p>
                  <div className="flex-1 h-3.5 rounded-full overflow-hidden relative" style={{background:C.creamDk}}>
                    <div className="absolute top-0 h-full rounded-full flex items-center justify-end pr-1"
                      style={{left:`${start}%`,width:`${width}%`,background:color,opacity:done?1:0.5}}>
                      {done&&<Check size={7} className="text-white"/>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-2.5 overflow-hidden">
            <p className="text-[8.5px] font-bold mb-2" style={{ color: C.charcoal }}>Upcoming Tasks</p>
            <div className="space-y-1.5">
              {[
                {task:'Confirm final headcount', due:'Today',    p:'high'},
                {task:'Send venue payment',      due:'Tomorrow', p:'high'},
                {task:'Review menu options',     due:'Aug 15',   p:'med'},
                {task:'Order wedding favors',    due:'Aug 20',   p:'low'},
              ].map(({task,due,p})=>(
                <div key={task} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 flex-shrink-0"
                    style={{borderColor:p==='high'?C.red:p==='med'?C.gold:'#CBD5E1'}} />
                  <span className="flex-1 text-[7.5px]" style={{color:C.charcoal}}>{task}</span>
                  <span className="text-[6.5px] flex-shrink-0" style={{color:C.gray}}>{due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── App Preview ────────────────────────────────────────────────────────── */
const SCREENS = [
  { key:'dashboard', label:'Dashboard', icon:BarChart2 },
  { key:'floor',     label:'Floor Plan', icon:Layout   },
  { key:'ticket',    label:'Ticketing',  icon:Ticket   },
  { key:'planner',   label:'Planner',    icon:Calendar },
] as const;

function AppPreview() {
  const [active, setActive] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const t = setInterval(()=>{ setActive(a=>(a+1)%SCREENS.length); setKey(k=>k+1); }, 4200);
    return ()=>clearInterval(t);
  }, []);

  const handleTab = (i: number) => { setActive(i); setKey(k=>k+1); };

  return (
    <div className="relative w-full max-w-4xl mx-auto"
      style={{ animation:'float 7s ease-in-out infinite', animationDelay:'0.3s' }}>
      <div className="absolute -inset-6 rounded-3xl blur-3xl opacity-20 pointer-events-none"
        style={{ background:`linear-gradient(135deg,${C.red},${C.gold})`, animation:'blob1 9s ease-in-out infinite' }} />

      <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border:`1px solid rgba(61,15,15,0.3)` }}>
        {/* Chrome bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ background:C.redDk, borderColor:'rgba(212,162,76,0.15)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex items-center gap-0.5 ml-2 flex-1 overflow-hidden">
            {SCREENS.map(({label,icon:Icon},i)=>(
              <button key={label} onClick={()=>handleTab(i)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-t-lg text-[8px] font-semibold transition-all flex-shrink-0"
                style={i===active
                  ?{background:C.cream,color:C.red,borderBottom:`2px solid ${C.red}`}
                  :{color:'rgba(212,162,76,0.55)',background:'transparent'}}>
                <Icon size={9}/>{label}
              </button>
            ))}
          </div>
          <div className="flex -space-x-1.5 mr-1">
            {[C.red,C.gold,'#6366F1'].map((c,i)=>(
              <div key={i} className="w-5 h-5 rounded-full border-2 text-[6px] font-bold flex items-center justify-center text-white"
                style={{backgroundColor:c,borderColor:C.redDk}}>
                {['AM','JT','RK'][i]}
              </div>
            ))}
          </div>
        </div>

        {/* Screen */}
        <div style={{height:480,overflow:'hidden'}}>
          <div key={key} className="w-full h-full">
            {active===0&&<DashboardScreen/>}
            {active===1&&<FloorPlanScreen/>}
            {active===2&&<TicketScreen/>}
            {active===3&&<PlannerScreen/>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{background:'rgba(122,31,31,0.12)'}}>
          <div key={`p-${key}`} className="h-full"
            style={{background:`linear-gradient(90deg,${C.red},${C.gold})`,animation:'barGrow 4.2s linear both',width:'100%'}} />
        </div>
      </div>

      {/* Floating badge top-right */}
      <div className="absolute -top-5 -right-5 hidden lg:block"
        style={{animation:'float 4.5s ease-in-out infinite',animationDelay:'1.2s'}}>
        <div className="rounded-2xl px-3 py-2 shadow-2xl border bg-white"
          style={{borderColor:'rgba(122,31,31,0.1)'}}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{background:C.red,animation:'pulseRed 2s infinite'}} />
            <span className="text-[9px] font-semibold" style={{color:C.charcoal}}>Guest assigned!</span>
          </div>
          <p className="text-[7.5px] mt-0.5" style={{color:C.gray}}>Rhea K. → Head Table</p>
        </div>
      </div>

      {/* Floating badge bottom-left */}
      <div className="absolute -bottom-5 -left-5 hidden lg:block"
        style={{animation:'float 5.5s ease-in-out infinite',animationDelay:'0.6s'}}>
        <div className="rounded-2xl px-3 py-2 shadow-2xl border bg-white"
          style={{borderColor:'rgba(212,162,76,0.2)'}}>
          <p className="text-[7.5px]" style={{color:C.gray}}>Ticket Sales</p>
          <p className="text-sm font-bold" style={{color:C.red}}>312 / 400</p>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingUp size={8} style={{color:C.gold}}/>
            <span className="text-[7px]" style={{color:C.gray}}>+18% this week</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon:Layout,        label:'Floor Plan Studio',    desc:'Drag-and-drop canvas to design stages, tables, bars, and every element of your venue with real-time collaboration.',  color:C.red,    bg:'rgba(122,31,31,0.08)' },
  { icon:Users,         label:'Guest Management',     desc:'Track RSVPs, manage seating, dietary needs, send invites, and run real-time check-ins effortlessly.',                color:'#6366F1', bg:'rgba(99,102,241,0.08)' },
  { icon:Ticket,        label:'Ticket Designer',      desc:'Beautiful ticket templates, multiple tiers, QR codes, real-time sales tracking, and branded experiences.',          color:C.gold,   bg:'rgba(212,162,76,0.1)' },
  { icon:Calendar,      label:'Planner Workstation',  desc:'Event calendar, Gantt timelines, task boards, AI planning assistant, and milestone tracker in one place.',           color:C.green,  bg:'rgba(63,166,91,0.08)' },
  { icon:MessageSquare, label:'Event Communications', desc:'Email and SMS campaigns, live team chat, push-to-talk, and audience segmentation from the command center.',          color:'#3B82F6', bg:'rgba(59,130,246,0.08)' },
  { icon:BarChart2,     label:'Reports & Analytics',  desc:'Live dashboards with RSVP breakdowns, revenue charts, check-in rates, vendor status, and budget tracking.',         color:'#F97316', bg:'rgba(249,115,22,0.08)' },
  { icon:Store,         label:'Vendor Coordination',  desc:'Keep supplier contacts, track contracts, manage payments, and confirm every booking on time.',                       color:'#8B5CF6', bg:'rgba(139,92,246,0.08)' },
  { icon:MapPin,        label:'Operations Command',   desc:'Live floor map with staffing overview, table management, emergency readiness, and real-time communications.',       color:'#EC4899', bg:'rgba(236,72,153,0.08)' },
];

const STATS = [
  {value:'50K+', label:'Events managed',       delay:'0s'  },
  {value:'2M+',  label:'Guests tracked',       delay:'0.1s'},
  {value:'98%',  label:'Planner satisfaction', delay:'0.2s'},
  {value:'40+',  label:'Countries',            delay:'0.3s'},
];

const PERKS = [
  'Unlimited events & floor plans',
  'Guest list, RSVPs & check-ins',
  'Drag-and-drop floor planner',
  'Beautiful ticket designer & QR codes',
  'Ticket sales & revenue reports',
  'Vendor management & contracts',
  'Email & SMS communications',
  'AI-powered planning assistant',
  'Real-time analytics dashboard',
  'Team collaboration tools',
];

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!document.getElementById('lp-styles')) {
      const tag = document.createElement('style');
      tag.id = 'lp-styles';
      tag.textContent = CSS;
      document.head.appendChild(tag);
      styleRef.current = tag;
    }
    return () => styleRef.current?.remove();
  }, []);

  useScrollReveal();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'white' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b"
        style={{ background:'rgba(250,247,242,0.93)', backdropFilter:'blur(16px)', borderColor:'rgba(122,31,31,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-base font-bold" style={{ color:C.charcoal, fontFamily:'Playfair Display, serif' }}>EventJelly</span>
          </div>
          <div className="flex items-center gap-3">
            {token ? (
              <button onClick={() => navigate('/events')}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                style={{ background:`linear-gradient(135deg,${C.red},${C.redMd})` }}>
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium px-3 py-2 transition-colors"
                  style={{ color: C.gray }} onMouseEnter={e=>(e.currentTarget.style.color=C.charcoal)}
                  onMouseLeave={e=>(e.currentTarget.style.color=C.gray)}>
                  Sign in
                </Link>
                <Link to="/register"
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                  style={{ background:`linear-gradient(135deg,${C.red},${C.redMd})` }}>
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-screen flex items-center"
        style={{ background:`linear-gradient(150deg,${C.redDk} 0%,#2d0808 25%,${C.red} 55%,#4a1010 75%,${C.redDk} 100%)` }}>

        <Particles />

        {/* Gold flare */}
        <div className="absolute top-0 right-0 w-[700px] h-[500px] pointer-events-none"
          style={{ background:`radial-gradient(ellipse at 80% 20%,rgba(212,162,76,0.14),transparent 60%)`, animation:'blob1 14s ease-in-out infinite', filter:'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background:`radial-gradient(circle,rgba(122,31,31,0.45),transparent 70%)`, animation:'blob2 11s ease-in-out infinite', filter:'blur(80px)' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage:'radial-gradient(rgba(212,162,76,1) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />

        <div className="relative max-w-6xl mx-auto px-6 w-full py-28">
          <div className="flex flex-col items-center gap-16">

            {/* Text */}
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
                style={{ background:'rgba(212,162,76,0.12)', color:'rgba(212,162,76,0.95)', border:'1px solid rgba(212,162,76,0.25)', animation:'fadeUp 0.7s ease both 0.1s' }}>
                <Zap size={11} style={{ color: C.gold }} />
                All-in-one event management platform
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
                style={{ fontFamily:'Playfair Display, serif', animation:'fadeUp 0.7s ease both 0.25s' }}>
                Plan events
                <br />
                <span style={{
                  background:`linear-gradient(90deg,${C.gold},#F5D78E,${C.gold})`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundSize:'200% auto', animation:'shimmerGold 4s linear infinite',
                }}>
                  people remember
                </span>
              </h1>

              <p className="text-lg leading-relaxed mb-9 max-w-lg mx-auto"
                style={{ color:'rgba(255,255,255,0.58)', animation:'fadeUp 0.7s ease both 0.4s' }}>
                Design stunning floor plans, manage guests, create beautiful tickets, coordinate vendors, and track every detail — all from one platform built for memorable events.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center"
                style={{ animation:'fadeUp 0.7s ease both 0.55s' }}>
                <Link to="/register"
                  className="flex items-center gap-2 px-7 py-3.5 text-sm rounded-2xl shadow-2xl transition-all hover:-translate-y-1 btn-gold">
                  Start for free <ArrowRight size={15} />
                </Link>
                <Link to="/login"
                  className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.14)' }}>
                  Sign in <ChevronRight size={14} />
                </Link>
              </div>

              <div className="flex items-center gap-3 mt-8 justify-center"
                style={{ animation:'fadeUp 0.7s ease both 0.7s' }}>
                <div className="flex -space-x-2">
                  {[C.red,C.gold,'#6366F1',C.green].map((c,i)=>(
                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor:c, borderColor:'rgba(61,15,15,0.5)' }}>
                      {['AM','JK','SR','OT'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.48)' }}>
                  Trusted by <span style={{ color:'rgba(255,255,255,0.82)', fontWeight:600 }}>50,000+</span> event planners
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 w-full lg:max-w-4xl" style={{ animation:'scaleIn 0.8s ease both 0.3s' }}>
              <AppPreview />
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute -bottom-[1px] inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 block">
            <path d="M0,40 C240,0 480,60 720,40 C960,20 1200,60 1440,40 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label, delay }) => (
              <div key={label} className="text-center reveal" style={{ transitionDelay:delay }}>
                <p className="text-4xl sm:text-5xl font-extrabold mb-1"
                  style={{ fontFamily:'Playfair Display, serif', background:`linear-gradient(135deg,${C.red},${C.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  {value}
                </p>
                <p className="text-sm font-medium" style={{ color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background:`radial-gradient(circle,${C.red},transparent)` }} />
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background:'rgba(122,31,31,0.07)', color:C.red, border:`1px solid rgba(122,31,31,0.14)` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:C.red, animation:'pulseRed 2s infinite' }} />
              Everything you need
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
              style={{ fontFamily:'Playfair Display, serif', color:C.charcoal }}>
              One platform,
              <span style={{ background:`linear-gradient(135deg,${C.red},${C.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}> every detail</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color:C.gray }}>
              From the first blueprint to the final check-in, EventJelly handles every moving part of your event.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon:Icon, label, desc, color, bg }, i) => (
              <div key={label} className="reveal group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm cursor-default"
                style={{ transitionDelay:`${i*0.06}s` }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow:`0 0 0 1px ${color}30, 0 20px 40px -12px ${color}20` }} />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform duration-200"
                    style={{ background:bg }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="font-bold mb-1.5 text-sm" style={{ color:C.charcoal }}>{label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color:C.gray }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background:C.cream }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ background:'rgba(122,31,31,0.07)', color:C.red, border:`1px solid rgba(122,31,31,0.14)` }}>
                Free to get started — no card needed
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
                style={{ fontFamily:'Playfair Display, serif', color:C.charcoal }}>
                Everything included.<br />
                <span style={{ background:`linear-gradient(135deg,${C.red},${C.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  No hidden fees.
                </span>
              </h2>
              <p className="mb-8 text-base leading-relaxed" style={{ color:C.gray }}>
                Create your account and unlock every feature from day one. Your events deserve the full toolkit.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERKS.map((perk, i) => (
                  <li key={perk} className="reveal flex items-center gap-2.5 text-sm" style={{ transitionDelay:`${i*0.05}s`, color:C.charcoal }}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background:`linear-gradient(135deg,${C.red},${C.redMd})` }}>
                      <Check size={11} className="text-white" />
                    </div>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="inline-flex items-center gap-2 mt-9 px-7 py-3.5 text-sm rounded-2xl shadow-lg transition-all hover:-translate-y-1 btn-gold">
                Create free account <ArrowRight size={15} />
              </Link>
            </div>

            {/* Event overview card */}
            <div className="reveal-scale">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-15 pointer-events-none"
                  style={{ background:`linear-gradient(135deg,${C.red},${C.gold})` }} />
                <div className="relative rounded-2xl overflow-hidden border shadow-2xl bg-white" style={{ borderColor:C.creamDk }}>
                  <div className="px-6 py-5"
                    style={{ background:`linear-gradient(135deg,${C.redDk} 0%,${C.red} 55%,${C.redMd} 100%)` }}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-xs" style={{ color:'rgba(212,162,76,0.6)' }}>Event Overview</p>
                        <p className="text-xl font-extrabold text-white mt-0.5"
                          style={{ fontFamily:'Playfair Display, serif' }}>
                          Sophia & Daniel's Wedding
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>Revenue</p>
                        <p className="text-2xl font-extrabold text-white mt-0.5">$24,150</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:C.gold, animation:'pulseGold 2s infinite' }} />
                      <p className="text-xs" style={{ color:'rgba(255,255,255,0.55)' }}>47 days to go · Preparation in progress</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[
                      {label:'Guests confirmed', value:'142 / 188', bar:75, color:C.red},
                      {label:'Tickets sold',     value:'312 / 400', bar:78, color:C.gold},
                      {label:'Tasks completed',  value:'18 / 24',   bar:75, color:'#6366F1'},
                      {label:'Vendors booked',   value:'8 of 11',   bar:73, color:C.green},
                      {label:'Budget used',      value:'62%',       bar:62, color:'#F97316'},
                    ].map(({label,value,bar,color},i)=>(
                      <div key={label} className="px-6 py-3.5">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span style={{ color:C.gray }}>{label}</span>
                          <span className="font-semibold" style={{ color:C.charcoal }}>{value}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background:C.creamDk }}>
                          <div className="h-full rounded-full"
                            style={{ width:`${bar}%`, backgroundColor:color, animation:`barGrow 1.2s cubic-bezier(0.4,0,0.2,1) both ${0.3+i*0.12}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden"
        style={{ background:`linear-gradient(150deg,${C.redDk} 0%,#2d0808 30%,${C.red} 65%,${C.redDk} 100%)` }}>
        <Particles />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border pointer-events-none"
          style={{ borderColor:'rgba(212,162,76,0.07)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border pointer-events-none"
          style={{ borderColor:'rgba(212,162,76,0.03)' }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background:'rgba(212,162,76,0.1)', color:'rgba(212,162,76,0.88)', border:'1px solid rgba(212,162,76,0.22)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:C.gold, animation:'pulseGold 2s infinite' }} />
            Trusted by planners worldwide
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 leading-tight"
            style={{ fontFamily:'Playfair Display, serif' }}>
            Your next great event
            <span style={{
              display:'block',
              background:`linear-gradient(90deg,${C.gold},#F5D78E,${C.gold})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundSize:'200% auto', animation:'shimmerGold 3s linear infinite',
            }}>
              starts here
            </span>
          </h2>
          <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed" style={{ color:'rgba(255,255,255,0.52)' }}>
            Join thousands of event planners who use EventJelly to create extraordinary, unforgettable experiences.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="group flex items-center gap-2.5 px-9 py-4 text-base rounded-2xl shadow-2xl transition-all hover:-translate-y-1 btn-gold">
              Get started — it's free
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 px-9 py-4 text-base font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
              style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.14)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-10" style={{ background:C.redDk }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-bold text-white" style={{ fontFamily:'Playfair Display, serif' }}>EventJelly</span>
          </div>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.22)' }}>© {new Date().getFullYear()} EventJelly. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
