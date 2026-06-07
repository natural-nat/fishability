'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, CircleMarker, useMap } from 'react-leaflet';
import type { Layer, PathOptions, GeoJSON as LeafletGeoJSON } from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';
import statesData from './us-states.json';
import { STATE_TO_REGION, regionById } from '@/lib/regions';
import { WaterType, WATER_TYPES, WATER_TYPE_LABELS, WATER_TYPE_HINTS } from '@/lib/species';

export type ViewMode = 'regional' | 'local';

export interface MapSelection {
  name: string;
  lat: number;
  lon: number;
  mode: ViewMode;
  /** Regional view only */
  regionId?: string;
  /** Local view only — the kind of water body picked */
  water?: WaterType;
  /** Local view only — human label like "Pond" / "River" */
  kind?: string;
}

interface StateProps { name: string }

// Only render the contiguous 48 + DC (states assigned to a region)
const CONTIGUOUS: GeoJsonObject = {
  type: 'FeatureCollection',
  features: (statesData as unknown as { features: Feature[] }).features.filter(
    f => STATE_TO_REGION[(f.properties as StateProps).name],
  ),
} as GeoJsonObject;

// ─── Regional layer (interactive region picker) ──────────────────────────────────

function RegionLayer({
  selected, hovered, onSelect, onHover,
}: {
  selected: string | null;
  hovered: string | null;
  onSelect: (sel: MapSelection) => void;
  onHover: (regionId: string | null) => void;
}) {
  const geoRef = useRef<LeafletGeoJSON | null>(null);

  const styleFor = (regionId: string | undefined): PathOptions => {
    const r = regionId ? regionById(regionId) : undefined;
    const isSel = !!regionId && regionId === selected;
    const isHov = !!regionId && regionId === hovered;
    if (!r) {
      return { fillColor: '#222', weight: 0.4, color: 'rgba(255,255,255,0.1)', fillOpacity: 0.05 };
    }
    return {
      fillColor: isSel ? '#8b5cf6' : r.color,
      weight: isSel || isHov ? 1.6 : 0.6,
      color: isSel || isHov ? '#d6c8ff' : 'rgba(255,255,255,0.18)',
      fillOpacity: isSel ? 0.8 : isHov ? 0.65 : 0.42,
    };
  };

  const style = (feature?: Feature): PathOptions =>
    styleFor(feature ? STATE_TO_REGION[(feature.properties as StateProps).name] : undefined);

  // Re-apply styles whenever hover/selection changes
  useEffect(() => {
    geoRef.current?.setStyle(style as (f?: Feature) => PathOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, hovered]);

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const regionId = STATE_TO_REGION[(feature.properties as StateProps).name];
    layer.on({
      mouseover: () => regionId && onHover(regionId),
      mouseout:  () => onHover(null),
      click:     () => {
        const r = regionId ? regionById(regionId) : undefined;
        if (r) onSelect({ name: r.name, lat: r.centroid[0], lon: r.centroid[1], regionId: r.id, mode: 'regional' });
      },
    });
  };

  return (
    <GeoJSON
      ref={geoRef as never}
      data={CONTIGUOUS}
      style={style as never}
      onEachFeature={onEachFeature}
    />
  );
}

// ─── Static faint state outlines (background for Local view) ──────────────────────

function StatesBackdrop() {
  const style = (): PathOptions => ({
    fillColor: '#222', weight: 0.5, color: 'rgba(255,255,255,0.12)', fillOpacity: 0.06,
  });
  return <GeoJSON data={CONTIGUOUS} style={style as never} interactive={false} />;
}

// ─── Imperatively fly the map to a point ─────────────────────────────────────────

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 10, { duration: 0.8 });
  }, [lat, lon, map]);
  return null;
}

// ─── Local search overlay ────────────────────────────────────────────────────────

interface SearchResult {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  water: WaterType | null;
  kind: string | null;
}

function LocalSearch({
  selected, onPick, onWaterChange,
}: {
  selected: MapSelection | null;
  onPick: (r: SearchResult) => void;
  onWaterChange: (w: WaterType) => void;
}) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search (all state updates run async inside the timeout)
  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(async () => {
      if (q.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&water=1`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => clearTimeout(id);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (r: SearchResult) => {
    setQuery(r.name);
    setOpen(false);
    onPick(r);
  };

  return (
    <div
      ref={boxRef}
      style={{
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000,
        maxWidth: 340,
      }}
    >
      <div style={{
        background: 'rgba(20,20,28,0.94)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-hi)', borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.45)', overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.4">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search a lake, pond, or river…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 13,
            }}
          />
          {loading && (
            <span style={{
              width: 13, height: 13, borderRadius: '50%',
              border: '2px solid var(--border-hi)', borderTopColor: 'var(--accent)',
              animation: 'spin 0.7s linear infinite', flexShrink: 0,
            }} />
          )}
        </div>

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', maxHeight: 240, overflowY: 'auto' }}>
            {results.map((r, i) => (
              <button
                key={`${r.lat},${r.lon},${i}`}
                onClick={() => pick(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '8px 11px', borderTop: i ? '1px solid var(--border)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                  {r.kind && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: 'var(--accent)',
                      background: 'var(--accent-glow)', borderRadius: 4, padding: '1px 5px',
                    }}>{r.kind}</span>
                  )}
                </div>
                <div style={{
                  fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected water + type chips */}
      {selected && (
        <div style={{
          marginTop: 8,
          background: 'rgba(20,20,28,0.94)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-hi)', borderRadius: 8,
          padding: '10px 11px', boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</span>
          </div>

          <div style={{
            fontSize: 10, color: 'var(--text-muted)', marginTop: 9, marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
          }}>
            Water type — sets which fish are listed
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {WATER_TYPES.map(w => {
              const active = selected.water === w;
              return (
                <button
                  key={w}
                  onClick={() => onWaterChange(w)}
                  title={WATER_TYPE_HINTS[w]}
                  style={{
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    padding: '4px 9px', borderRadius: 99,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-hi)'}`,
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}
                >
                  {WATER_TYPE_LABELS[w]}
                </button>
              );
            })}
          </div>
          {selected.water && (
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 7 }}>
              {WATER_TYPE_HINTS[selected.water]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────────

export default function MapPicker({
  mode, onSelect,
}: {
  mode: ViewMode;
  onSelect: (sel: MapSelection) => void;
}) {
  // State resets across view modes because the parent remounts via key={mode}.
  const [selected, setSelected]     = useState<string | null>(null);     // regional region id
  const [hovered, setHovered]       = useState<string | null>(null);
  const [localSel, setLocalSel]     = useState<MapSelection | null>(null); // local water body

  const active = useMemo(() => {
    const id = hovered ?? selected;
    return id ? regionById(id) : undefined;
  }, [hovered, selected]);

  const handleRegionSelect = (sel: MapSelection) => {
    setSelected(sel.regionId ?? null);
    onSelect(sel);
  };

  const handleLocalPick = (r: SearchResult) => {
    const sel: MapSelection = {
      name: r.name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      mode: 'local',
      water: r.water ?? 'pond',  // default to pond when OSM can't tell us
      kind: r.kind ?? undefined,
    };
    setLocalSel(sel);
    onSelect(sel);
  };

  const handleWaterChange = (w: WaterType) => {
    if (!localSel) return;
    const sel = { ...localSel, water: w };
    setLocalSel(sel);
    onSelect(sel);
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapContainer
        center={[39.5, -96]}
        zoom={4}
        minZoom={4}
        maxZoom={12}
        maxBounds={[[22, -128], [51, -64]]}
        maxBoundsViscosity={1}
        style={{ height: '100%', width: '100%', background: 'var(--bg-base)' }}
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          noWrap
        />
        <ZoomControl position="bottomright" />

        {mode === 'regional' ? (
          <RegionLayer
            selected={selected}
            hovered={hovered}
            onSelect={handleRegionSelect}
            onHover={setHovered}
          />
        ) : (
          <>
            <StatesBackdrop />
            {localSel && (
              <>
                <FlyTo lat={localSel.lat} lon={localSel.lon} />
                <CircleMarker
                  center={[localSel.lat, localSel.lon]}
                  radius={8}
                  pathOptions={{ color: '#d6c8ff', weight: 2, fillColor: '#8b5cf6', fillOpacity: 0.9 }}
                />
              </>
            )}
          </>
        )}
      </MapContainer>

      {mode === 'regional' ? (
        /* Region info overlay */
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          background: 'rgba(20,20,28,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-hi)', borderRadius: 8,
          padding: '10px 14px', pointerEvents: 'none',
          minWidth: 180,
        }}>
          {active ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: selected === active.id ? '#8b5cf6' : active.color,
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {active.name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                {selected === active.id ? 'Selected — check conditions →' : 'Click to select this region'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Pick a region
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Hover the map, then click an area
              </div>
            </>
          )}
        </div>
      ) : (
        <LocalSearch
          selected={localSel}
          onPick={handleLocalPick}
          onWaterChange={handleWaterChange}
        />
      )}
    </div>
  );
}
