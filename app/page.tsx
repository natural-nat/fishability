'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { MapSelection, ViewMode } from '@/components/MapPicker';
import { illustrationUrl, WATER_TYPE_LABELS } from '@/lib/species';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScoreFactor { score: number; max: number; label: string; detail: string; }
interface ScoreResult {
  total: number; rating: string; summary: string;
  factors: Record<string, ScoreFactor>;
}
interface WeatherData {
  temperature: number; precipitationProbability: number; windSpeed: number;
  cloudCover: number; pressure: number; pressureTrend: number;
  sunrise: string; sunset: string; datetime: string;
}
interface HourlyPoint { hour: number; datetime: string; score: number; isCenter: boolean; }
interface ApiResponse {
  geo: { name: string; admin1?: string; country: string; latitude: number; longitude: number };
  weather: WeatherData;
  score: ScoreResult;
  hourly: HourlyPoint[];
}
interface SpeciesResult {
  id: string; name: string; scientificName: string; habitat: string; illustration: string;
  catchability: number; typicalSize: string; trophySize: string; line: string; peakMonths: number[]; tip: string;
  conditions: number; conditionsRating: string;
  catchChance: number; chanceRating: string;
  baits: string[]; note: string; optimalTime: string; inSeason: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const FACTOR_LABELS: Record<string, string> = {
  timeOfDay: 'Time of Day', pressure: 'Pressure', wind: 'Wind',
  cloudCover: 'Cloud Cover', rain: 'Rain', temperature: 'Temperature',
};

function scoreClass(t: number) {
  if (t >= 75) return 'score-excellent';
  if (t >= 55) return 'score-good';
  if (t >= 35) return 'score-fair';
  return 'score-poor';
}

function scoreColor(t: number) {
  if (t >= 75) return 'var(--score-excellent)';
  if (t >= 55) return 'var(--score-good)';
  if (t >= 35) return 'var(--score-fair)';
  return 'var(--score-poor)';
}

function fishScoreColor(s: number) {
  if (s >= 8) return 'var(--score-excellent)';
  if (s >= 6) return 'var(--score-good)';
  if (s >= 4) return 'var(--score-fair)';
  return 'var(--score-poor)';
}

function formatTime(datetime: string) {
  const [d, t] = datetime.split('T');
  const date = new Date(d + 'T12:00:00');
  const ds = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${ds} · ${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ─── Hourly chart ──────────────────────────────────────────────────────────────

function HourlyChart({ hourly }: { hourly: HourlyPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (!hourly.length) return null;

  const n = hourly.length;

  // Auto-scale the Y axis to the visible window so small differences are visible
  const scores = hourly.map(p => p.score);
  let lo = Math.min(...scores);
  let hi = Math.max(...scores);
  if (hi - lo < 10) { const mid = (hi + lo) / 2; lo = mid - 5; hi = mid + 5; } // floor on range
  lo = Math.max(0, lo); hi = Math.min(100, hi);
  const span = Math.max(1, hi - lo);

  const padTop = 0.16, padBot = 0.16;
  const xf = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  const yf = (score: number) => padTop + (1 - (score - lo) / span) * (1 - padTop - padBot);

  const pts = hourly.map((p, i) => ({ ...p, i, xf: xf(i), yf: yf(p.score) }));

  const xy = (p: { xf: number; yf: number }) => `${(p.xf * 100).toFixed(2)} ${(p.yf * 100).toFixed(2)}`;
  const line = `M ${pts.map(xy).join(' L ')}`;
  const area = `M ${(pts[0].xf * 100).toFixed(2)} 100 L ${pts.map(xy).join(' L ')} L ${(pts[n - 1].xf * 100).toFixed(2)} 100 Z`;

  const centerIdx = pts.findIndex(p => p.isCenter);
  const sel = centerIdx >= 0 ? pts[centerIdx] : pts[Math.floor(n / 2)];
  const hov = hoverIdx != null ? pts[hoverIdx] : null;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const f = (e.clientX - rect.left) / rect.width;
    setHoverIdx(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  };

  const fmtShort = (h: number) => h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
  const fmtLong  = (h: number) => h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;

  // Axis labels: ends, quarters, and the center
  const labelIdx = Array.from(new Set([0, Math.round(n / 4), Math.floor(n / 2), Math.round((3 * n) / 4), n - 1]));

  const Dot = ({ x, y, color, ring }: { x: number; y: number; color: string; ring?: boolean }) => (
    <div style={{
      position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`,
      width: ring ? 10 : 8, height: ring ? 10 : 8, borderRadius: '50%', background: color,
      transform: 'translate(-50%, -50%)',
      boxShadow: ring ? '0 0 0 3px rgba(99,102,241,0.35), 0 0 0 1.5px var(--bg-card)' : '0 0 0 2px var(--bg-card)',
      pointerEvents: 'none',
    }} />
  );

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={wrapRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ position: 'relative', width: '100%', height: 90, cursor: 'crosshair' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
          <path d={area} fill="url(#areaGrad)" />
          <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.2"
            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={sel.xf * 100} y1="0" x2={sel.xf * 100} y2="100"
            stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3,3"
            vectorEffect="non-scaling-stroke" opacity="0.7" />
        </svg>

        <Dot x={sel.xf} y={sel.yf} color="var(--accent)" ring />
        {hov && !hov.isCenter && <Dot x={hov.xf} y={hov.yf} color="#fff" />}

        {hov && (
          <div className="chart-tooltip" style={{
            left: `${Math.min(Math.max(hov.xf * 100, 10), 90)}%`,
            top: `${hov.yf * 100}%`,
            transform: 'translate(-50%, -160%)',
          }}>
            <span style={{ color: 'var(--text-secondary)', marginRight: 4 }}>{fmtLong(hov.hour)}</span>
            <span style={{ fontWeight: 700, color: scoreColor(hov.score) }}>{hov.score}</span>
          </div>
        )}
      </div>

      {/* Hour axis — center is the selected time */}
      <div style={{ position: 'relative', height: 12, marginTop: 4 }}>
        {labelIdx.map(i => {
          const p = pts[i];
          if (!p) return null;
          const isC = p.isCenter || i === Math.floor(n / 2);
          return (
            <span key={i} style={{
              position: 'absolute', left: `${p.xf * 100}%`, transform: 'translateX(-50%)',
              fontSize: 9, fontWeight: isC ? 700 : 400,
              color: isC ? 'var(--accent)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>{fmtShort(p.hour)}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Species helpers ────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function seasonText(months: number[]): string {
  if (!months.length) return '—';
  const sorted = [...months].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    if (sorted[i] === prev + 1) { prev = sorted[i]; continue; }
    ranges.push(start === prev ? MONTHS[start - 1] : `${MONTHS[start - 1]}–${MONTHS[prev - 1]}`);
    start = sorted[i]; prev = sorted[i];
  }
  return ranges.join(', ');
}

function catchabilityLabel(c: number): string {
  switch (c) {
    case 5:  return 'Very abundant';
    case 4:  return 'Common';
    case 3:  return 'Moderate';
    case 2:  return 'Hard to catch';
    default: return 'Basically impossible';
  }
}

// ─── Compact fish card ──────────────────────────────────────────────────────────

function FishCard({ fish, index, onOpen }: { fish: SpeciesResult; index: number; onOpen: (f: SpeciesResult) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const c = fishScoreColor(fish.catchChance);
  const imgUrl = illustrationUrl(fish.illustration);
  const stagger = `stagger-${Math.min(index + 1, 8)}`;

  return (
    <div
      className={`animate-fade-up ${stagger}`}
      onClick={() => onOpen(fish)}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 9, overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hi)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="fish-thumb">
        {!imgErr ? (
          <>
            {!loaded && <div className="fish-img skeleton" style={{ position: 'absolute', inset: 0 }} />}
            <img
              src={imgUrl} alt={fish.name} className="fish-img" loading="lazy"
              onLoad={() => setLoaded(true)} onError={() => setImgErr(true)}
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
            />
          </>
        ) : (
          <div className="fish-img" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, background: 'var(--bg-raised)',
          }}>🐟</div>
        )}

        {/* Catch-chance badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          borderRadius: 5, padding: '2px 6px',
          display: 'flex', alignItems: 'baseline', gap: 1,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: c, lineHeight: 1 }}>{fish.catchChance}</span>
          <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>/10</span>
        </div>

        {!fish.inSeason && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(0,0,0,0.6)', color: '#f59e0b',
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
            border: '1px solid rgba(245,158,11,0.3)',
          }}>OFF-SEASON</div>
        )}
      </div>

      <div style={{ padding: '7px 9px' }}>
        <div style={{
          fontWeight: 700, fontSize: 11.5, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{fish.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{fish.chanceRating} chance</span>
        </div>
      </div>
    </div>
  );
}

function FishCardSkeleton({ index }: { index: number }) {
  const stagger = `stagger-${Math.min(index + 1, 8)}`;
  return (
    <div className={`animate-fade-in ${stagger}`} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 9, overflow: 'hidden',
    }}>
      <div style={{ width: '100%', aspectRatio: '16/9' }} className="skeleton" />
      <div style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="skeleton" style={{ height: 11, width: '70%' }} />
        <div className="skeleton" style={{ height: 9, width: '45%' }} />
      </div>
    </div>
  );
}

// ─── Species detail modal ─────────────────────────────────────────────────────────

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: color ?? 'var(--text-primary)', marginTop: 3 }}>{value}</div>
    </div>
  );
}

function SpeciesModal({ fish, onClose }: { fish: SpeciesResult; onClose: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const condCol   = fishScoreColor(fish.conditions);
  const chanceCol = fishScoreColor(fish.catchChance);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      className="animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel"
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
          borderRadius: 14, width: '100%', maxWidth: 440, maxHeight: '88vh',
          overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Banner */}
        <div className="fish-thumb" style={{ borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'hidden' }}>
          {!imgErr ? (
            <img src={illustrationUrl(fish.illustration, 700)} alt={fish.name} className="fish-img"
              style={{ aspectRatio: '2 / 1' }} onError={() => setImgErr(true)} />
          ) : (
            <div className="fish-img" style={{ aspectRatio: '2 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'var(--bg-raised)' }}>🐟</div>
          )}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close"
          >×</button>
        </div>

        <div style={{ padding: 16 }}>
          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{fish.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{fish.scientificName}</div>
          </div>

          {/* Catch chance — the headline metric */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
            background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: chanceCol, lineHeight: 1 }}>{fish.catchChance}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/10</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: chanceCol }}>{fish.chanceRating} catch chance</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Conditions right now blended with how catchable this species is
              </div>
            </div>
          </div>

          {/* Conditions spectrum */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Conditions now</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: condCol }}>{fish.conditionsRating} · {fish.conditions}/10</span>
            </div>
            <div className="spectrum-track">
              <div className="spectrum-knob" style={{ left: `${fish.conditions * 10}%`, background: condCol, boxShadow: `0 0 8px ${condCol}` }} />
            </div>
          </div>

          {/* Catchability — 5 discrete levels (1 = basically impossible, 5 = very abundant) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Catchability</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{catchabilityLabel(fish.catchability)}</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: i <= fish.catchability ? 'linear-gradient(90deg,#5b9cf7,#a888f4)' : 'var(--border)',
                }} />
              ))}
            </div>
          </div>

          {/* Facts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <StatBlock label="Best time" value={fish.optimalTime} />
            <StatBlock label="Best months" value={seasonText(fish.peakMonths)} />
            <StatBlock label="Typical size" value={fish.typicalSize} />
            <StatBlock label="Trophy class" value={fish.trophySize} />
          </div>

          {/* Recommended line */}
          <div style={{ marginBottom: 14 }}>
            <StatBlock label="Recommended line" value={fish.line} />
          </div>

          {/* Habitat */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>Where to find it</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{fish.habitat}</div>
          </div>

          {/* Baits */}
          {fish.baits.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Top baits right now</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {fish.baits.map(b => (
                  <span key={b} style={{
                    background: 'var(--green-dim)', border: '1px solid rgba(52,211,153,0.25)',
                    color: 'var(--green)', fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 500,
                  }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <p style={{
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0,
            borderLeft: '2px solid var(--accent)', paddingLeft: 10,
          }}>{fish.tip}</p>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>
            Sizes are general North-American benchmarks, not official state records.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [viewMode, setViewMode]             = useState<ViewMode>('regional');
  const [selection, setSelection]           = useState<MapSelection | null>(null);
  const [date, setDate]                     = useState('');
  const [time, setTime]                     = useState('');
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<ApiResponse | null>(null);
  const [error, setError]                   = useState('');
  const [species, setSpecies]               = useState<SpeciesResult[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [openFish, setOpenFish]             = useState<SpeciesResult | null>(null);

  const displayScore = useCountUp(result?.score.total ?? 0);

  // Set today's date/time on mount
  useEffect(() => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    setDate(`${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`);
    setTime(`${p(now.getHours())}:00`);
  }, []);

  // Fetch species after score loads
  useEffect(() => {
    if (!result) { setSpecies([]); return; }
    const w = result.weather;
    setSpeciesLoading(true);
    const params = new URLSearchParams({
      temp:          String(w.temperature),
      datetime:      w.datetime,
      pressureTrend: String(w.pressureTrend),
      cloud:         String(w.cloudCover),
      sunrise:       w.sunrise,
      sunset:        w.sunset,
      lat:           String(result.geo.latitude),
      lon:           String(result.geo.longitude),
      mode:          selection?.mode ?? 'regional',
    });
    if (selection?.mode === 'local' && selection.water) params.set('water', selection.water);
    fetch(`/api/species?${params}`)
      .then(r => r.json())
      .then((data: { species: SpeciesResult[] }) => setSpecies(data.species ?? []))
      .catch(() => setSpecies([]))
      .finally(() => setSpeciesLoading(false));
    // Re-fetches when the water type changes in Local view (score stays put).
  }, [result, selection?.mode, selection?.water]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selection) return;
    setLoading(true); setError(''); setResult(null); setSpecies([]);
    const params = new URLSearchParams({
      location: selection.name,
      lat: String(selection.lat), lon: String(selection.lon),
      datetime: `${date}T${time}`,
    });
    try {
      const res  = await fetch(`/api/score?${params}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Something went wrong.');
      else setResult(data);
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  }

  // A new spot clears the score; only changing the water type keeps it (species refetch only).
  function handleMapSelect(sel: MapSelection) {
    const sameSpot = selection && selection.mode === sel.mode &&
      selection.lat === sel.lat && selection.lon === sel.lon;
    setSelection(sel);
    if (!sameSpot) { setResult(null); setError(''); setSpecies([]); }
  }

  function switchMode(mode: ViewMode) {
    if (mode === viewMode) return;
    setViewMode(mode);
    setSelection(null);
    setResult(null);
    setError('');
    setSpecies([]);
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 7, padding: '8px 10px', fontSize: 13,
    color: 'var(--text-primary)', outline: 'none',
    width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    colorScheme: 'dark',
  };

  // Date is stored internally as YYYY-MM-DD, but the UI only shows month + day.
  // The year is inferred automatically (forecasts only reach ~16 days out).
  const [yStr, mStr, dStr] = (date || '0000-01-01').split('-');
  const curMonth = parseInt(mStr, 10) || 1;
  const curDay   = parseInt(dStr, 10) || 1;
  const curYear  = parseInt(yStr, 10) || new Date().getFullYear();
  const daysInMonth = new Date(curYear, curMonth, 0).getDate();

  const applyMD = (month: number, day: number) => {
    const now = new Date();
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let year = now.getFullYear();
    if (new Date(year, month - 1, day) < today0) year += 1; // roll Dec→Jan into next year
    const d = Math.min(day, new Date(year, month, 0).getDate());
    const p = (n: number) => String(n).padStart(2, '0');
    setDate(`${year}-${p(month)}-${p(d)}`);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* White-background key-out filter for fish illustrations.
          The field-guide art is painted on white. We build a brightness mask
          (luminance → alpha), then keep dark fish pixels and softly fade out the
          bright background across a feathered ramp (luminance ~0.8 → 1.0). The
          feather removes the white *and* the off-white JPG halo without the hard
          fringing of a pure threshold, and keeps the fish's full natural color. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="fishkey" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* 1 — luminance into the alpha channel (RGB zeroed) */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0.2126 0.7152 0.0722 0 0"
              result="lum" />
            {/* 2 — invert + feather: dark→opaque, white→transparent, soft band */}
            <feComponentTransfer in="lum" result="mask">
              <feFuncA type="table" tableValues="1 1 1 1 1 1 1 1 1 0.45 0" />
            </feComponentTransfer>
            {/* 3 — apply the mask's alpha to the original full-color art */}
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        height: 52, flexShrink: 0,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px',
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🎣</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.4px' }}>
          FishAbility
        </span>
        <span style={{
          fontSize: 11, color: 'var(--text-secondary)',
          borderLeft: '1px solid var(--border)', paddingLeft: 10, marginLeft: 2,
        }}>
          Know before you go
        </span>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
          Contact us:{' '}
          <a href="mailto:thenetwork.ops@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            thenetwork.ops@gmail.com
          </a>
        </span>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left — Map */}
        <section style={{
          width: '52%', flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* View toggle */}
          <div style={{
            flexShrink: 0, padding: '10px 14px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              display: 'inline-flex', padding: 3, gap: 3,
              background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8,
            }}>
              {([
                ['regional', 'Regional', 'Whole-region species'],
                ['local',    'Local',    'One body of water'],
              ] as const).map(([m, label]) => {
                const on = viewMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    style={{
                      border: 'none', cursor: 'pointer', borderRadius: 6,
                      padding: '5px 14px', fontSize: 12.5, fontWeight: 600,
                      background: on ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                      color: on ? '#fff' : 'var(--text-secondary)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {viewMode === 'regional'
                ? 'Fish across the whole region'
                : 'Fish in your specific lake, pond, or river'}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <MapPicker key={viewMode} mode={viewMode} onSelect={handleMapSelect} />
          </div>
        </section>

        {/* Right — Form + Results */}
        <section style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Form card */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 10,
              border: '1px solid var(--border)', padding: '14px 16px',
            }}>
              {/* Location row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={selection ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="2.5">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {selection ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selection.name}
                    {selection.mode === 'local' && selection.water && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>
                        · {WATER_TYPE_LABELS[selection.water]}
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {viewMode === 'regional'
                      ? 'Pick a region on the map'
                      : 'Search for a lake, pond, or river'}
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>Date</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={curMonth}
                        onChange={e => applyMD(parseInt(e.target.value, 10), curDay)}
                        style={{ ...inputStyle, flex: 2, cursor: 'pointer' }}
                      >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <select
                        value={curDay}
                        onChange={e => applyMD(curMonth, parseInt(e.target.value, 10))}
                        style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                      >
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>Time</label>
                    <input type="time" value={time}
                      onChange={e => setTime(e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      required />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selection}
                  style={{
                    background: !selection || loading
                      ? 'var(--bg-raised)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: !selection || loading ? 'var(--text-muted)' : 'white',
                    border: 'none', borderRadius: 7, padding: '9px 16px',
                    fontSize: 13, fontWeight: 600,
                    cursor: !selection || loading ? 'default' : 'pointer',
                    transition: 'opacity 0.15s, transform 0.1s',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => { if (selection && !loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  {loading ? 'Checking conditions…' : 'Get Fishability Score'}
                </button>
              </form>

              {error && (
                <p style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>⚠ {error}</p>
              )}
            </div>

            {/* Score card */}
            {result && (
              <div className="animate-fade-up" style={{
                background: 'var(--bg-card)', borderRadius: 10,
                border: '1px solid var(--border)', padding: '16px',
                overflow: 'hidden',
              }}>
                {/* Location + time */}
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {formatTime(result.weather.datetime)} · {result.geo.name}
                  {result.geo.admin1 ? `, ${result.geo.admin1}` : ''}
                </div>

                {/* Score + rating */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
                  <span
                    className={scoreClass(result.score.total)}
                    style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {displayScore}
                  </span>
                  <div style={{ paddingBottom: 6 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6, padding: '3px 10px',
                      fontSize: 13, fontWeight: 700,
                      color: scoreColor(result.score.total),
                      marginBottom: 4,
                    }}>
                      {result.score.rating}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>out of 100</div>
                  </div>
                </div>

                {/* Summary */}
                <p style={{
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65,
                  margin: '0 0 14px 0',
                  borderLeft: '2px solid var(--accent)',
                  paddingLeft: 10, opacity: 0.9,
                }}>
                  {result.score.summary}
                </p>

                {/* Factor spectrums — knob sits toward the right when conditions are ideal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 26px', marginBottom: 22 }}>
                  {(Object.entries(result.score.factors) as [string, ScoreFactor][]).map(([key, f]) => {
                    const frac = f.score / f.max;
                    const col  = scoreColor(frac * 100);
                    return (
                      <div key={key} title={f.detail} style={{ padding: '0 6px' }}>
                        <div style={{
                          fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'center',
                          marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
                        }}>
                          {FACTOR_LABELS[key]}
                        </div>
                        <div className="spectrum-track">
                          <div className="spectrum-knob" style={{ left: `${frac * 100}%`, background: col, boxShadow: `0 0 8px ${col}` }} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: col, textAlign: 'center', marginTop: 9 }}>
                          {f.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fishability timeline */}
                {result.hourly?.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
                    }}>
                      <span style={{
                        fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        Fishability Timeline
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        12 h before & after · marker = your time
                      </span>
                    </div>
                    <HourlyChart hourly={result.hourly} />
                  </div>
                )}
              </div>
            )}

            {/* Species */}
            {(result || speciesLoading) && (
              <div className="animate-fade-up stagger-3">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Species Forecast
                  </span>
                  <span style={{
                    fontSize: 10, color: 'var(--text-secondary)',
                    background: 'var(--bg-raised)', border: '1px solid var(--border-hi)',
                    borderRadius: 4, padding: '2px 7px',
                  }}>
                    {selection?.mode === 'local'
                      ? 'fish for this water & time'
                      : 'scored for this region & time'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {speciesLoading
                    ? Array.from({ length: 9 }).map((_, i) => <FishCardSkeleton key={i} index={i} />)
                    : species.map((fish, i) => <FishCard key={fish.id} fish={fish} index={i} onOpen={setOpenFish} />)
                  }
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      {openFish && <SpeciesModal fish={openFish} onClose={() => setOpenFish(null)} />}
    </div>
  );
}
