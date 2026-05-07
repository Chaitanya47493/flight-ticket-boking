const fetch = require('node-fetch');

async function test() {
  const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=undefined&arrival_id=undefined&outbound_date=undefined&type=2&currency=INR&gl=in&hl=en&api_key=ac4bebe03ad1ac677675c87ac84b868d74caf76f893b5c092ee47dfbadec27f7`;
  
  const res = await fetch(url);
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

test();
