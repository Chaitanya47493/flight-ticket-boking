// Serverless proxy for OpenSky Network Live Radar over India
// Bounding box for India: lat: 6 to 37, lon: 68 to 98

let memoryCache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

// Hubs: DEL, BOM, BLR, HYD, MAA, CCU, GOI, VGA
const SIMULATED_ROUTES = [
  { callsign: 'IGO204', origin: 'DEL', dest: 'BOM', originLat: 28.5562, originLng: 77.1000, destLat: 19.0896, destLng: 72.8656, speedKmh: 780, altM: 10668, offset: 120, duration: 7200 },
  { callsign: 'AIC102', origin: 'BOM', dest: 'DEL', originLat: 19.0896, originLng: 72.8656, destLat: 28.5562, destLng: 77.1000, speedKmh: 810, altM: 11277, offset: 950, duration: 7200 },
  { callsign: 'VTI820', origin: 'BLR', dest: 'DEL', originLat: 13.1986, originLng: 77.7066, destLat: 28.5562, destLng: 77.1000, speedKmh: 830, altM: 10972, offset: 2300, duration: 9600 },
  { callsign: 'IGO538', origin: 'HYD', dest: 'BLR', originLat: 17.2403, originLng: 78.4294, destLat: 13.1986, destLng: 77.7066, speedKmh: 690, altM: 8534, offset: 400, duration: 4200 },
  { callsign: 'SEJ816', origin: 'DEL', dest: 'CCU', originLat: 28.5562, originLng: 77.1000, destLat: 22.6547, destLng: 88.4467, speedKmh: 790, altM: 9753, offset: 1800, duration: 7800 },
  { callsign: 'AIC542', origin: 'DEL', dest: 'HYD', originLat: 28.5562, originLng: 77.1000, destLat: 17.2403, destLng: 78.4294, speedKmh: 800, altM: 10363, offset: 3100, duration: 7500 },
  { callsign: 'IGO611', origin: 'BOM', dest: 'GOI', originLat: 19.0896, originLng: 72.8656, destLat: 15.3808, destLng: 73.8314, speedKmh: 680, altM: 7924, offset: 600, duration: 3900 },
  { callsign: 'AKJ130', origin: 'BOM', dest: 'BLR', originLat: 19.0896, originLng: 72.8656, destLat: 13.1986, destLng: 77.7066, speedKmh: 750, altM: 9448, offset: 2700, duration: 6000 },
  { callsign: 'IGO924', origin: 'MAA', dest: 'DEL', originLat: 12.9941, originLng: 80.1709, destLat: 28.5562, destLng: 77.1000, speedKmh: 840, altM: 11582, offset: 1500, duration: 9900 },
  { callsign: 'AIC439', origin: 'CCU', dest: 'BOM', originLat: 22.6547, originLng: 88.4467, destLat: 19.0896, destLng: 72.8656, speedKmh: 820, altM: 10972, offset: 3800, duration: 9300 },
  { callsign: 'IGO721', origin: 'BLR', dest: 'VGA', originLat: 13.1986, originLng: 77.7066, destLat: 16.5304, destLng: 80.7968, speedKmh: 670, altM: 7620, offset: 850, duration: 4500 },
  { callsign: 'VTI995', origin: 'DEL', dest: 'BOM', originLat: 28.5562, originLng: 77.1000, destLat: 19.0896, destLng: 72.8656, speedKmh: 800, altM: 10668, offset: 4200, duration: 7200 },
  { callsign: 'IGO481', origin: 'DEL', dest: 'BLR', originLat: 28.5562, originLng: 77.1000, destLat: 13.1986, destLng: 77.7066, speedKmh: 830, altM: 11277, offset: 500, duration: 9600 },
  { callsign: 'SEJ302', origin: 'BOM', dest: 'HYD', originLat: 19.0896, originLng: 72.8656, destLat: 17.2403, destLng: 78.4294, speedKmh: 720, altM: 8839, offset: 2100, duration: 5100 },
  { callsign: 'AIC671', origin: 'BOM', dest: 'MAA', originLat: 19.0896, originLng: 72.8656, destLat: 12.9941, destLng: 80.1709, speedKmh: 790, altM: 9753, offset: 3400, duration: 6900 },
  { callsign: 'IGO354', origin: 'CCU', dest: 'DEL', originLat: 22.6547, originLng: 88.4467, destLat: 28.5562, destLng: 77.1000, speedKmh: 810, altM: 10668, offset: 1100, duration: 8100 },
  { callsign: 'AKJ110', origin: 'DEL', dest: 'BOM', originLat: 28.5562, originLng: 77.1000, destLat: 19.0896, destLng: 72.8656, speedKmh: 770, altM: 10058, offset: 2800, duration: 7200 },
  { callsign: 'IGO842', origin: 'HYD', dest: 'GOI', originLat: 17.2403, originLng: 78.4294, destLat: 15.3808, destLng: 73.8314, speedKmh: 710, altM: 8534, offset: 900, duration: 4800 },
  { callsign: 'AIC512', origin: 'BLR', dest: 'HYD', originLat: 13.1986, originLng: 77.7066, destLat: 17.2403, destLng: 78.4294, speedKmh: 680, altM: 8229, offset: 1600, duration: 4200 },
  { callsign: 'VTI706', origin: 'CCU', dest: 'BLR', originLat: 22.6547, originLng: 88.4467, destLat: 13.1986, destLng: 77.7066, speedKmh: 830, altM: 11277, offset: 3900, duration: 9300 },
  { callsign: 'IGO291', origin: 'DEL', dest: 'VGA', originLat: 28.5562, originLng: 77.1000, destLat: 16.5304, destLng: 80.7968, speedKmh: 820, altM: 10972, offset: 2400, duration: 8700 },
  { callsign: 'SEJ405', origin: 'MAA', dest: 'BOM', originLat: 12.9941, originLng: 80.1709, destLat: 19.0896, destLng: 72.8656, speedKmh: 780, altM: 9448, offset: 700, duration: 6900 },
  { callsign: 'IGO172', origin: 'GOI', dest: 'BOM', originLat: 15.3808, originLng: 73.8314, destLat: 19.0896, destLng: 72.8656, speedKmh: 690, altM: 8229, offset: 1350, duration: 3900 },
  { callsign: 'AIC887', origin: 'BOM', dest: 'VGA', originLat: 19.0896, originLng: 72.8656, destLat: 16.5304, destLng: 80.7968, speedKmh: 770, altM: 9753, offset: 3200, duration: 6300 },
  { callsign: 'IGO602', origin: 'BLR', dest: 'CCU', originLat: 13.1986, originLng: 77.7066, destLat: 22.6547, destLng: 88.4467, speedKmh: 820, altM: 10668, offset: 1950, duration: 9300 }
];

function calculateHeading(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return Math.round((brng + 360) % 360);
}

function generateSimulatedPlanes() {
  const now = Math.floor(Date.now() / 1000);
  return SIMULATED_ROUTES.map((route, idx) => {
    // Current cycle progress (0.0 to 1.0)
    const progress = ((now + route.offset) % route.duration) / route.duration;
    
    // Linear lat/lng interpolation with slight arc curve
    const lat = Number((route.originLat + (route.destLat - route.originLat) * progress).toFixed(4));
    const lng = Number((route.originLng + (route.destLng - route.originLng) * progress).toFixed(4));
    
    // Altitude profile: climb, cruise, descend
    let alt = route.altM;
    if (progress < 0.15) {
      alt = Math.round(route.altM * (progress / 0.15));
    } else if (progress > 0.85) {
      alt = Math.round(route.altM * ((1 - progress) / 0.15));
    }

    const heading = calculateHeading(route.originLat, route.originLng, route.destLat, route.destLng);
    const velocityMs = Math.round(route.speedKmh / 3.6);

    return {
      icao24: `sim${String(idx + 1).padStart(3, '0')}`,
      callsign: route.callsign,
      lat,
      lng,
      altitudeMeters: Math.max(1000, alt),
      velocityMs,
      heading,
      originCountry: 'India',
      onGround: false,
      route: `${route.origin} → ${route.dest}`
    };
  });
}

export default async function handler(req, res) {
  // Ensure status and json helpers exist under raw Node/Connect middleware
  if (!res.status) {
    res.status = function(code) { this.statusCode = code; return this; };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers & CORS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const originHeader = req.headers?.origin || req.headers?.referer || '';
  const isAllowedOrigin = !originHeader || 
    /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|.*\.vercel\.app)(\/|$)/.test(originHeader);

  if (isAllowedOrigin && req.headers?.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Check 30-second in-memory cache
  const now = Date.now();
  if (memoryCache.data && (now - memoryCache.timestamp) < CACHE_TTL_MS) {
    return res.status(200).json(memoryCache.data);
  }

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'AeroSpaceFlightApp/1.0'
  };

  if (clientId && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const openSkyUrl = 'https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=37&lomax=98';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(openSkyUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.states) && data.states.length > 0) {
        const normalized = data.states
          .filter(state => state[5] != null && state[6] != null) // lon, lat
          .map(state => ({
            icao24: state[0] || 'unknown',
            callsign: (state[1] || '').trim() || (state[0] ? state[0].toUpperCase() : 'FLIGHT'),
            lat: Number(state[6]),
            lng: Number(state[5]),
            altitudeMeters: state[7] != null ? Math.round(state[7]) : (state[13] != null ? Math.round(state[13]) : 9000),
            velocityMs: state[9] != null ? Math.round(state[9]) : 230,
            heading: state[10] != null ? Math.round(state[10]) : 0,
            originCountry: state[2] || 'India',
            onGround: !!state[8]
          }));

        if (normalized.length >= 5) {
          const payload = {
            source: 'live',
            timestamp: now,
            count: normalized.length,
            planes: normalized
          };
          memoryCache = { data: payload, timestamp: now };
          return res.status(200).json(payload);
        }
      }
    }
    // If response was not ok (429 rate limit, 503, etc.) or had too few planes:
    console.warn(`[OpenSky] Falling back to simulated live Indian airspace (HTTP ${response.status})`);
  } catch (err) {
    console.warn('[OpenSky] Upstream unavailable, using simulated Indian domestic radar:', err.message);
  }

  // Fallback to simulated 25 live domestic Indian flights
  const simulatedPlanes = generateSimulatedPlanes();
  const payload = {
    source: 'simulated',
    timestamp: now,
    count: simulatedPlanes.length,
    planes: simulatedPlanes
  };

  memoryCache = { data: payload, timestamp: now };
  return res.status(200).json(payload);
}
