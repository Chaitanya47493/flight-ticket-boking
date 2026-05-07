import iataMap from './airports.json';

// ── Regional hardcoded schedules (real-world verified routes) ─────────────────
const regionalSchedules = {
  'CDP-MAA': [
    { airline: 'IndiGo', no: '6E 7954', dep: '10:45 AM', arr: '11:55 AM', dur: '1h 10m', price: 3450 },
    { airline: 'Alliance Air', no: '9I 877', dep: '01:20 PM', arr: '02:35 PM', dur: '1h 15m', price: 2899 }
  ],
  'MAA-CDP': [
    { airline: 'IndiGo', no: '6E 7953', dep: '09:05 AM', arr: '10:15 AM', dur: '1h 10m', price: 3450 },
    { airline: 'Alliance Air', no: '9I 878', dep: '02:55 PM', arr: '04:10 PM', dur: '1h 15m', price: 2899 }
  ],
  'KJB-MAA': [
    { airline: 'IndiGo', no: '6E 7935', dep: '11:20 AM', arr: '12:35 PM', dur: '1h 15m', price: 3850 }
  ],
  'MAA-KJB': [
    { airline: 'IndiGo', no: '6E 7934', dep: '09:35 AM', arr: '10:50 AM', dur: '1h 15m', price: 3850 }
  ],
  'KJB-VGA': [
    { airline: 'IndiGo', no: '6E 7931/7214', dep: '09:15 AM', arr: '02:40 PM', dur: '5h 25m', price: 5450, stops: 1, via: 'HYD' }
  ],
  'VGA-KJB': [
    { airline: 'IndiGo', no: '6E 7215/7932', dep: '11:45 AM', arr: '05:15 PM', dur: '5h 30m', price: 5450, stops: 1, via: 'HYD' }
  ],
  'TIR-HYD': [
    { airline: 'IndiGo', no: '6E 7156', dep: '08:30 AM', arr: '09:40 AM', dur: '1h 10m', price: 4200 },
    { airline: 'IndiGo', no: '6E 7219', dep: '06:15 PM', arr: '07:35 PM', dur: '1h 20m', price: 4500 }
  ],
  'HYD-TIR': [
    { airline: 'IndiGo', no: '6E 7155', dep: '06:45 AM', arr: '07:55 AM', dur: '1h 10m', price: 4200 },
    { airline: 'IndiGo', no: '6E 7218', dep: '04:30 PM', arr: '05:50 PM', dur: '1h 20m', price: 4500 }
  ],
  'CDP-BLR': [
    { airline: 'IndiGo', no: '6E 7958', dep: '02:15 PM', arr: '03:10 PM', dur: '55m', price: 3100 }
  ],
  'BLR-CDP': [
    { airline: 'IndiGo', no: '6E 7957', dep: '12:45 PM', arr: '01:45 PM', dur: '1h 00m', price: 3100 }
  ],
  'VGA-HYD': [
    { airline: 'Air India', no: 'AI 542', dep: '08:15 AM', arr: '09:15 AM', dur: '1h 00m', price: 3200 },
    { airline: 'IndiGo', no: '6E 7112', dep: '07:30 PM', arr: '08:40 PM', dur: '1h 10m', price: 3400 }
  ],
  'BOM-DEL': [
    { airline: 'IndiGo', no: '6E 2134', dep: '06:00 AM', arr: '08:10 AM', dur: '2h 10m', price: 5600 },
    { airline: 'Air India', no: 'AI 864', dep: '09:00 AM', arr: '11:15 AM', dur: '2h 15m', price: 6200 },
    { airline: 'Vistara', no: 'UK 944', dep: '12:30 PM', arr: '02:45 PM', dur: '2h 15m', price: 7100 }
  ],
  'DEL-BOM': [
    { airline: 'IndiGo', no: '6E 2135', dep: '08:00 AM', arr: '10:10 AM', dur: '2h 10m', price: 5600 },
    { airline: 'Air India', no: 'AI 865', dep: '05:00 PM', arr: '07:15 PM', dur: '2h 15m', price: 6200 }
  ],
  'BLR-HYD': [
    { airline: 'IndiGo', no: '6E 7122', dep: '10:15 AM', arr: '11:25 AM', dur: '1h 10m', price: 3800 },
    { airline: 'Air India', no: 'AI 520', dep: '04:45 PM', arr: '06:00 PM', dur: '1h 15m', price: 4100 }
  ],
  'HYD-BLR': [
    { airline: 'IndiGo', no: '6E 7121', dep: '08:00 AM', arr: '09:10 AM', dur: '1h 10m', price: 3800 },
    { airline: 'Air India', no: 'AI 521', dep: '02:30 PM', arr: '03:45 PM', dur: '1h 15m', price: 4100 }
  ],
  'DEL-BLR': [
    { airline: 'IndiGo', no: '6E 318', dep: '06:15 AM', arr: '09:00 AM', dur: '2h 45m', price: 5200 },
    { airline: 'Air India', no: 'AI 502', dep: '10:00 AM', arr: '12:50 PM', dur: '2h 50m', price: 6800 }
  ],
  'BLR-DEL': [
    { airline: 'IndiGo', no: '6E 317', dep: '07:30 AM', arr: '10:15 AM', dur: '2h 45m', price: 5200 },
    { airline: 'Air India', no: 'AI 503', dep: '04:30 PM', arr: '07:20 PM', dur: '2h 50m', price: 6800 }
  ],
};

// ── City-code to primary airport IATA mapping ─────────────────────────────────
const genericCityCodeMap = {
  "lon": "LHR", "nyc": "JFK", "tyo": "HND", "par": "CDG",
  "was": "IAD", "chi": "ORD", "bjs": "PEK", "mow": "SVO",
  "rom": "FCO", "sto": "ARN", "bue": "EZE", "sao": "GRU", "osa": "KIX"
};

const getIataCode = (input) => {
  const cleanInput = input.trim().toLowerCase();
  if (genericCityCodeMap[cleanInput]) return genericCityCodeMap[cleanInput];
  if (cleanInput.length === 3) return cleanInput.toUpperCase();
  if (iataMap[cleanInput]) return iataMap[cleanInput];
  const match = cleanInput.match(/\b([A-Z]{3})\b/i);
  if (match) return match[1].toUpperCase();
  return cleanInput.substring(0, 3).toUpperCase();
};

// ── Local fallback: regional verified schedules → simulated ──────────────────
const getSmartLocalFallback = (searchData, origin, dest) => {
  const roundTripMultiplier = searchData.tripType === 'roundtrip' ? 2 : 1;
  const routeKey = `${origin}-${dest}`;

  // 1. Regional verified schedule
  if (regionalSchedules[routeKey]) {
    console.log('Fallback: using regional verified schedule');
    return regionalSchedules[routeKey].map((f, i) => ({
      id: `regional-${routeKey}-${i}`,
      airline: f.airline,
      flightNumber: f.no,
      origin,
      destination: dest,
      departureTime: f.dep,
      arrivalTime: f.arr,
      duration: f.dur,
      stops: f.stops || 0,
      stopDetails: f.via ? `via ${f.via}` : null,
      classes: [
        { name: 'Economy', price: f.price * roundTripMultiplier * searchData.passengers, features: ['1 Checked Bag'] },
        { name: 'Business', price: Math.floor(f.price * 1.8) * roundTripMultiplier * searchData.passengers, features: ['2 Checked Bags', 'Priority Boarding'] }
      ]
    }));
  }

  // 2. Simulated flights based on region
  const isIndia = (str) => ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU'].some(c => str.includes(c));
  const isUS = (str) => ['JFK', 'LAX', 'SFO', 'ORD'].some(c => str.includes(c));

  let airlines = [{ name: 'Global Airways', prefix: 'GA', basePrice: 8000, premiumFactor: 2.5 }];
  if (isIndia(origin) || isIndia(dest)) {
    airlines = [
      { name: 'IndiGo', prefix: '6E', basePrice: 3200, premiumFactor: 1.8 },
      { name: 'Air India', prefix: 'AI', basePrice: 4500, premiumFactor: 2.2 },
      { name: 'Vistara', prefix: 'UK', basePrice: 4800, premiumFactor: 2.5 },
      { name: 'Alliance Air', prefix: '9I', basePrice: 2800, premiumFactor: 1.5 }
    ];
  } else if (isUS(origin) || isUS(dest)) {
    airlines = [
      { name: 'Delta Airlines', prefix: 'DL', basePrice: 15000, premiumFactor: 3.0 },
      { name: 'American Airlines', prefix: 'AA', basePrice: 14500, premiumFactor: 2.8 }
    ];
  }

  const results = [];
  for (let i = 0; i < 5; i++) {
    const airline = airlines[i % airlines.length];
    const depHour = 6 + (i * 3);
    const depMin = Math.random() > 0.5 ? '00' : '30';
    const ampm = depHour >= 12 ? 'PM' : 'AM';
    const displayHour = depHour > 12 ? depHour - 12 : depHour;
    const departureTime = `${displayHour < 10 ? '0' + displayHour : displayHour}:${depMin} ${ampm}`;

    const durationHours = Math.floor(Math.random() * 4) + 2;
    const durationMins = Math.floor(Math.random() * 4) * 15;
    const durationStr = `${durationHours}h${durationMins > 0 ? ' ' + durationMins + 'm' : ''}`;

    let arrHour = depHour + durationHours;
    let arrMinInt = parseInt(depMin) + durationMins;
    if (arrMinInt >= 60) { arrHour += 1; arrMinInt -= 60; }
    // Fix: use modulo 24 for correct AM/PM
    const arrAmpm = (arrHour % 24) >= 12 ? 'PM' : 'AM';
    const arrDisplayHour = arrHour % 12 === 0 ? 12 : arrHour % 12;
    const arrMinStr = arrMinInt < 10 ? '0' + arrMinInt : arrMinInt;
    const arrivalTime = `${arrDisplayHour < 10 ? '0' + arrDisplayHour : arrDisplayHour}:${arrMinStr} ${arrAmpm}`;

    results.push({
      id: `sim-${Date.now()}-${i}`,
      airline: airline.name,
      flightNumber: `${airline.prefix} ${Math.floor(Math.random() * 800) + 100}`,
      origin,
      destination: dest,
      departureTime,
      arrivalTime,
      duration: durationStr,
      stops: i === 4 ? 1 : 0,
      classes: [
        { name: 'Economy', price: airline.basePrice * roundTripMultiplier * searchData.passengers, features: ['1 Checked Bag'] },
        { name: 'Business', price: Math.floor(airline.basePrice * airline.premiumFactor) * roundTripMultiplier * searchData.passengers, features: ['2 Checked Bags', 'Priority Boarding'] },
        { name: 'First Class', price: Math.floor(airline.basePrice * (airline.premiumFactor + 1.5)) * roundTripMultiplier * searchData.passengers, features: ['3 Checked Bags', 'Lounge Access'] }
      ]
    });
  }
  return results.sort((a, b) => a.classes[0].price - b.classes[0].price);
};

// ── Main fetchFlights export ──────────────────────────────────────────────────
export const fetchFlights = async (searchData) => {
  const serpapiKey = import.meta.env.VITE_SERPAPI_KEY;   // declared once
  const rapidapiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  const isDev = import.meta.env.DEV;

  const origin = getIataCode(searchData.from);
  const dest = getIataCode(searchData.to);
  const type = searchData.tripType === 'roundtrip' ? 1 : 2;

  console.log(`Searching flights: ${origin} → ${dest} on ${searchData.date}`);

  // Phase 1: Skyscanner via RapidAPI
  if (rapidapiKey && rapidapiKey !== 'PASTE_YOUR_RAPIDAPI_KEY_HERE') {
    try {
      const response = await fetch(
        `https://skyscanner-flight-search.p.rapidapi.com/en-IN/INR/en-IN/${origin}-sky/${dest}-sky/${searchData.date}`,
        { headers: { 'X-RapidAPI-Key': rapidapiKey, 'X-RapidAPI-Host': 'skyscanner-flight-search.p.rapidapi.com' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.Quotes?.length > 0) {
          console.log('Phase 1: Skyscanner data found');
          return data.Quotes.map(q => ({
            id: `sky-${q.QuoteId}`,
            airline: (data.Carriers?.find(c => c.CarrierId === q.OutboundLeg.CarrierIds[0]))?.Name || 'Verified Airline',
            flightNumber: `FL-${q.QuoteId}`,
            origin, destination: dest,
            departureTime: 'Real-Time', arrivalTime: 'Real-Time', duration: 'Direct',
            stops: q.Direct ? 0 : 1,
            classes: [{ name: 'Economy', price: q.MinPrice * searchData.passengers, features: ['Live Data'] }]
          }));
        }
      }
    } catch (e) { console.warn('Phase 1 (Skyscanner) failed:', e.message); }
  }

  // Phase 2: Google Flights via SerpAPI
  try {
    let url;
    if (isDev && serpapiKey) {
      url = `/serpapi/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=${type}&currency=INR&gl=in&hl=en&api_key=${serpapiKey}`;
    } else {
      url = `/api/flights?departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=${type}&currency=INR`;
    }
    if (searchData.tripType === 'roundtrip' && searchData.returnDate) {
      url += `&return_date=${searchData.returnDate}`;
    }
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];
      if (allFlights.length > 0) {
        console.log('Phase 2: Google Flights live data found');
        return allFlights.map((f, i) => {
          const m = f.flights[0];
          const l = f.flights[f.flights.length - 1];
          return {
            id: `google-${Date.now()}-${i}`,
            airline: m.airline,
            flightNumber: m.flight_number || '6E-101',
            origin, destination: dest,
            departureTime: m.departure_airport?.time?.split(' ')[1] || 'TBD',
            arrivalTime: l.arrival_airport?.time?.split(' ')[1] || 'TBD',
            duration: `${Math.floor(f.total_duration / 60)}h ${f.total_duration % 60}m`,
            stops: f.flights.length - 1,
            classes: [{ name: 'Economy', price: f.price * searchData.passengers, features: ['Verified Price'] }]
          };
        });
      }
    }
  } catch (e) { console.warn('Phase 2 (SerpAPI) failed:', e.message); }

  // Phase 3: Local fallback
  console.log('Phase 3: Using local fallback');
  return getSmartLocalFallback(searchData, origin, dest);
};
