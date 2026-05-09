const url = "https://serpapi.com/search.json?engine=google_flights&departure_id=BOM&arrival_id=DEL&outbound_date=2026-05-15&type=2&currency=INR&api_key=ac4bebe03ad1ac677675c87ac84b868d74caf76f893b5c092ee47dfbadec27f7";

fetch(url)
  .then(res => res.json())
  .then(json => {
    const bestFlights = json.best_flights || [];
    const otherFlights = json.other_flights || [];
    const flightsData = [...bestFlights, ...otherFlights];
    
    console.log(`Total flights found: ${flightsData.length}`);
    if (flightsData.length > 0) {
      const result = flightsData[0];
      const firstFlight = result.flights[0];
      console.log(`First Flight: ${firstFlight.airline} (₹${result.price})`);
      if (result.flights.length > 1) {
        console.log(`Connecting path: BOM -> ${result.flights[1].departure_airport.id} -> DEL`);
      } else {
        console.log("Direct flight");
      }
    }
  })
  .catch(console.error);
