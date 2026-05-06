export default function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { departure_id, arrival_id, outbound_date, return_date, currency = 'INR', type = 2 } = req.query;
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departure_id}&arrival_id=${arrival_id}&outbound_date=${outbound_date}&type=${type}&currency=${currency}&gl=in&hl=en&api_key=${apiKey}`;
  
  if (return_date) {
    url += `&return_date=${return_date}`;
  }

  fetch(url)
    .then(r => r.json())
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json({ error: err.message }));
}
