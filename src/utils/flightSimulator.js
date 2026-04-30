import iataMap from './airports.json';

export const fetchFlights = async (searchData) => {
  const serpapiKey = import.meta.env.VITE_SERPAPI_KEY;

  const getIataCode = (input) => {
    const cleanInput = input.trim().toLowerCase();
    
    // Map generic city codes to primary airport codes because Google Flights strictly requires airports
    const genericCityCodeMap = {
      "lon": "LHR", // London
      "nyc": "JFK", // New York
      "tyo": "HND", // Tokyo
      "par": "CDG", // Paris
      "was": "IAD", // Washington DC
      "chi": "ORD", // Chicago
      "bjs": "PEK", // Beijing
      "mow": "SVO", // Moscow
      "rom": "FCO", // Rome
      "sto": "ARN", // Stockholm
      "bue": "EZE", // Buenos Aires
      "sao": "GRU", // Sao Paulo
      "osa": "KIX"  // Osaka
    };

    if (genericCityCodeMap[cleanInput]) return genericCityCodeMap[cleanInput];

    // If it's already a 3 letter code
    if (cleanInput.length === 3) return cleanInput.toUpperCase();
    // If it matches a city in our map
    if (iataMap[cleanInput]) return iataMap[cleanInput];
    // If they typed something like "Delhi (DEL)"
    const match = cleanInput.match(/\b([A-Z]{3})\b/i);
    if (match) return match[1].toUpperCase();
    // Fallback: take first 3 letters and hope for the best
    return cleanInput.substring(0, 3).toUpperCase();
  };

  if (serpapiKey) {
    try {
      const origin = getIataCode(searchData.from);
      const dest = getIataCode(searchData.to);
      const type = 2;

      // In production (Vercel), use the serverless API route
      // In development, use the Vite proxy
      const isDev = import.meta.env.DEV;
      let url;
      if (isDev) {
        url = `/serpapi/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=${type}&currency=INR&api_key=${serpapiKey}`;
      } else {
        url = `/api/flights?departure_id=${origin}&arrival_id=${dest}&outbound_date=${searchData.date}&type=${type}&currency=INR`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch from SerpApi");
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Google Flights API Error: ${data.error}`);
      }

      // Combine BOTH best_flights and other_flights so ALL available flights are shown
      if (data.best_flights || data.other_flights) {
        const allFlights = [
          ...(data.best_flights || []),
          ...(data.other_flights || [])
        ];

        if (allFlights.length === 0) return [];

        // Safari-safe time formatter
        const formatTime = (timeStr) => {
          if (!timeStr) return "N/A";
          const safeTimeStr = timeStr.replace(' ', 'T');
          const dateObj = new Date(safeTimeStr);
          if (isNaN(dateObj.getTime())) return timeStr.split(' ')[1] || "N/A";
          return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        return allFlights.map((flight, index) => {
          const mainFlight = flight.flights[0];
          const lastFlight = flight.flights[flight.flights.length - 1];
          const durationMins = flight.total_duration;
          const durationStr = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
          const priceINR = flight.price;
          if (!priceINR) return null;

          return {
            id: `google-${Date.now()}-${index}`,
            airline: mainFlight.airline || "Unknown Airline",
            airlineLogo: mainFlight.airline_logo || null,
            flightNumber: mainFlight.flight_number || `${(mainFlight.airline || 'XX').substring(0, 2).toUpperCase()} 101`,
            origin: mainFlight.departure_airport?.id || searchData.from,
            destination: lastFlight.arrival_airport?.id || searchData.to,
            departureTime: formatTime(mainFlight.departure_airport?.time),
            arrivalTime: formatTime(lastFlight.arrival_airport?.time),
            duration: durationStr,
            stops: flight.flights.length > 1 ? flight.flights.length - 1 : 0,
            classes: [
              { name: "Economy", price: priceINR * searchData.passengers, features: ["1 Checked Bag", "Standard Seat"] },
              { name: "Business", price: Math.floor(priceINR * 2.5) * searchData.passengers, features: ["2 Checked Bags", "Lounge Access"] },
              { name: "First Class", price: Math.floor(priceINR * 4.5) * searchData.passengers, features: ["3 Checked Bags", "Suite"] }
            ]
          };
        }).filter(Boolean);
      }

      // No flights found
      return [];
    } catch (error) {
      console.error("SerpApi fetch failed", error);
      throw error; // Throw to FlightResults to display the error
    }
  }

  // Fallback ONLY if no SerpApi key exists (which shouldn't happen now)
  return getSmartLocalFallback(searchData);
};

const getSmartLocalFallback = (searchData) => {
  const originStr = searchData.from.trim().toUpperCase();
  const destStr = searchData.to.trim().toUpperCase();
  
  const isIndia = (str) => ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU'].some(c => str.includes(c));
  const isUS = (str) => ['JFK', 'LAX', 'SFO', 'ORD', 'NEW YORK'].some(c => str.includes(c));
  
  let airlines = [
    { name: 'Global Airways', prefix: 'GA', basePrice: 8000, premiumFactor: 2.5 }
  ];

  if (isIndia(originStr) || isIndia(destStr)) {
    airlines = [
      { name: 'IndiGo', prefix: '6E', basePrice: 4500, premiumFactor: 2.0 },
      { name: 'Air India', prefix: 'AI', basePrice: 5200, premiumFactor: 2.8 },
      { name: 'Vistara', prefix: 'UK', basePrice: 5800, premiumFactor: 3.0 }
    ];
  } else if (isUS(originStr) || isUS(destStr)) {
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
    const departureTime = `${displayHour < 10 ? '0'+displayHour : displayHour}:${depMin} ${ampm}`;
    
    const durationHours = Math.floor(Math.random() * 4) + 2;
    const durationMins = Math.floor(Math.random() * 4) * 15;
    const durationStr = `${durationHours}h ${durationMins > 0 ? durationMins + 'm' : ''}`.trim();
    
    let arrHour = depHour + durationHours;
    let arrMinInt = (parseInt(depMin) + durationMins);
    if (arrMinInt >= 60) {
        arrHour += 1;
        arrMinInt -= 60;
    }
    const arrAmpm = arrHour >= 12 && arrHour < 24 ? 'PM' : 'AM';
    const arrDisplayHour = arrHour % 12 === 0 ? 12 : arrHour % 12;
    const arrMinStr = arrMinInt < 10 ? '0' + arrMinInt : arrMinInt;
    const arrivalTime = `${arrDisplayHour < 10 ? '0'+arrDisplayHour : arrDisplayHour}:${arrMinStr} ${arrAmpm}`;

    const formatLocation = (loc) => loc.length > 3 && !loc.includes(' ') ? loc.substring(0, 3).toUpperCase() : loc;

    results.push({
      id: `sim-${Date.now()}-${i}`,
      airline: airline.name,
      flightNumber: `${airline.prefix} ${Math.floor(Math.random() * 800) + 100}`,
      origin: formatLocation(originStr),
      destination: formatLocation(destStr),
      departureTime,
      arrivalTime,
      duration: durationStr,
      stops: i === 4 ? 1 : 0,
      classes: [
        { name: "Economy", price: airline.basePrice * searchData.passengers, features: ["1 Checked Bag"] },
        { name: "Business", price: Math.floor(airline.basePrice * airline.premiumFactor) * searchData.passengers, features: ["2 Checked Bags"] },
        { name: "First Class", price: Math.floor(airline.basePrice * (airline.premiumFactor + 1.5)) * searchData.passengers, features: ["3 Checked Bags"] }
      ]
    });
  }

  return results.sort((a, b) => a.classes[0].price - b.classes[0].price);
};
