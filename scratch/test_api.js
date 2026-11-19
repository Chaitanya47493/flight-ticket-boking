const key = '649fdf7f33d76b9bc6551b8c0c9769db005b642ec0040e326d17743d548325d7';

async function test() {
  try {
    console.log('Testing SerpAPI key with fetch...');
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=DEL&arrival_id=BOM&outbound_date=2024-05-30&currency=INR&api_key=${key}`;
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    if (data.best_flights) {
      console.log('Found', data.best_flights.length, 'best flights');
      console.log('First flight airline:', data.best_flights[0].flights[0].airline);
    } else {
      console.log('No best_flights found. Response keys:', Object.keys(data));
      if (data.error) console.log('Error from API:', data.error);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
