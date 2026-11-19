
async function testRapidApi() {
  const apiKey = '0395c19acemsha1dddfb44292111p115949jsnb67d5a42b98';
  
  console.log(`Testing RapidAPI Key: ${apiKey}...`);
  
  try {
    // Try Skyscanner API (Sky-Scanner-v3) or similar
    const url = 'https://sky-scanner3.p.rapidapi.com/flights/search-one-way?fromEntityId=DEL&toEntityId=BOM&departDate=2026-05-15';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'sky-scanner3.p.rapidapi.com'
      }
    });
    
    const json = await response.json();
    
    if (json.message && json.message.includes('You are not subscribed')) {
      console.log('FAILED: Not subscribed to this API or key invalid.');
    } else if (json.data) {
      console.log('--- API STATUS: ONLINE ---');
      console.log('SUCCESS: Skyscanner data retrieved.');
    } else {
      console.log('RESULT:', json);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

testRapidApi();
