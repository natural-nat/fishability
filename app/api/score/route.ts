import { NextRequest, NextResponse } from 'next/server';
import { geocode, GeoLocation } from '@/lib/geocoding';
import { getWeather } from '@/lib/weather';
import { calculateScore } from '@/lib/scoring';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location  = searchParams.get('location');
  const datetime  = searchParams.get('datetime');
  const latParam  = searchParams.get('lat');
  const lonParam  = searchParams.get('lon');

  if ((!location && (!latParam || !lonParam)) || !datetime) {
    return NextResponse.json({ error: 'Missing location or datetime.' }, { status: 400 });
  }

  try {
    let geo: GeoLocation;
    if (latParam && lonParam) {
      geo = {
        name: location || 'Selected Location',
        latitude: parseFloat(latParam),
        longitude: parseFloat(lonParam),
        country: '',
      };
    } else {
      const result = await geocode(location!);
      if (!result) {
        return NextResponse.json(
          { error: 'Location not found. Try a city, lake, or river name.' },
          { status: 404 },
        );
      }
      geo = result;
    }

    const result = await getWeather(geo.latitude, geo.longitude, datetime);
    if (!result) {
      return NextResponse.json(
        { error: 'Weather data unavailable for that time. Forecasts are limited to 16 days ahead.' },
        { status: 400 },
      );
    }

    const { weather, hourly } = result;
    const score = calculateScore(weather);
    return NextResponse.json({ geo, weather, score, hourly });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
