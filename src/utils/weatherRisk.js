import { getAirportCoords } from './airportCoords';

/**
 * ── In-Memory Weather Cache (15-minute TTL) ─────────────────────────
 * Prevents redundant external calls across multiple flight cards
 */
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Maps Open-Meteo WMO weather interpretation codes to readable conditions
 * and semantic Lucide weather icons.
 */
export function mapWmoToCondition(code) {
  if (code === 0) return { label: 'Clear Sky', icon: 'Sun', severity: 'low' };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: 'CloudSun', severity: 'low' };
  if (code === 45 || code === 48) return { label: 'Fog / Mist', icon: 'CloudFog', severity: 'moderate' };
  if (code >= 51 && code <= 57) return { label: 'Light Drizzle', icon: 'CloudDrizzle', severity: 'moderate' };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? 'Heavy Rain' : 'Rain', icon: 'CloudRain', severity: code >= 65 ? 'high' : 'moderate' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'CloudSnow', severity: 'moderate' };
  if (code >= 80 && code <= 82) return { label: code === 82 ? 'Heavy Showers' : 'Showers', icon: 'CloudRain', severity: code === 82 ? 'high' : 'moderate' };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', icon: 'CloudSnow', severity: 'moderate' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: 'CloudLightning', severity: 'high' };
  return { label: 'Fair Skies', icon: 'Sun', severity: 'low' };
}

/**
 * Fetches real-time weather for an IATA airport code from Open-Meteo
 * with 15-minute in-memory caching and automatic realistic fallback.
 */
export async function fetchAirportWeather(iataCode) {
  if (!iataCode) return null;
  const cleanCode = iataCode.trim().toUpperCase();

  // Return cached result if fresh
  const cached = weatherCache.get(cleanCode);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const coords = getAirportCoords(cleanCode) || {
    iata: cleanCode,
    lat: 20.5937,
    lng: 78.9629,
    city: cleanCode,
    name: `${cleanCode} Airfield`
  };

  const makeFallback = () => ({
    iata: cleanCode,
    city: coords.city || cleanCode,
    temperature: 26,
    windSpeed: 12,
    precipitation: 0,
    weatherCode: 1,
    condition: 'Partly Cloudy',
    iconName: 'CloudSun',
    visibility: 10000,
    visibilityKm: 10,
    cloudCover: 20,
    source: 'fallback',
    updatedAt: new Date().toISOString()
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,cloud_cover&hourly=visibility&forecast_days=1&timezone=auto`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const current = json.current || {};
    const hourly = json.hourly || {};

    // Determine current visibility from hourly data array
    let visibilityMeters = 10000;
    if (Array.isArray(hourly.visibility) && hourly.visibility.length > 0) {
      if (Array.isArray(hourly.time) && current.time) {
        const curHourPrefix = current.time.substring(0, 13);
        const matchIdx = hourly.time.findIndex(t => typeof t === 'string' && t.startsWith(curHourPrefix));
        if (matchIdx >= 0 && typeof hourly.visibility[matchIdx] === 'number') {
          visibilityMeters = hourly.visibility[matchIdx];
        } else {
          visibilityMeters = hourly.visibility[0] || 10000;
        }
      } else {
        visibilityMeters = hourly.visibility[0] || 10000;
      }
    }

    const wmo = mapWmoToCondition(current.weather_code ?? 0);
    const data = {
      iata: cleanCode,
      city: coords.city || cleanCode,
      temperature: Math.round(current.temperature_2m ?? 25),
      windSpeed: Math.round(current.wind_speed_10m ?? 10),
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weather_code ?? 0,
      condition: wmo.label,
      iconName: wmo.icon,
      visibility: visibilityMeters,
      visibilityKm: Math.max(0.1, Math.round((visibilityMeters / 1000) * 10) / 10),
      cloudCover: current.cloud_cover ?? 0,
      source: 'live',
      updatedAt: new Date().toISOString()
    };

    weatherCache.set(cleanCode, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[WeatherRisk] Open-Meteo network fallback for ${cleanCode}:`, err.message);
    }
    const fallbackData = makeFallback();
    weatherCache.set(cleanCode, { data: fallbackData, timestamp: Date.now() });
    return fallbackData;
  }
}

/**
 * Fetches real-time weather simultaneously for origin and destination airports
 */
export async function fetchRouteWeather(originIata, destIata) {
  const [originWeather, destWeather] = await Promise.all([
    fetchAirportWeather(originIata),
    fetchAirportWeather(destIata)
  ]);
  return { originWeather, destWeather };
}

/**
 * Predicts flight delay risk score (0-100), risk level (Low, Moderate, High),
 * and plain-English explanation based on meteorology and layover stops.
 *
 * Risk Thresholds:
 * - High Risk: Thunderstorms (95-99), heavy rain (>= 5mm), strong wind (>= 38 km/h), dense fog (< 1500m).
 * - Moderate Risk: Rain (> 0.5mm), moderate wind (>= 22 km/h), mist/haze (< 4500m), fog (45, 48), or stops >= 1.
 * - Low Risk: Clear or cloudy skies with good visibility and calm wind.
 */
export function predictDelayRisk(originWeather, destWeather, stops = 0) {
  if (!originWeather || !destWeather) {
    return {
      level: 'Low',
      score: 15,
      reason: 'Normal operational airspace conditions',
      issues: []
    };
  }

  const numStops = parseInt(stops, 10) || 0;
  const issues = [];
  let maxSeverity = 'Low'; // 'Low' | 'Moderate' | 'High'
  let baseScore = 12;

  const evaluateAirport = (w) => {
    if (!w) return;
    const label = `${w.city || w.iata} (${w.iata})`;

    // ── High Risk Conditions ──
    if (w.weatherCode >= 95 && w.weatherCode <= 99) {
      issues.push(`Thunderstorms at ${label}`);
      maxSeverity = 'High';
      baseScore = Math.max(baseScore, 86);
    } else if (w.precipitation >= 5) {
      issues.push(`Heavy rain (${w.precipitation}mm) at ${label}`);
      maxSeverity = 'High';
      baseScore = Math.max(baseScore, 82);
    } else if (w.windSpeed >= 38) {
      issues.push(`Strong winds (${w.windSpeed} km/h) at ${label}`);
      maxSeverity = 'High';
      baseScore = Math.max(baseScore, 80);
    } else if (w.visibility < 1500) {
      issues.push(`Low visibility / Fog (${Math.round(w.visibility)}m) at ${label}`);
      maxSeverity = 'High';
      baseScore = Math.max(baseScore, 84);
    }
    // ── Moderate Risk Conditions ──
    else if (w.precipitation > 0.5) {
      issues.push(`Rain showers (${w.precipitation}mm) at ${label}`);
      if (maxSeverity !== 'High') maxSeverity = 'Moderate';
      baseScore = Math.max(baseScore, 48);
    } else if (w.windSpeed >= 22) {
      issues.push(`Moderate winds (${w.windSpeed} km/h) at ${label}`);
      if (maxSeverity !== 'High') maxSeverity = 'Moderate';
      baseScore = Math.max(baseScore, 44);
    } else if (w.visibility < 4500 || w.weatherCode === 45 || w.weatherCode === 48) {
      issues.push(`Mist & reduced visibility (${w.visibilityKm}km) at ${label}`);
      if (maxSeverity !== 'High') maxSeverity = 'Moderate';
      baseScore = Math.max(baseScore, 46);
    }
  };

  evaluateAirport(originWeather);
  evaluateAirport(destWeather);

  // Connection stops factor
  if (numStops >= 1) {
    issues.push(`${numStops} stop${numStops > 1 ? 's' : ''} increases connection risk`);
    if (maxSeverity === 'Low') {
      maxSeverity = 'Moderate';
      baseScore = 38 + (numStops * 6);
    } else {
      baseScore = Math.min(98, baseScore + (numStops * 5));
    }
  }

  const finalReason = issues.length > 0
    ? issues.slice(0, 2).join(' • ')
    : `Clear skies & calm winds at ${originWeather.iata} & ${destWeather.iata}`;

  return {
    level: maxSeverity,
    score: Math.min(99, Math.max(5, baseScore)),
    reason: finalReason,
    issues
  };
}

