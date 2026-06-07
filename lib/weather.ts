export interface WeatherData {
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  cloudCover: number;
  pressure: number;
  pressureTrend: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  datetime: string;
}

export interface HourlyPoint {
  hour: number;       // 0–23 (clock hour of this point)
  datetime: string;
  score: number;      // 0–100 fishability
  isCenter: boolean;  // true for the selected/queried hour (chart centers here)
}

interface RawHourly {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  cloud_cover: number[];
  surface_pressure: number[];
  weather_code: number[];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildWeatherData(raw: RawHourly, idx: number, sunrise: string, sunset: string): WeatherData {
  const pressureTrend = idx >= 3
    ? raw.surface_pressure[idx] - raw.surface_pressure[idx - 3]
    : 0;
  return {
    temperature: raw.temperature_2m[idx],
    precipitationProbability: raw.precipitation_probability[idx] ?? 0,
    precipitation: raw.precipitation[idx] ?? 0,
    windSpeed: raw.wind_speed_10m[idx],
    cloudCover: raw.cloud_cover[idx],
    pressure: raw.surface_pressure[idx],
    pressureTrend,
    weatherCode: raw.weather_code[idx],
    sunrise,
    sunset,
    datetime: raw.time[idx],
  };
}

const HALF_WINDOW = 12; // hours before/after the selected time

export async function getWeather(
  lat: number,
  lon: number,
  datetime: string,
): Promise<{ weather: WeatherData; hourly: HourlyPoint[] } | null> {
  const date = datetime.split('T')[0];

  // Fetch the day before, the day itself, and the day after so we can show
  // ±12 hours centered on the selected time even across midnight.
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('hourly',
    'temperature_2m,precipitation_probability,precipitation,wind_speed_10m,cloud_cover,surface_pressure,weather_code');
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', addDays(date, -1));
  url.searchParams.set('end_date', addDays(date, 1));

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.hourly) return null;

  const raw: RawHourly = data.hourly;

  // Sunrise/sunset for the selected day is the 2nd of the 3 returned days
  const sunrise: string = data.daily?.sunrise?.[1] ?? data.daily?.sunrise?.[0] ?? '';
  const sunset:  string = data.daily?.sunset?.[1]  ?? data.daily?.sunset?.[0]  ?? '';

  const targetHour = datetime.substring(0, 13); // "YYYY-MM-DDTHH"
  const targetIdx  = raw.time.findIndex((t: string) => t.substring(0, 13) === targetHour);
  if (targetIdx === -1) return null;

  const weather = buildWeatherData(raw, targetIdx, sunrise, sunset);

  // Centered ±12h window, clamped to available data
  const { calculateScore } = await import('./scoring');
  const start = Math.max(0, targetIdx - HALF_WINDOW);
  const end   = Math.min(raw.time.length - 1, targetIdx + HALF_WINDOW);

  const hourly: HourlyPoint[] = [];
  for (let i = start; i <= end; i++) {
    const w = buildWeatherData(raw, i, sunrise, sunset);
    hourly.push({
      hour: parseInt(raw.time[i].substring(11, 13), 10),
      datetime: raw.time[i],
      score: calculateScore(w).total,
      isCenter: i === targetIdx,
    });
  }

  return { weather, hourly };
}
