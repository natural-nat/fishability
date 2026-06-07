import { NextRequest, NextResponse } from 'next/server';
import { SPECIES, scoreSpecies, Species, RECOMMENDED_LINE, speciesWaters, WaterType, WATER_TYPES } from '@/lib/species';

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const temp          = parseFloat(sp.get('temp')          ?? '15');
  const datetime      = sp.get('datetime')                 ?? new Date().toISOString().slice(0, 16);
  const pressureTrend = parseFloat(sp.get('pressureTrend') ?? '0');
  const cloudCover    = parseFloat(sp.get('cloud')         ?? '50');
  const sunrise       = sp.get('sunrise')                  ?? '';
  const sunset        = sp.get('sunset')                   ?? '';
  const latParam      = sp.get('lat');
  const lonParam      = sp.get('lon');
  const mode          = sp.get('mode') === 'local' ? 'local' : 'regional';
  const waterParam    = sp.get('water');
  const water         = WATER_TYPES.includes(waterParam as WaterType) ? (waterParam as WaterType) : null;

  const lat = latParam ? parseFloat(latParam) : null;
  const lon = lonParam ? parseFloat(lonParam) : null;
  const hasCoords = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

  const inRange = (s: Species) =>
    hasCoords &&
    lat! >= s.range.latMin && lat! <= s.range.latMax &&
    lon! >= s.range.lonMin && lon! <= s.range.lonMax;

  const byRange = hasCoords ? SPECIES.filter(inRange) : SPECIES;
  let candidates = byRange.length >= 1 ? byRange : SPECIES;

  // Local view: keep only species that live in this kind of water body.
  // Fall back to the regional set if the filter would leave nothing.
  if (mode === 'local' && water) {
    const local = candidates.filter(s => speciesWaters(s.id).includes(water));
    if (local.length) candidates = local;
  }

  const results = candidates.map((species) => {
    const scored = scoreSpecies(species, temp, datetime, pressureTrend, cloudCover, sunrise, sunset);
    return {
      id:             species.id,
      name:           species.name,
      scientificName: species.scientificName,
      habitat:        species.habitat,
      illustration:   species.illustration,
      catchability:   species.catchability,
      typicalSize:    species.typicalSize,
      trophySize:     species.trophySize,
      line:           RECOMMENDED_LINE[species.id] ?? '6–10 lb mono',
      peakMonths:     species.peakMonths,
      tip:            species.tip,
      ...scored,
    };
  });

  // Rank by realistic catch chance, then by how favorable conditions are
  results.sort((a, b) => (b.catchChance - a.catchChance) || (b.conditions - a.conditions));

  return NextResponse.json({ species: results });
}
