const rapidkey = '0395c19acemsha1dddfb44292111p115949jsnb67d5a42b98';

async function testSkyscanner() {
  try {
    console.log('Testing RapidAPI (Skyscanner) key...');
    const url = `https://skyscanner-flight-search.p.rapidapi.com/en-IN/INR/en-IN/DEL-sky/BOM-sky/2024-05-20`;
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': rapidkey,
        'X-RapidAPI-Host': 'skyscanner-flight-search.p.rapidapi.com'
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response keys:', Object.keys(data));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSkyscanner();
