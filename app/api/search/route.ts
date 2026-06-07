import { NextRequest, NextResponse } from 'next/server';
import type { WaterType } from '@/lib/species';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

/** Map an OSM key/value to one of our water types (null = not clearly water). */
function inferWater(key?: string, value?: string): { water: WaterType | null; kind: string | null } {
  const v = (value || '').toLowerCase();
  switch (v) {
    case 'pond':      return { water: 'pond',  kind: 'Pond' };
    case 'lake':      return { water: 'lake',  kind: 'Lake' };
    case 'reservoir': return { water: 'lake',  kind: 'Reservoir' };
    case 'river':     return { water: 'river', kind: 'River' };
    case 'stream':    return { water: 'river', kind: 'Stream' };
    case 'canal':     return { water: 'river', kind: 'Canal' };
  }
  if (key === 'water' || key === 'waterway') return { water: 'lake', kind: 'Water' };
  return { water: null, kind: null };
}

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const q = params.get('q');
  // When water=1, bias Photon toward lakes/ponds/rivers (Local view).
  const waterOnly = params.get('water') === '1';
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    // Photon is built on OpenStreetMap + Elasticsearch — handles typos and fuzzy matches
    const tags = waterOnly
      ? '&osm_tag=natural:water&osm_tag=waterway&osm_tag=water'
      : '';
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en${tags}`,
      { headers: { 'User-Agent': 'FishAbility/1.0' } }
    );
    const data = await res.json();
    const features: PhotonFeature[] = data.features || [];

    const results = features.map((f) => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      const name = p.name || p.city || 'Unknown';
      const parts = [p.name, p.city || p.county, p.state, p.country].filter(Boolean);
      const { water, kind } = inferWater(p.osm_key, p.osm_value);
      return {
        name,
        display_name: parts.join(', '),
        lat: String(lat),
        lon: String(lon),
        water,
        kind,
      };
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
