import { WeatherData } from './weather';

export interface ScoreFactor {
  score: number;
  max: number;
  label: string;
  detail: string;
}

export interface ScoreResult {
  total: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  summary: string;
  factors: {
    timeOfDay: ScoreFactor;
    pressure: ScoreFactor;
    wind: ScoreFactor;
    cloudCover: ScoreFactor;
    rain: ScoreFactor;
    temperature: ScoreFactor;
  };
}

function scoreTimeOfDay(weather: WeatherData): ScoreFactor {
  const target = new Date(weather.datetime);
  const sunrise = new Date(weather.sunrise);
  const sunset = new Date(weather.sunset);

  const minFromSunrise = (target.getTime() - sunrise.getTime()) / 60000;
  const minFromSunset = (sunset.getTime() - target.getTime()) / 60000;
  const isNight = target < sunrise || target > sunset;

  if (Math.abs(minFromSunrise) <= 90 || Math.abs(minFromSunset) <= 90) {
    return { score: 15, max: 15, label: 'Prime Time', detail: 'Dawn/dusk — peak feeding window for most species' };
  }
  if ((minFromSunrise > 0 && minFromSunrise <= 240) || (minFromSunset > 0 && minFromSunset <= 240)) {
    return { score: 10, max: 15, label: 'Good', detail: 'Morning or evening — fish are active' };
  }
  if (isNight) {
    return { score: 5, max: 15, label: 'Night', detail: 'Some species (catfish, walleye) feed well at night' };
  }
  return { score: 4, max: 15, label: 'Midday', detail: 'Bright midday sun pushes fish to deeper, cooler water' };
}

function scorePressure(weather: WeatherData): ScoreFactor {
  const { pressureTrend, pressure } = weather;

  if (pressureTrend > 1.5) {
    return { score: 20, max: 20, label: 'Rising', detail: 'Pressure rising — fish actively feeding near surface' };
  }
  if (pressureTrend > 0.5) {
    return { score: 17, max: 20, label: 'Slightly Rising', detail: 'Slowly rising pressure — generally good conditions' };
  }
  if (pressureTrend >= -0.5) {
    if (pressure > 1013) {
      return { score: 18, max: 20, label: 'Stable High', detail: 'Stable high pressure — reliable, predictable fishing' };
    }
    return { score: 13, max: 20, label: 'Stable', detail: 'Pressure holding steady — consistent conditions' };
  }
  if (pressureTrend > -1.5) {
    return { score: 9, max: 20, label: 'Slightly Falling', detail: 'Slow pressure drop — fish may become less active' };
  }
  return { score: 4, max: 20, label: 'Falling', detail: 'Falling pressure — fish often stop feeding and go deep' };
}

function scoreWind(weather: WeatherData): ScoreFactor {
  const { windSpeed } = weather;

  if (windSpeed <= 8) {
    return { score: 20, max: 20, label: 'Calm', detail: `${windSpeed} km/h — perfect, easy to cast and control` };
  }
  if (windSpeed <= 20) {
    return { score: 15, max: 20, label: 'Light', detail: `${windSpeed} km/h — great conditions` };
  }
  if (windSpeed <= 35) {
    return { score: 8, max: 20, label: 'Moderate', detail: `${windSpeed} km/h — manageable but casting is harder` };
  }
  return { score: 2, max: 20, label: 'Strong', detail: `${windSpeed} km/h — difficult to fish, safety concern on open water` };
}

function scoreCloudCover(weather: WeatherData): ScoreFactor {
  const { cloudCover } = weather;

  if (cloudCover >= 40 && cloudCover <= 80) {
    return { score: 15, max: 15, label: 'Partly Cloudy', detail: `${cloudCover}% — ideal diffused light, fish less spooked` };
  }
  if (cloudCover > 80) {
    return { score: 11, max: 15, label: 'Overcast', detail: `${cloudCover}% — fish feel secure, often more active` };
  }
  if (cloudCover >= 20) {
    return { score: 9, max: 15, label: 'Mostly Clear', detail: `${cloudCover}% — decent, fish in shaded areas` };
  }
  return { score: 5, max: 15, label: 'Clear Sky', detail: `${cloudCover}% — bright sun pushes fish to shade and deep water` };
}

function scoreRain(weather: WeatherData): ScoreFactor {
  const { precipitationProbability, precipitation } = weather;

  if (precipitation > 5) {
    return { score: 3, max: 15, label: 'Heavy Rain', detail: 'Heavy rain muddies water and makes fishing uncomfortable' };
  }
  if (precipitationProbability >= 60) {
    return { score: 6, max: 15, label: 'Likely Rain', detail: `${precipitationProbability}% chance — reduced visibility in water` };
  }
  if (precipitationProbability >= 15) {
    return { score: 15, max: 15, label: 'Light Chance', detail: `${precipitationProbability}% chance — light rain often triggers feeding` };
  }
  return { score: 12, max: 15, label: 'Dry', detail: 'No rain — comfortable conditions on the water' };
}

function scoreTemperature(weather: WeatherData): ScoreFactor {
  const { temperature } = weather;

  if (temperature >= 15 && temperature <= 25) {
    return { score: 15, max: 15, label: 'Ideal', detail: `${temperature}°C — fish are most active in this range` };
  }
  if (temperature >= 10 && temperature < 15) {
    return { score: 11, max: 15, label: 'Cool', detail: `${temperature}°C — good, especially for trout and bass` };
  }
  if (temperature > 25 && temperature <= 30) {
    return { score: 9, max: 15, label: 'Warm', detail: `${temperature}°C — fish may seek deeper, cooler water` };
  }
  if (temperature >= 5 && temperature < 10) {
    return { score: 6, max: 15, label: 'Cold', detail: `${temperature}°C — fish metabolism slows, less feeding` };
  }
  if (temperature > 30) {
    return { score: 4, max: 15, label: 'Hot', detail: `${temperature}°C — fish stressed, sheltering in deep water` };
  }
  return { score: 2, max: 15, label: 'Very Cold', detail: `${temperature}°C — fish nearly dormant` };
}

export function calculateScore(weather: WeatherData): ScoreResult {
  const factors = {
    timeOfDay: scoreTimeOfDay(weather),
    pressure: scorePressure(weather),
    wind: scoreWind(weather),
    cloudCover: scoreCloudCover(weather),
    rain: scoreRain(weather),
    temperature: scoreTemperature(weather),
  };

  const total = Object.values(factors).reduce((sum, f) => sum + f.score, 0);

  let rating: ScoreResult['rating'];
  if (total >= 75) rating = 'Excellent';
  else if (total >= 55) rating = 'Good';
  else if (total >= 35) rating = 'Fair';
  else rating = 'Poor';

  const summary = generateSummary(weather, factors, total);
  return { total, rating, summary, factors };
}

function generateSummary(
  weather: WeatherData,
  factors: ScoreResult['factors'],
  total: number,
): string {
  const pros: string[] = [];
  const cons: string[] = [];

  if (factors.timeOfDay.score >= 13) pros.push('prime feeding window');
  else if (factors.timeOfDay.score >= 9) pros.push('active time of day');

  if (factors.pressure.score >= 17) pros.push('rising pressure encouraging feeding');
  else if (factors.pressure.score >= 15) pros.push('stable high pressure');

  if (factors.wind.score >= 18) pros.push('calm winds');
  if (factors.temperature.score >= 13) pros.push('ideal temperature');
  if (factors.rain.score === 15) pros.push('light rain stimulating surface activity');
  if (factors.cloudCover.score >= 13) pros.push('cloud cover reducing fish wariness');

  if (factors.timeOfDay.score <= 4) cons.push('midday sun pushing fish into deep cover');
  if (factors.pressure.score <= 6) cons.push('sharp pressure drop suppressing feeding');
  if (factors.wind.score <= 5) cons.push(`${weather.windSpeed} km/h winds making conditions rough`);
  if (factors.temperature.score <= 4) {
    cons.push(weather.temperature < 5
      ? `${weather.temperature}°C has slowed fish metabolism significantly`
      : `${weather.temperature}°C heat has pushed fish to deep, cool water`);
  }
  if (factors.rain.score <= 5) cons.push('heavy rain reducing water clarity');

  const lead =
    total >= 75 ? 'Excellent day to be on the water.' :
    total >= 55 ? 'Decent conditions overall.' :
    total >= 35 ? 'Tough but fishable with the right approach.' :
    'Difficult conditions today.';

  const parts = [lead];
  if (pros.length > 0) {
    const s = pros.slice(0, 2).join(' and ');
    parts.push(`${s[0].toUpperCase() + s.slice(1)} ${pros.length === 1 ? 'is' : 'are'} working in your favor.`);
  }
  if (cons.length > 0) {
    const s = cons[0];
    parts.push(`${s[0].toUpperCase() + s.slice(1)} is the main challenge.`);
  }
  return parts.join(' ');
}
