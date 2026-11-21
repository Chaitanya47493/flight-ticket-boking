import { Sparkles, CheckCircle2, AlertTriangle, Info, Calendar, ArrowRight } from 'lucide-react';

const FarePredictorStrip = ({ forecast, onChangeDate, isLoading = false }) => {
  if (!forecast || !forecast.days || forecast.days.length === 0) {
    return null;
  }

  const {
    days,
    bestDay,
    currentDay,
    verdict,
    savings,
    recommendationText,
    tipReason,
    hasPriceInsights
  } = forecast;

  const isCurrentCheapest = currentDay?.isCheapest || currentDay?.dateStr === bestDay?.dateStr;

  // Verdict style & icon configuration
  const verdictConfig = {
    'Great Deal': {
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: '#4ade80',
      icon: CheckCircle2,
      label: 'Great Deal'
    },
    'Typical Fare': {
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.4)',
      text: '#38bdf8',
      icon: Info,
      label: 'Typical Fare'
    },
    'High Fare': {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: '#f87171',
      icon: AlertTriangle,
      label: 'Higher Than Usual'
    }
  }[verdict] || {
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    text: '#38bdf8',
    icon: Info,
    label: verdict
  };

  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="fare-predictor-card glass-panel animate-fade-in" style={{ marginBottom: '1.25rem' }}>
      {/* Header Row */}
      <div className="fare-predictor-header">
        <div className="fare-predictor-title-group">
          <div className="fare-predictor-icon-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="fare-predictor-title">
              Best Day to Fly — Price Predictor
            </div>
            <div className="fare-predictor-recommendation">
              <span>{recommendationText}</span>
              {savings > 0 && !isCurrentCheapest && (
                <button
                  type="button"
                  className="fare-shift-cta-btn"
                  onClick={() => onChangeDate(bestDay.dateStr)}
                  title={`Switch to ${bestDay.dayName}, ${bestDay.shortDate} to save ₹${savings.toLocaleString('en-IN')}`}
                >
                  <span>Switch to {bestDay.dayName}</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Verdict Badge */}
        <div
          className="fare-verdict-badge"
          style={{
            background: verdictConfig.bg,
            border: `1px solid ${verdictConfig.border}`,
            color: verdictConfig.text
          }}
        >
          <VerdictIcon size={14} />
          <span>{verdictConfig.label}</span>
        </div>
      </div>

      {/* 7-Day Interactive Date & Price Chart Strip */}
      <div className="fare-days-strip-container">
        <div className="fare-days-strip">
          {days.map((day) => {
            const isSelected = day.isSelected;
            const isBest = day.isCheapest;
            const isClickable = !isSelected && !isLoading;

            return (
              <button
                key={day.dateStr}
                type="button"
                className={`fare-day-pill ${isSelected ? 'is-selected' : ''} ${isBest ? 'is-best-fare' : ''}`}
                onClick={() => {
                  if (isClickable && onChangeDate) {
                    onChangeDate(day.dateStr);
                  }
                }}
                disabled={isSelected || isLoading}
                title={isSelected ? `Selected flight date: ₹${day.price.toLocaleString('en-IN')}` : `Click to view flights on ${day.dayName}, ${day.shortDate} (lowest ₹${day.price.toLocaleString('en-IN')})`}
              >
                {/* Badge tags */}
                <div className="fare-day-tag-slot">
                  {isBest ? (
                    <span className="fare-pill-tag best">Cheapest</span>
                  ) : isSelected ? (
                    <span className="fare-pill-tag selected">Selected</span>
                  ) : (
                    <span className="fare-pill-tag spacer">&nbsp;</span>
                  )}
                </div>

                {/* Day name & date */}
                <div className="fare-day-name">{day.dayName}</div>
                <div className="fare-day-date">{day.shortDate}</div>

                {/* Relative Bar Graph Indicator */}
                <div className="fare-bar-track">
                  <div
                    className={`fare-bar-fill ${isBest ? 'best' : isSelected ? 'selected' : ''}`}
                    style={{ height: `${day.barHeightPct}%` }}
                  />
                </div>

                {/* Lowest Fare */}
                <div className="fare-day-price">
                  ₹{day.price.toLocaleString('en-IN')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Educational Footer Insight */}
      <div className="fare-predictor-footer">
        <div className="fare-predictor-tip">
          <Calendar size={13} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <span>{tipReason}</span>
        </div>

        <div className="fare-predictor-source">
          <span className="fare-pulse-indicator" />
          <span>
            {hasPriceInsights
              ? 'Powered by live Google Flights price insights'
              : 'Estimated from live base fare & weekday demand trends'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FarePredictorStrip;
