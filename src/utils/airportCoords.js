// Airport coordinates and geospatial helpers for Indian domestic routes and flight corridors

export const AIRPORT_COORDINATES = {
  // Major Metro Hubs
  DEL: { lat: 28.5562, lng: 77.1000, city: 'New Delhi', name: 'Indira Gandhi International Airport', state: 'Delhi' },
  BOM: { lat: 19.0896, lng: 72.8656, city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', state: 'Maharashtra' },
  BLR: { lat: 13.1986, lng: 77.7066, city: 'Bengaluru', name: 'Kempegowda International Airport', state: 'Karnataka' },
  HYD: { lat: 17.2403, lng: 78.4294, city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', state: 'Telangana' },
  MAA: { lat: 12.9941, lng: 80.1709, city: 'Chennai', name: 'Chennai International Airport', state: 'Tamil Nadu' },
  CCU: { lat: 22.6547, lng: 88.4467, city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport', state: 'West Bengal' },

  // Key Commercial & Regional Hubs
  AMD: { lat: 23.0734, lng: 72.6347, city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', state: 'Gujarat' },
  PNQ: { lat: 18.5822, lng: 73.9197, city: 'Pune', name: 'Pune International Airport', state: 'Maharashtra' },
  GOI: { lat: 15.3808, lng: 73.8314, city: 'Goa (Dabolim)', name: 'Goa International Airport', state: 'Goa' },
  GOX: { lat: 15.7339, lng: 73.8647, city: 'Goa (Mopa)', name: 'Manohar International Airport', state: 'Goa' },
  COK: { lat: 10.1556, lng: 76.4019, city: 'Kochi', name: 'Cochin International Airport', state: 'Kerala' },
  JAI: { lat: 26.8242, lng: 75.8122, city: 'Jaipur', name: 'Jaipur International Airport', state: 'Rajasthan' },
  LKO: { lat: 26.7606, lng: 80.8893, city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', state: 'Uttar Pradesh' },
  GAU: { lat: 26.1061, lng: 91.5859, city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International Airport', state: 'Assam' },
  PAT: { lat: 25.5913, lng: 85.0880, city: 'Patna', name: 'Jay Prakash Narayan Airport', state: 'Bihar' },
  BBI: { lat: 20.2444, lng: 85.8178, city: 'Bhubaneswar', name: 'Biju Patnaik International Airport', state: 'Odisha' },
  IXC: { lat: 30.6735, lng: 76.7885, city: 'Chandigarh', name: 'Shaheed Bhagat Singh International Airport', state: 'Punjab' },
  ATQ: { lat: 31.7096, lng: 74.7973, city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International Airport', state: 'Punjab' },
  SXR: { lat: 33.9871, lng: 74.7741, city: 'Srinagar', name: 'Sheikh ul-Alam International Airport', state: 'Jammu & Kashmir' },
  IXJ: { lat: 32.6891, lng: 74.8374, city: 'Jammu', name: 'Jammu Airport', state: 'Jammu & Kashmir' },
  IXB: { lat: 26.6812, lng: 88.3286, city: 'Bagdogra', name: 'Bagdogra International Airport', state: 'West Bengal' },
  VNS: { lat: 25.4524, lng: 82.8593, city: 'Varanasi', name: 'Lal Bahadur Shastri International Airport', state: 'Uttar Pradesh' },
  NAG: { lat: 21.0922, lng: 79.0472, city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International Airport', state: 'Maharashtra' },
  IDR: { lat: 22.7217, lng: 75.8011, city: 'Indore', name: 'Devi Ahilyabai Holkar Airport', state: 'Madhya Pradesh' },
  BHO: { lat: 23.2875, lng: 77.3378, city: 'Bhopal', name: 'Raja Bhoj Airport', state: 'Madhya Pradesh' },
  RPR: { lat: 21.1804, lng: 81.7388, city: 'Raipur', name: 'Swami Vivekananda Airport', state: 'Chhattisgarh' },
  IXR: { lat: 23.3143, lng: 85.3217, city: 'Ranchi', name: 'Birsa Munda Airport', state: 'Jharkhand' },
  DED: { lat: 30.1897, lng: 78.1803, city: 'Dehradun', name: 'Jolly Grant Airport', state: 'Uttarakhand' },
  UDR: { lat: 24.6177, lng: 73.8961, city: 'Udaipur', name: 'Maharana Pratap Airport', state: 'Rajasthan' },
  STV: { lat: 21.1139, lng: 72.7419, city: 'Surat', name: 'Surat International Airport', state: 'Gujarat' },
  BDQ: { lat: 22.3325, lng: 73.2264, city: 'Vadodara', name: 'Vadodara Airport', state: 'Gujarat' },

  // South India Regional Gateways
  VGA: { lat: 16.5304, lng: 80.7968, city: 'Vijayawada', name: 'Vijayawada International Airport', state: 'Andhra Pradesh' },
  VTZ: { lat: 17.7212, lng: 83.2245, city: 'Visakhapatnam', name: 'Visakhapatnam Airport', state: 'Andhra Pradesh' },
  TIR: { lat: 13.6325, lng: 79.5433, city: 'Tirupati', name: 'Tirupati Airport', state: 'Andhra Pradesh' },
  CDP: { lat: 14.5100, lng: 78.7725, city: 'Kadapa', name: 'Kadapa Airport', state: 'Andhra Pradesh' },
  KJB: { lat: 15.7008, lng: 78.1883, city: 'Kurnool', name: 'Uyyalawada Narasimha Reddy Airport', state: 'Andhra Pradesh' },
  TRV: { lat: 8.4821, lng: 76.9200, city: 'Thiruvananthapuram', name: 'Thiruvananthapuram International Airport', state: 'Kerala' },
  CCJ: { lat: 11.1368, lng: 75.9553, city: 'Kozhikode', name: 'Calicut International Airport', state: 'Kerala' },
  IXE: { lat: 12.9613, lng: 74.8901, city: 'Mangaluru', name: 'Mangalore International Airport', state: 'Karnataka' },
  MYQ: { lat: 12.2300, lng: 76.6500, city: 'Mysuru', name: 'Mysore Airport', state: 'Karnataka' },
  HBX: { lat: 15.3617, lng: 75.0849, city: 'Hubballi', name: 'Hubballi Airport', state: 'Karnataka' },
  CJB: { lat: 11.0298, lng: 77.0434, city: 'Coimbatore', name: 'Coimbatore International Airport', state: 'Tamil Nadu' },
  TRZ: { lat: 10.7654, lng: 78.7097, city: 'Tiruchirappalli', name: 'Tiruchirappalli International Airport', state: 'Tamil Nadu' },
  IXM: { lat: 9.8345, lng: 78.0934, city: 'Madurai', name: 'Madurai Airport', state: 'Tamil Nadu' },
  IXZ: { lat: 11.6411, lng: 92.7297, city: 'Port Blair', name: 'Veer Savarkar International Airport', state: 'Andaman & Nicobar' },

  // International Gateway Waypoints for Flights Crossing Indian Airspace
  DXB: { lat: 25.2532, lng: 55.3657, city: 'Dubai (Gulf Airway)', name: 'Dubai International Corridor', state: 'UAE' },
  DOH: { lat: 25.2731, lng: 51.6081, city: 'Doha (Gulf Airway)', name: 'Hamad International Corridor', state: 'Qatar' },
  AUH: { lat: 24.4330, lng: 54.6511, city: 'Abu Dhabi (Gulf)', name: 'Zayed International Corridor', state: 'UAE' },
  MCT: { lat: 23.5933, lng: 58.2844, city: 'Muscat (Arabian Sea)', name: 'Muscat International Corridor', state: 'Oman' },
  BKK: { lat: 13.6900, lng: 100.7501, city: 'Bangkok (SE Asia)', name: 'Suvarnabhumi Air Corridor', state: 'Thailand' },
  SIN: { lat: 1.3644, lng: 103.9915, city: 'Singapore (Malacca)', name: 'Changi Air Corridor', state: 'Singapore' },
  KTM: { lat: 27.6966, lng: 85.3591, city: 'Kathmandu (Himalayan)', name: 'Tribhuvan Air Corridor', state: 'Nepal' },
  DAC: { lat: 23.8433, lng: 90.3978, city: 'Dhaka (Eastern Corridor)', name: 'Hazrat Shahjalal Air Corridor', state: 'Bangladesh' },
  CMB: { lat: 7.1808, lng: 79.8841, city: 'Colombo (Indian Ocean)', name: 'Bandaranaike Corridor', state: 'Sri Lanka' }
};

/**
 * Lookup coordinates for an IATA code or city name fallback
 */
export function getAirportCoords(iataCode) {
  if (!iataCode) return null;
  const cleanCode = iataCode.trim().toUpperCase();
  if (AIRPORT_COORDINATES[cleanCode]) {
    return { iata: cleanCode, ...AIRPORT_COORDINATES[cleanCode] };
  }

  // Fallback search by city substring
  const foundKey = Object.keys(AIRPORT_COORDINATES).find(k =>
    AIRPORT_COORDINATES[k].city.toUpperCase().includes(cleanCode) ||
    cleanCode.includes(AIRPORT_COORDINATES[k].city.toUpperCase())
  );

  if (foundKey) {
    return { iata: foundKey, ...AIRPORT_COORDINATES[foundKey] };
  }

  // Safe central-India fallback for unmapped IATA codes
  return {
    iata: cleanCode,
    lat: 20.5937,
    lng: 78.9629,
    city: cleanCode,
    name: `${cleanCode} Airfield`,
    state: 'India'
  };
}

/**
 * Calculate Great Circle Bearing (heading) in degrees (0 - 359)
 */
export function calculateHeading(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return Math.round((brng + 360) % 360);
}

/**
 * Calculate Great Circle Distance in kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Convert heading degree to 8-point compass cardinal
 */
export function getHeadingCardinal(heading) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading %= 360) < 0 ? heading + 360 : heading) / 45) % 8;
  return directions[index];
}

/**
 * Identify airline from callsign prefix
 */
export function getAirlineInfo(callsign) {
  const cs = (callsign || '').trim().toUpperCase();
  if (cs.startsWith('IGO') || cs.startsWith('6E')) return { name: 'IndiGo', code: '6E', isCommercial: true, color: '#3b82f6' };
  if (cs.startsWith('AIC') || cs.startsWith('AI')) return { name: 'Air India', code: 'AI', isCommercial: true, color: '#ef4444' };
  if (cs.startsWith('VTI') || cs.startsWith('UK')) return { name: 'Vistara', code: 'UK', isCommercial: true, color: '#8b5cf6' };
  if (cs.startsWith('SEJ') || cs.startsWith('SG')) return { name: 'SpiceJet', code: 'SG', isCommercial: true, color: '#f97316' };
  if (cs.startsWith('AKJ') || cs.startsWith('QP')) return { name: 'Akasa Air', code: 'QP', isCommercial: true, color: '#ec4899' };
  if (cs.startsWith('AXB') || cs.startsWith('IX')) return { name: 'Air India Express', code: 'IX', isCommercial: true, color: '#f43f5e' };
  if (cs.startsWith('QTR')) return { name: 'Qatar Airways', code: 'QR', isCommercial: true, color: '#a855f7' };
  if (cs.startsWith('UAE')) return { name: 'Emirates', code: 'EK', isCommercial: true, color: '#eab308' };
  if (cs.startsWith('ETD')) return { name: 'Etihad Airways', code: 'EY', isCommercial: true, color: '#eab308' };
  if (cs.startsWith('SIA')) return { name: 'Singapore Airlines', code: 'SQ', isCommercial: true, color: '#38bdf8' };
  if (cs.startsWith('THA')) return { name: 'Thai Airways', code: 'TG', isCommercial: true, color: '#c084fc' };
  if (cs.startsWith('GFA')) return { name: 'Gulf Air', code: 'GF', isCommercial: true, color: '#eab308' };
  if (cs.startsWith('FDB')) return { name: 'flydubai', code: 'FZ', isCommercial: true, color: '#38bdf8' };
  if (cs.startsWith('OMA')) return { name: 'Oman Air', code: 'WY', isCommercial: true, color: '#06b6d4' };
  if (cs.startsWith('BAW')) return { name: 'British Airways', code: 'BA', isCommercial: true, color: '#38bdf8' };
  if (cs.startsWith('DLH')) return { name: 'Lufthansa', code: 'LH', isCommercial: true, color: '#fbbf24' };
  if (cs.startsWith('AFR')) return { name: 'Air France', code: 'AF', isCommercial: true, color: '#38bdf8' };

  return { name: cs || 'Civil Aircraft', code: 'GEN', isCommercial: false, color: '#94a3b8' };
}

/**
 * Calculate estimated time en route in minutes
 */
export function estimateTimeEnRouteMins(distanceKm, velocityMs) {
  const speedKmH = (velocityMs || 220) * 3.6;
  if (speedKmH <= 50) return 45;
  const mins = Math.round((distanceKm / speedKmH) * 60);
  return Math.max(10, mins);
}

/**
 * Estimate origin and destination hubs based on position, heading vector, and flight corridors.
 * GUARANTEED to ALWAYS produce valid origin and destination for 100% of aircraft!
 */
export function estimateFlightCorridor(lat, lng, heading, callsign) {
  const airline = getAirlineInfo(callsign);
  const validHeading = typeof heading === 'number' && !isNaN(heading) ? (heading % 360 + 360) % 360 : 0;
  const cardinal = getHeadingCardinal(validHeading);

  let bestDest = null;
  let minDestScore = Infinity;
  let bestOrig = null;
  let minOrigScore = Infinity;

  // 1. Check known airport corridors in forward and rear cones
  Object.entries(AIRPORT_COORDINATES).forEach(([iata, apt]) => {
    const dist = calculateDistanceKm(lat, lng, apt.lat, apt.lng);
    const bearing = calculateHeading(lat, lng, apt.lat, apt.lng);
    let diff = Math.abs(bearing - validHeading);
    if (diff > 180) diff = 360 - diff;

    // Destination: forward cone (diff <= 65 deg, within 2600 km, dist >= 20 km)
    if (diff <= 65 && dist >= 20 && dist <= 2600) {
      const score = dist * (1 + (diff / 65) * 1.2);
      if (score < minDestScore) {
        minDestScore = score;
        bestDest = { iata, ...apt, distKm: dist };
      }
    }

    // Origin: rear cone (diff >= 115 deg, within 2600 km, dist >= 20 km)
    if (diff >= 115 && dist >= 20 && dist <= 2600) {
      const score = dist * (1 + ((180 - diff) / 65) * 1.2);
      if (score < minOrigScore) {
        minOrigScore = score;
        bestOrig = { iata, ...apt, distKm: dist };
      }
    }
  });

  // 2. GUARANTEED FORWARD DESTINATION: If no airport matched within cone, project forward along heading vector
  if (!bestDest) {
    const headingRad = validHeading * (Math.PI / 180);
    const projDistKm = 480; // 480 km forward
    const distDeg = projDistKm / 111.32;
    const destLat = Number((lat + distDeg * Math.cos(headingRad)).toFixed(4));
    const destLng = Number((lng + (distDeg * Math.sin(headingRad) / Math.cos(lat * (Math.PI / 180)))).toFixed(4));

    bestDest = {
      iata: cardinal,
      city: `${cardinal} Air Corridor`,
      name: `Airspace Waypoint ${Math.round(validHeading)}°`,
      lat: destLat,
      lng: destLng,
      distKm: projDistKm,
      isProjected: true
    };
  }

  // 3. GUARANTEED REAR ORIGIN: If no airport matched rear cone, project backward along heading vector
  if (!bestOrig) {
    const oppHeadingRad = ((validHeading + 180) % 360) * (Math.PI / 180);
    const projDistKm = 400; // 400 km backward
    const distDeg = projDistKm / 111.32;
    const origLat = Number((lat + distDeg * Math.cos(oppHeadingRad)).toFixed(4));
    const origLng = Number((lng + (distDeg * Math.sin(oppHeadingRad) / Math.cos(lat * (Math.PI / 180)))).toFixed(4));
    const oppCardinal = getHeadingCardinal((validHeading + 180) % 360);

    bestOrig = {
      iata: oppCardinal,
      city: `${oppCardinal} Sector`,
      name: `Departure Airway Corridor`,
      lat: origLat,
      lng: origLng,
      distKm: projDistKm,
      isProjected: true
    };
  }

  const routeLabel = `${bestOrig.city} (${bestOrig.iata}) → ${bestDest.city} (${bestDest.iata})`;

  return {
    airline,
    origin: bestOrig,
    destination: bestDest,
    routeLabel
  };
}
