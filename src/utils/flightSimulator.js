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

const getSmartLocalFallback = (searchData, origin, dest) => {
  const roundTripMultiplier = searchData.tripType === 'roundtrip' ? 2 : 1;
  const routeKey = `${origin}-${dest}`;

  if (regionalSchedules[routeKey]) {
    const dateObj = new Date(searchData.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const validFlights = regionalSchedules[routeKey].filter(f => !f.days || f.days.includes(dayName));

    if (validFlights.length > 0) {
      return validFlights.map((f, i) => ({
        id: `regional-${routeKey}-${i}`,
        source: 'Smart Local Fallback',
        airline: f.airline,
        flightNumber: f.no,
        origin, destination: dest,
        departureTime: f.dep, arrivalTime: f.arr, duration: f.dur,
        stops: 0,
        classes: [
          { name: 'Economy', price: f.price * roundTripMultiplier, features: ['1 Checked Bag'] },
          { name: 'Business', price: Math.floor(f.price * 1.8) * roundTripMultiplier, features: ['2 Checked Bags'] }
        ]
      }));
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

  return indianAirlines.map((airline, i) => ({
    id: `sim-${origin}-${dest}-${i}`,
    source: 'General Simulator',
    airline: airline.name,
    flightNumber: `${airline.prefix} ${1000 + (i * 123)}`,
    origin, destination: dest,
    departureTime: `${7 + (i * 3)}:30 AM`, arrivalTime: `${9 + (i * 3)}:45 AM`, duration: '2h 15m',
    stops: 0,
    classes: [
      { name: 'Economy', price: airline.basePrice * roundTripMultiplier, features: ['1 Checked Bag'] },
      { name: 'Business', price: Math.floor(airline.basePrice * 1.6) * roundTripMultiplier, features: ['2 Checked Bags'] }
    ]
  }));
};

export const fetchFlights = async (searchData) => {
  const serpapiKey = import.meta.env.VITE_SERPAPI_KEY;
  const origin = getIataCode(searchData.from);
  const dest = getIataCode(searchData.to);

  // --- SERPAPI (Google Flights) INTEGRATION ---
  if (serpapiKey && serpapiKey !== 'your_serpapi_key_here') {
    try {
      console.log('Attempting SerpApi Google Flights search...');
      const isProd = import.meta.env.PROD;
      
      let url;
      if (isProd) {
        url = `/api/flights?departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=2&currency=INR`;
      } else {
        url = `/serpapi/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=2&currency=INR&api_key=${serpapiKey}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const json = await response.json();
        
        if (json.error) {
           console.error('SerpApi Error:', json.error);
        } else {
           const bestFlights = json.best_flights || [];
           const otherFlights = json.other_flights || [];
           const flightsData = [...bestFlights, ...otherFlights];
           
           if (flightsData.length > 0) {
             return flightsData.map((result, index) => {
               const firstFlight = result.flights[0];
               const lastFlight = result.flights[result.flights.length - 1];
               
               // Parse time (e.g. "2023-11-20 07:00")
               const depDate = new Date(firstFlight.departure_airport?.time || searchData.date);
               const arrDate = new Date(lastFlight.arrival_airport?.time || searchData.date);
               
               const depTime = isNaN(depDate.getTime()) ? '10:00 AM' : depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
               const arrTime = isNaN(arrDate.getTime()) ? '12:30 PM' : arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
               
               // Duration in minutes to "2h 30m" format
               const durationMins = result.total_duration || firstFlight.duration || 120;
               const hours = Math.floor(durationMins / 60);
               const mins = durationMins % 60;
               const durationStr = `${hours}h ${mins}m`;

               // Calculate route path
               const routePath = result.flights.length > 1 
                 ? result.flights.map(f => f.departure_airport?.id || '').concat(lastFlight.arrival_airport?.id || '').filter(Boolean).join(' ➔ ')
                 : 'Direct';

               return {
                 id: `serpapi-${index}`,
                 airline: firstFlight.airline || 'Unknown Airline',
                 airlineLogo: firstFlight.airline_logo || `https://www.gstatic.com/flights/airline_logos/70px/${(firstFlight.flight_number || 'XX').split(' ')[0]}.png`,
                 flightNumber: firstFlight.flight_number || 'XX 100',
                 // Use requested origin and destination to prevent confusing connecting airports being displayed as origin
                 origin: origin,
                 destination: dest,
                 departureTime: depTime,
                 arrivalTime: arrTime,
                 duration: durationStr,
                 stops: result.flights.length > 1 ? result.flights.length - 1 : 0,
                 routePath: routePath,
                 classes: [
                   { name: 'Economy', price: result.price || 5000, features: ['Standard Seat', '1 Checked Bag'] },
                   { name: 'Business', price: Math.floor((result.price || 5000) * 1.8), features: ['Premium Boarding', 'Lounge Access'] },
                   { name: 'First Class', price: Math.floor((result.price || 5000) * 2.5), features: ['Luxury Suite', 'Fine Dining', 'Priority Check-in'] }
                 ]
               };
             });
           }
        }
      }
    } catch (e) {
      console.error('Google Flights API Fetch Error:', e.message);
    }
  }

  // Final Fallback to Smart Simulator
  return getSmartLocalFallback(searchData, origin, dest);
};
