
async function testSerpApi() {
  const apiKey = 'ac4bebe03ad1ac677675c87ac84b868d74caf76f893b5c092ee47dfbadec27f7';
  const dep = 'DEL';
  const arr = 'BOM';
  const date = '2026-05-15'; // Future date
  
  console.log(`Testing SerpApi (Google Flights) with key: ${apiKey}...`);
  
  try {
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${dep}&arrival_id=${arr}&outbound_date=${date}&currency=INR&api_key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.error) {
      console.log('FAILED: API returned an error:', json.error);
      return;
    }

    const results = json.best_flights || json.other_flights || [];
    console.log(`--- API STATUS: ONLINE ---`);
    console.log(`Total results found: ${results.length}`);
    
    if (results.length > 0) {
      const first = results[0];
      const flight = first.flights[0];
      console.log('SUCCESS: Real-time data retrieved.');
      console.log(`Airline: ${flight.airline}`);
      console.log(`Price: ₹${first.price}`);
      console.log(`Time: ${flight.departure_airport.time}`);
    } else {
      console.log('RESULT: Working, but 0 flights found. Check if the date/route is valid for Google Flights.');
      console.log('Top level keys in response:', Object.keys(json));
    }
  } catch (error) {
    console.error('ERROR: Connection failed.', error.message);
  }
}

testSerpApi();
