/**
 * Smart Best-Day Fare Predictor
 * Generates a 7-day price forecast centered on selectedDate using 1 baseline price,
 * deterministic weekday & advance-booking multipliers, and SerpApi price insights.
 */

// Stable string hash function to generate deterministic pseudo-random jitter (-2% to +2%)
function getRouteDateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Format Date object as YYYY-MM-DD in local time
export function formatDateYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Day of week multipliers for Indian domestic civil aviation:
// Tue & Wed are cheapest (lower leisure & corporate transition travel)
// Mon & Thu are moderate
// Fri & Sun are peak weekend travel
// Sat is moderate-high
const WEEKDAY_MULTIPLIERS = {
  0: 1.22, // Sunday (peak return)
  1: 0.98, // Monday (business travel start)
  2: 0.86, // Tuesday (cheapest low-demand)
  3: 0.88, // Wednesday (cheap mid-week)
  4: 0.96, // Thursday (moderate)
  5: 1.18, // Friday (weekend getaway peak)
  6: 1.08  // Saturday (leisure/family)
};

export function generateWeeklyFareForecast(selectedDateStr, lowestCurrentPrice, origin = '', destination = '', priceInsights = null) {
  if (!selectedDateStr || !lowestCurrentPrice || lowestCurrentPrice <= 0) {
    return null;
  }

  const basePrice = Number(lowestCurrentPrice);

  // Normalize today midnight in local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse selected date in local time
  const [sY, sM, sD] = selectedDateStr.split('-').map(Number);
  const selectedDate = new Date(sY, sM - 1, sD);
  selectedDate.setHours(0, 0, 0, 0);

  // Start 3 days before selectedDate
  let startDate = new Date(selectedDate);
  startDate.setDate(startDate.getDate() - 3);

  // If start date is in the past, shift forward so all 7 days are current/future
  if (startDate < today) {
    startDate = new Date(today);
  }

  // Selected date's day-of-week multiplier
  const selectedDayOfWeek = selectedDate.getDay();
  const selectedMultiplier = WEEKDAY_MULTIPLIERS[selectedDayOfWeek] || 1.0;

  // Implied un-weighted neutral base for the route
  const neutralBase = basePrice / selectedMultiplier;

  const days = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + i);
    const dateStr = formatDateYMD(curDate);
    const dayOfWeek = curDate.getDay();
    const isSelected = dateStr === selectedDateStr;

    let price = basePrice;

    if (!isSelected) {
      // Advance booking window factor:
      // Departures within 0-2 days carry last-minute surge (+10% to +18%)
      // Departures 5+ days out trend slightly lower (-4%)
      const diffDays = Math.round((curDate - today) / (1000 * 60 * 60 * 24));
      let advanceMultiplier = 1.0;
      if (diffDays <= 1) {
        advanceMultiplier = 1.18; // last-minute surge
      } else if (diffDays === 2) {
        advanceMultiplier = 1.10;
      } else if (diffDays >= 6) {
        advanceMultiplier = 0.96;
      }

      const dayMult = WEEKDAY_MULTIPLIERS[dayOfWeek] || 1.0;

      // Deterministic route + date jitter (-2% to +2%)
      const hash = getRouteDateHash(`${origin}-${destination}-${dateStr}`);
      const jitter = ((hash % 41) - 20) / 1000; // -0.020 to +0.020

      const computed = neutralBase * dayMult * advanceMultiplier * (1 + jitter);
      // Round to nearest ₹50 for natural domestic airfare look
      price = Math.round(computed / 50) * 50;
    }

    days.push({
      dateStr,
      dayName: dayNames[dayOfWeek],
      shortDate: `${curDate.getDate()} ${monthNames[curDate.getMonth()]}`,
      price,
      isSelected,
      isCheapest: false,
      barHeightPct: 50 // computed below
    });
  }

  // Identify lowest price among the 7 days
  let lowestDayPrice = Infinity;
  let bestDay = days[0];

  days.forEach(d => {
    if (d.price < lowestDayPrice) {
      lowestDayPrice = d.price;
      bestDay = d;
    }
  });

  // Mark cheapest day(s)
  days.forEach(d => {
    if (d.price === lowestDayPrice) {
      d.isCheapest = true;
    }
  });

  // Calculate relative bar heights (scaled between 24% and 100% for visual aesthetics)
  const maxPrice = Math.max(...days.map(d => d.price));
  const minPrice = lowestDayPrice;
  const spread = Math.max(1, maxPrice - minPrice);

  days.forEach(d => {
    const norm = (d.price - minPrice) / spread;
    d.barHeightPct = Math.round(24 + (norm * 76));
  });

  // Calculate savings vs selected date
  const currentSelectedDay = days.find(d => d.isSelected) || days[0];
  const maxSavings = Math.max(0, currentSelectedDay.price - bestDay.price);

  // Determine Verdict:
  // Use SerpApi price_insights.price_level if available, else compare with week average
  let verdict;
  if (priceInsights?.price_level) {
    if (priceInsights.price_level === 'low') verdict = 'Great Deal';
    else if (priceInsights.price_level === 'high') verdict = 'High Fare';
    else verdict = 'Typical Fare';
  } else {
    const avgPrice = days.reduce((sum, d) => sum + d.price, 0) / days.length;
    if (currentSelectedDay.price <= avgPrice * 0.93 || currentSelectedDay.isCheapest) {
      verdict = 'Great Deal';
    } else if (currentSelectedDay.price >= avgPrice * 1.07) {
      verdict = 'High Fare';
    } else {
      verdict = 'Typical Fare';
    }
  }

  // Generate actionable recommendation text & rationale tip
  let recommendationText;
  let tipReason;

  if (currentSelectedDay.dateStr === bestDay.dateStr) {
    recommendationText = 'You picked the cheapest day this week!';
    tipReason = 'Fares on this date are at their weekly low. Great time to complete your booking.';
  } else if (maxSavings > 0) {
    recommendationText = `Fly on ${bestDay.dayName}, ${bestDay.shortDate} to save ~₹${maxSavings.toLocaleString('en-IN')}`;
    
    // Day comparison reason
    const [bY, bM, bD] = bestDay.dateStr.split('-').map(Number);
    const [cY, cM, cD] = currentSelectedDay.dateStr.split('-').map(Number);
    const dateDiff = Math.round((new Date(bY, bM - 1, bD) - new Date(cY, cM - 1, cD)) / (1000 * 60 * 60 * 24));
    const dayWord = Math.abs(dateDiff) === 1 ? 'day' : 'days';

    if (bestDay.dayName === 'Tue' || bestDay.dayName === 'Wed') {
      tipReason = `Mid-week departures (${bestDay.dayName}) typically offer lower corporate demand and cheaper seat inventory on this corridor.`;
    } else if (dateDiff > 0) {
      tipReason = `Shifting ${dateDiff} ${dayWord} later bypasses peak travel surcharge and unlocks discounted seats.`;
    } else {
      tipReason = `Departing ${Math.abs(dateDiff)} ${dayWord} earlier avoids high weekend passenger volume.`;
    }
  } else {
    recommendationText = 'Fares are stable across these nearby dates.';
    tipReason = 'Minimal price variance across this 7-day travel window.';
  }

  return {
    days,
    bestDay,
    currentDay: currentSelectedDay,
    verdict,
    savings: maxSavings,
    recommendationText,
    tipReason,
    hasPriceInsights: !!priceInsights
  };
}
