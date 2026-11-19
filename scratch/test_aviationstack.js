
async function testAviationstack() {
  const apiKey = '97e9a8629fc71729e71342e5a271fe0f';
  const dep = 'DEL';
  const arr = 'BOM';
  
  console.log(`Testing Aviationstack API with key: ${apiKey}...`);
  console.log(`Route: ${dep} -> ${arr}`);
  
  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${dep}&arr_iata=${arr}`;
    const response = await fetch(url);
    const json = await response.json();
    
    if (json && json.data) {
      console.log('--- API STATUS: ONLINE ---');
      console.log(`Total flights found: ${json.data.length}`);
      
      if (json.data.length > 0) {
        console.log('SUCCESS: Data retrieved successfully.');
        console.log(`First Flight: ${json.data[0].airline.name} (${json.data[0].flight.iata})`);
      } else {
        console.log('RESULT: API is working, but returned 0 flights for this route today.');
        console.log('Note: The free plan only shows real-time/scheduled flights for the current day.');
      }
    } else if (json.error) {
      console.log('FAILED: API returned an error:', json.error.message || json.error.code);
    } else {
      console.log('FAILED: Unexpected response format', json);
    }
  } catch (error) {
    console.error('ERROR: Could not connect to API.', error.message);
  }
}

testAviationstack();
