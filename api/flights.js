export default async function handler(req, res) {
  // Enforce HTTP GET method
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers & CORS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const originHeader = req.headers.origin || req.headers.referer || '';
  const isAllowedOrigin = !originHeader || 
    /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|.*\.vercel\.app)(\/|$)/.test(originHeader);

  if (isAllowedOrigin && req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { departure_id, arrival_id, outbound_date, return_date, currency = 'INR', type = '2', adults = '1' } = req.query;

  // Input Validation
  const iataRegex = /^[A-Z]{3}$/i;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!departure_id || !iataRegex.test(departure_id)) {
    return res.status(400).json({ error: 'Invalid or missing departure_id (3-letter IATA code required)' });
  }
  if (!arrival_id || !iataRegex.test(arrival_id)) {
    return res.status(400).json({ error: 'Invalid or missing arrival_id (3-letter IATA code required)' });
  }
  if (!outbound_date || !dateRegex.test(outbound_date)) {
    return res.status(400).json({ error: 'Invalid or missing outbound_date (YYYY-MM-DD required)' });
  }
  if (return_date && !dateRegex.test(return_date)) {
    return res.status(400).json({ error: 'Invalid return_date (YYYY-MM-DD required)' });
  }

  const parsedAdults = parseInt(adults, 10);
  const safeAdults = (isNaN(parsedAdults) || parsedAdults < 1 || parsedAdults > 9) ? 1 : parsedAdults;
  const safeType = type === '1' ? '1' : '2';
  const safeCurrency = (typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency)) ? currency.toUpperCase() : 'INR';

  const apiKey = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Upstream flight service not configured' });
  }

  try {
    // Construct URL with URLSearchParams to prevent query injection
    const targetUrl = new URL('https://serpapi.com/search.json');
    targetUrl.searchParams.set('engine', 'google_flights');
    targetUrl.searchParams.set('departure_id', departure_id.toUpperCase());
    targetUrl.searchParams.set('arrival_id', arrival_id.toUpperCase());
    targetUrl.searchParams.set('outbound_date', outbound_date);
    targetUrl.searchParams.set('type', safeType);
    targetUrl.searchParams.set('adults', safeAdults.toString());
    targetUrl.searchParams.set('currency', safeCurrency);
    targetUrl.searchParams.set('gl', 'in');
    targetUrl.searchParams.set('hl', 'en');
    targetUrl.searchParams.set('api_key', apiKey);

    if (return_date) {
      targetUrl.searchParams.set('return_date', return_date);
    }

    const response = await fetch(targetUrl.toString());
    const data = await response.json();
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Failed to retrieve flight data from upstream service' });
  }
}
