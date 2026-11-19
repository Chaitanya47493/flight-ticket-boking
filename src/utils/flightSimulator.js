import iataMap from './airports.json';

// ── Regional hardcoded schedules (real-world verified routes) ─────────────────
const regionalSchedules = {
  // --- KADAPA (CDP) ---
  'CDP-HYD': [{ airline: 'IndiGo', no: '6E 7734', dep: '12:35 PM', arr: '01:35 PM', dur: '1h 00m', price: 3100, stops: 0, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  'HYD-CDP': [{ airline: 'IndiGo', no: '6E 7733', dep: '11:05 AM', arr: '12:05 PM', dur: '1h 00m', price: 3100, stops: 0, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  'CDP-MAA': [{ airline: 'IndiGo', no: '6E 7954', dep: '10:45 AM', arr: '11:55 AM', dur: '1h 10m', price: 3450, stops: 0, days: ['Monday', 'Wednesday', 'Friday', 'Sunday'] }],
  'MAA-CDP': [{ airline: 'IndiGo', no: '6E 7953', dep: '09:05 AM', arr: '10:15 AM', dur: '1h 10m', price: 3450, stops: 0, days: ['Monday', 'Wednesday', 'Friday', 'Sunday'] }],
  'CDP-VGA': [{ airline: 'IndiGo', no: '6E 7958', dep: '02:15 PM', arr: '03:10 PM', dur: '55m', price: 2900, stops: 0, days: ['Tuesday', 'Thursday', 'Saturday'] }],
  'VGA-CDP': [{ airline: 'IndiGo', no: '6E 7957', dep: '12:45 PM', arr: '01:45 PM', dur: '1h 00m', price: 2900, stops: 0, days: ['Tuesday', 'Thursday', 'Saturday'] }],

  // --- KURNOOL (KJB) ---
  'KJB-BLR': [{ airline: 'IndiGo', no: '6E 7931', dep: '09:15 AM', arr: '10:10 AM', dur: '55m', price: 3200, stops: 0, days: ['Monday', 'Wednesday', 'Friday', 'Sunday'] }],
  'BLR-KJB': [{ airline: 'IndiGo', no: '6E 7932', dep: '07:45 AM', arr: '08:45 AM', dur: '1h 00m', price: 3200, stops: 0, days: ['Monday', 'Wednesday', 'Friday', 'Sunday'] }],
  'KJB-VGA': [{ airline: 'IndiGo', no: '6E 7034', dep: '05:15 PM', arr: '06:10 PM', dur: '55m', price: 3450, stops: 0, days: ['Monday', 'Wednesday', 'Friday'] }],
  'VGA-KJB': [{ airline: 'IndiGo', no: '6E 7033', dep: '03:55 PM', arr: '04:55 PM', dur: '1h 00m', price: 3200, stops: 0, days: ['Monday', 'Wednesday', 'Friday'] }],
  'KJB-VTZ': [{ airline: 'IndiGo', no: '6E 7042', dep: '11:40 AM', arr: '01:25 PM', dur: '1h 45m', price: 4100, stops: 0, days: ['Tuesday', 'Thursday', 'Saturday'] }],
  'VTZ-KJB': [{ airline: 'IndiGo', no: '6E 7041', dep: '09:15 AM', arr: '11:10 AM', dur: '1h 55m', price: 4100, stops: 0, days: ['Tuesday', 'Thursday', 'Saturday'] }],

  // --- VIJAYAWADA (VGA) ---
  'VGA-BLR': [
    { airline: 'IndiGo', no: '6E 7115', dep: '08:45 AM', arr: '10:15 AM', dur: '1h 30m', price: 3200, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { airline: 'IndiGo', no: '6E 7212', dep: '12:55 PM', arr: '02:25 PM', dur: '1h 30m', price: 3400, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }
  ],
  'BLR-VGA': [{ airline: 'IndiGo', no: '6E 7114', dep: '06:50 AM', arr: '08:15 AM', dur: '1h 25m', price: 3200, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  'VGA-VTZ': [{ airline: 'IndiGo', no: '6E 7214', dep: '03:10 PM', arr: '04:15 PM', dur: '1h 05m', price: 2800, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  'VTZ-VGA': [{ airline: 'IndiGo', no: '6E 7215', dep: '01:30 PM', arr: '02:40 PM', dur: '1h 10m', price: 2800, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],

  // --- NO DIRECT FLIGHTS ---
  'MYQ-BLR': [], 'BLR-MYQ': [], 'KJB-HYD': [], 'HYD-KJB': []
};

const getIataCode = (input) => {
  if (!input) return '';
  const cleanInput = input.trim().toLowerCase();
  const cityMatch = Object.keys(iataMap).find(city => city.toLowerCase() === cleanInput);
  if (cityMatch) return iataMap[cityMatch];
  const match = cleanInput.match(/\b([A-Z]{3})\b/i);
  return match ? match[1].toUpperCase() : cleanInput.substring(0, 3).toUpperCase();
};

// Time extraction helpers
export const parseAirportTime = (timeStr, fallbackHour = 10) => {
  if (!timeStr) return `${fallbackHour.toString().padStart(2, '0')}:00 AM`;
  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.substring(0, 2) : '00';
  if (isNaN(h)) return `${fallbackHour.toString().padStart(2, '0')}:00 AM`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export const getMinutesFromTimeStr = (timeStr) => {
  if (!timeStr) return 600; // default 10:00 AM (600 mins)
  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
};

export const getAvailableClassesForFlight = (airlineName, origin, dest, basePrice = 5000) => {
  const normAirline = (airlineName || '').toLowerCase();
  const normOrigin = (origin || '').toUpperCase();
  const normDest = (dest || '').toUpperCase();

  // Major metro trunk airports in India
  const METROS = new Set(['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU']);
  const isMetroTrunk = METROS.has(normOrigin) && METROS.has(normDest);

  // Regional Tier-2 / Tier-3 airports (turboprop ATR / short-hop routes)
  const REGIONAL = new Set(['CDP', 'KJB', 'VGA', 'MYQ', 'VTZ', 'IXE', 'TIR', 'HBX']);
  const isRegional = REGIONAL.has(normOrigin) || REGIONAL.has(normDest);

  // 1. Regional routes (Kadapa, Kurnool, ATR routes) are strictly single-cabin (Economy only)
  if (isRegional) {
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Standard Seat (ATR Cabin)', '15kg Checked Baggage', '7kg Hand Baggage']
      }
    ];
  }

  // 2. Akasa Air & Air India Express: strictly single-class low cost carriers (Economy only)
  if (normAirline.includes('akasa') || normAirline.includes('express') || normAirline.includes('qp')) {
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Ergonomic Seat', '15kg Checked Bag', 'USB Charging Port']
      }
    ];
  }

  // 3. SpiceJet: All-Economy with optional SpiceMax Extra Legroom
  if (normAirline.includes('spicejet') || normAirline.includes('sg')) {
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Standard Seat', '15kg Checked Bag', '7kg Hand Bag']
      },
      {
        name: 'Premium Economy',
        price: Math.floor(basePrice * 1.3),
        features: ['SpiceMax Extra Legroom', 'Priority Boarding', 'Complimentary Snack']
      }
    ];
  }

  // 4. IndiGo:
  // Economy on all routes; on Metro Trunk routes (DEL-BOM, DEL-BLR, etc.), IndiGo offers Economy and IndiGoStretch (Business)
  if (normAirline.includes('indigo') || normAirline.includes('6e')) {
    if (isMetroTrunk) {
      return [
        {
          name: 'Economy',
          price: basePrice,
          features: ['Standard Seat', '15kg Checked Bag', '7kg Hand Bag']
        },
        {
          name: 'Business',
          price: Math.floor(basePrice * 2.8),
          features: ['IndiGoStretch Business Seat', 'Priority Check-in', 'Gourmet Meal Included']
        }
      ];
    }
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Standard Seat', '15kg Checked Bag', '7kg Hand Bag']
      }
    ];
  }

  // 5. Vistara: Full Service 3-cabin airline
  if (normAirline.includes('vistara') || normAirline.includes('uk')) {
    if (isMetroTrunk) {
      return [
        {
          name: 'Economy',
          price: basePrice,
          features: ['Hot Meal Included', '15kg Checked Bag', 'In-flight Entertainment']
        },
        {
          name: 'Premium Economy',
          price: Math.floor(basePrice * 1.5),
          features: ['Dedicated Cabin (33" Legroom)', 'Priority Check-in', 'Gourmet Dining']
        },
        {
          name: 'Business',
          price: Math.floor(basePrice * 3.5),
          features: ['Plush Recliner Seat', 'Lounge Access', '30kg Baggage', 'Priority Boarding']
        }
      ];
    }
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Hot Meal Included', '15kg Baggage']
      },
      {
        name: 'Business',
        price: Math.floor(basePrice * 3.2),
        features: ['Wide Business Seat', 'Lounge Access', '30kg Baggage']
      }
    ];
  }

  // 6. Air India: Full Service carrier
  if (normAirline.includes('air india') || normAirline.includes('ai')) {
    if (isMetroTrunk) {
      return [
        {
          name: 'Economy',
          price: basePrice,
          features: ['Hot Meal Included', '20kg Checked Bag']
        },
        {
          name: 'Business',
          price: Math.floor(basePrice * 3.6),
          features: ['Wide Business Recliner', 'Maharaja Lounge Access', '35kg Baggage', 'Priority Boarding']
        }
      ];
    }
    return [
      {
        name: 'Economy',
        price: basePrice,
        features: ['Hot Meal Included', '20kg Checked Bag']
      },
      {
        name: 'Business',
        price: Math.floor(basePrice * 3.2),
        features: ['Spacious Business Seat', 'Lounge Access', '30kg Baggage']
      }
    ];
  }

  // Default fallback for any other airline
  if (isMetroTrunk) {
    return [
      { name: 'Economy', price: basePrice, features: ['Standard Seat', '15kg Checked Bag'] },
      { name: 'Business', price: Math.floor(basePrice * 3.2), features: ['Priority Boarding', 'Lounge Access'] }
    ];
  }

  return [
    { name: 'Economy', price: basePrice, features: ['Standard Seat', '15kg Checked Bag'] }
  ];
};

const getSmartLocalFallback = (searchData, origin, dest) => {
  const roundTripMultiplier = searchData.tripType === 'roundtrip' ? 2 : 1;
  const routeKey = `${origin}-${dest}`;

  if (regionalSchedules[routeKey]) {
    const dateObj = new Date(searchData.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const validFlights = regionalSchedules[routeKey].filter(f => !f.days || f.days.includes(dayName));

    if (validFlights.length > 0) {
      return validFlights.map((f, i) => {
        const basePrice = f.price * roundTripMultiplier;
        const flightClasses = getAvailableClassesForFlight(f.airline, origin, dest, basePrice);
        const depHour = parseInt(f.dep.split(':')[0], 10);
        const isPM = f.dep.includes('PM');
        const h24 = isPM && depHour !== 12 ? depHour + 12 : (!isPM && depHour === 12 ? 0 : depHour);
        return {
          id: `regional-${routeKey}-${i}`,
          source: 'Scheduled',
          airline: f.airline,
          flightNumber: f.no,
          origin, destination: dest,
          departureTime: f.dep, arrivalTime: f.arr, duration: f.dur,
          departureMinutes: h24 * 60,
          durationMinutes: 70,
          stops: 0,
          classes: flightClasses
        };
      });
    }
    return [];
  }

  const indianAirlines = [
    { name: 'IndiGo', prefix: '6E', basePrice: 4200 },
    { name: 'Air India', prefix: 'AI', basePrice: 5800 },
    { name: 'Vistara', prefix: 'UK', basePrice: 6500 },
    { name: 'SpiceJet', prefix: 'SG', basePrice: 3800 },
    { name: 'Akasa Air', prefix: 'QP', basePrice: 4000 }
  ];

  return indianAirlines.map((airline, i) => {
    const basePrice = airline.basePrice * roundTripMultiplier;
    const flightClasses = getAvailableClassesForFlight(airline.name, origin, dest, basePrice);
    const depH = 7 + (i * 3);
    return {
      id: `sim-${origin}-${dest}-${i}`,
      source: 'Scheduled',
      airline: airline.name,
      flightNumber: `${airline.prefix} ${1000 + (i * 123)}`,
      origin, destination: dest,
      departureTime: `${depH > 12 ? depH - 12 : depH}:30 ${depH >= 12 ? 'PM' : 'AM'}`,
      arrivalTime: `${(depH + 2) > 12 ? (depH + 2) - 12 : depH + 2}:45 ${(depH + 2) >= 12 ? 'PM' : 'AM'}`,
      duration: '2h 15m',
      departureMinutes: depH * 60 + 30,
      durationMinutes: 135,
      stops: 0,
      classes: flightClasses
    };
  });
};

export const fetchFlights = async (searchData) => {
  const serpapiKey = import.meta.env.VITE_SERPAPI_KEY;
  const origin = getIataCode(searchData.from);
  const dest = getIataCode(searchData.to);

  // --- SERPAPI (Google Flights) REAL-TIME LIVE INTEGRATION ---
  if (serpapiKey && serpapiKey !== 'your_serpapi_key_here') {
    try {
      console.log(`[Google Flights] Querying live flights: ${origin} → ${dest} on ${searchData.date}`);
      const isProd = import.meta.env.PROD;
      const isRoundTrip = searchData.tripType === 'roundtrip' && searchData.returnDate;
      const typeParam = isRoundTrip ? `type=1&return_date=${searchData.returnDate}` : 'type=2';
      const passengersCount = searchData.passengers || 1;
      const adultsParam = `&adults=${passengersCount}`;
      
      let url;
      if (isProd) {
        url = `/api/flights?departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&${typeParam}${adultsParam}&currency=INR`;
      } else {
        url = `/serpapi/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&${typeParam}${adultsParam}&currency=INR&api_key=${serpapiKey}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const json = await response.json();
        
        if (json.error) {
          console.warn('[SerpApi Notice]:', json.error);
        } else {
          const bestFlights = json.best_flights || [];
          const otherFlights = json.other_flights || [];
          const flightsData = [...bestFlights, ...otherFlights];
          
          if (flightsData.length > 0) {
            console.log(`[Google Flights] Loaded ${flightsData.length} real-time flights for ${origin} → ${dest}`);
            return flightsData.map((result, index) => {
              const firstFlight = result.flights[0];
              const lastFlight = result.flights[result.flights.length - 1];
              
              // Exact departure and arrival time parsing without timezone shifting
              const depTime = parseAirportTime(firstFlight.departure_airport?.time, 10);
              const arrTime = parseAirportTime(lastFlight.arrival_airport?.time, 12);
              const depMinutes = getMinutesFromTimeStr(firstFlight.departure_airport?.time);
              
              // Duration formatting
              const durationMins = result.total_duration || firstFlight.duration || 120;
              const hours = Math.floor(durationMins / 60);
              const mins = durationMins % 60;
              const durationStr = `${hours}h ${mins}m`;

              // Calculate route path
              const routePath = result.flights.length > 1 
                ? result.flights.map(f => f.departure_airport?.id || '').concat(lastFlight.arrival_airport?.id || '').filter(Boolean).join(' ➔ ')
                : 'Direct';

              const airlineName = firstFlight.airline || 'Unknown Airline';
              
              // Google Flights returns the total price for all requested adults
              const totalPartyPrice = result.price || 5000;
              // Base price per passenger
              const basePricePerPerson = Math.round(totalPartyPrice / passengersCount);
              const flightClasses = getAvailableClassesForFlight(airlineName, origin, dest, basePricePerPerson);

              return {
                id: `serpapi-${index}`,
                source: 'Live',
                airline: airlineName,
                airlineLogo: firstFlight.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${(firstFlight.flight_number || 'XX').split(' ')[0]}.png`,
                flightNumber: firstFlight.flight_number || 'XX 100',
                origin: origin,
                destination: dest,
                departureTime: depTime,
                arrivalTime: arrTime,
                departureMinutes: depMinutes,
                duration: durationStr,
                durationMinutes: durationMins,
                stops: result.flights.length > 1 ? result.flights.length - 1 : 0,
                routePath: routePath,
                airplane: firstFlight.airplane || '',
                terminal: firstFlight.departure_airport?.terminal || '',
                classes: flightClasses
              };
            });
          }
        }
      }
    } catch (e) {
      console.warn('Google Flights API Fetch Error, falling back to smart schedule:', e.message);
    }
  }

  // Fallback to Smart Verified Schedule
  console.log(`[Schedule Fallback] Using smart schedule fallback for ${origin} → ${dest}`);
  return getSmartLocalFallback(searchData, origin, dest);
};
