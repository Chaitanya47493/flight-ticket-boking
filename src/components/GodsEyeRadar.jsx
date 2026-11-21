import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { 
  Radar, 
  Search, 
  X, 
  Eye, 
  Compass, 
  Gauge, 
  Mountain, 
  MapPin, 
  Navigation, 
  Radio, 
  RefreshCw, 
  Plane,
  Crosshair,
  Maximize2,
  Filter,
  Tag,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  AIRPORT_COORDINATES, 
  getAirportCoords, 
  calculateHeading, 
  calculateDistanceKm, 
  estimateFlightCorridor,
  estimateTimeEnRouteMins,
  getHeadingCardinal,
  getAirlineInfo 
} from '../utils/airportCoords';
import { fetchRouteWeather, predictDelayRisk } from '../utils/weatherRisk';

// Visual mode textures & atmospheric colors
const VISUAL_MODES = {
  dark: {
    name: 'Dark Radar',
    globeImage: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
    bumpImage: '//unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#6366f1',
    primaryColor: '#818cf8',
    hudBorder: 'rgba(99, 102, 241, 0.35)',
    hudBg: 'rgba(15, 23, 42, 0.92)'
  },
  night: {
    name: 'Night Vision Green',
    globeImage: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
    bumpImage: '//unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#10b981',
    primaryColor: '#10b981',
    hudBorder: 'rgba(16, 185, 129, 0.45)',
    hudBg: 'rgba(6, 26, 16, 0.94)'
  },
  satellite: {
    name: 'Satellite',
    globeImage: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImage: '//unpkg.com/three-globe/example/img/earth-topology.png',
    atmosphereColor: '#38bdf8',
    primaryColor: '#38bdf8',
    hudBorder: 'rgba(56, 189, 248, 0.35)',
    hudBg: 'rgba(15, 23, 42, 0.92)'
  }
};

const GodsEyeRadar = ({ trackedBooking, onClose }) => {
  const globeRef = useRef(null);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [planes, setPlanes] = useState([]);
  const [radarMeta, setRadarMeta] = useState({ source: 'simulated', count: 0, timestamp: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlane, setSelectedPlane] = useState(() => {
    if (trackedBooking?.flight) {
      return {
        icao24: 'TRACKED_BOOKING',
        callsign: trackedBooking.flight.flightNumber,
        isTrackedBooking: true
      };
    }
    return null;
  });
  const [isolateTrackedFlight, setIsolateTrackedFlight] = useState(!!trackedBooking);
  const [hoveredPlane, setHoveredPlane] = useState(null);
  const [isFollowingPlane, setIsFollowingPlane] = useState(false);
  const [visualMode, setVisualMode] = useState('dark');
  const [filterMode, setFilterMode] = useState('domestic'); // 'domestic' | 'all' | 'high'
  const [showAllLabels, setShowAllLabels] = useState(false); // false = hover/select only
  const [dismissErrorBanner, setDismissErrorBanner] = useState(false);

  // Tracked booking route details or missing airport error handling
  const { routeDetails, routeError } = useMemo(() => {
    if (!trackedBooking || !trackedBooking.flight) {
      return { routeDetails: null, routeError: null };
    }
    const originIata = trackedBooking.flight.origin;
    const destIata = trackedBooking.flight.destination;
    const originCoord = getAirportCoords(originIata);
    const destCoord = getAirportCoords(destIata);

    if (!originCoord || !destCoord) {
      const missing = !originCoord && !destCoord 
        ? `${originIata || 'N/A'} & ${destIata || 'N/A'}`
        : (!originCoord ? originIata : destIata);
      return {
        routeDetails: null,
        routeError: `Flight route tracking unavailable: Airport code '${missing}' is not mapped in radar database.`
      };
    }

    const distance = calculateDistanceKm(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng);
    const heading = calculateHeading(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng);

    return {
      routeDetails: {
        originIata,
        destIata,
        originCoord,
        destCoord,
        distance,
        heading,
        pnr: trackedBooking.id ? trackedBooking.id.substring(0, 6).toUpperCase() : 'AS9842',
        airline: trackedBooking.flight.airline,
        flightNumber: trackedBooking.flight.flightNumber,
        departureTime: trackedBooking.flight.departureTime,
        arrivalTime: trackedBooking.flight.arrivalTime,
        cabinClass: trackedBooking.selectedClass?.name || 'Economy'
      },
      routeError: null
    };
  }, [trackedBooking]);

  // Dynamic progress fraction for tracked booking glowing aircraft (0.0 -> 1.0)
  const [trackedProgress, setTrackedProgress] = useState(0.42);
  const [trackedWeather, setTrackedWeather] = useState(null);

  const trackedRouteKey = routeDetails ? `${routeDetails.originIata}->${routeDetails.destIata}` : null;
  const [prevTrackedKey, setPrevTrackedKey] = useState(trackedRouteKey);
  if (prevTrackedKey !== trackedRouteKey) {
    setPrevTrackedKey(trackedRouteKey);
    if (!trackedRouteKey) {
      setTrackedWeather(null);
    }
  }

  // Keep selectedPlane and isolation synced if tracked flight prop changes
  const trackedFlightNumber = trackedBooking?.flight?.flightNumber;
  const [prevTrackedFlight, setPrevTrackedFlight] = useState(trackedFlightNumber);
  if (prevTrackedFlight !== trackedFlightNumber) {
    setPrevTrackedFlight(trackedFlightNumber);
    if (trackedFlightNumber) {
      setSelectedPlane({
        icao24: 'TRACKED_BOOKING',
        callsign: trackedFlightNumber,
        isTrackedBooking: true
      });
      setIsolateTrackedFlight(true);
    }
  }

  // Fetch real-time corridor weather when tracking a booking
  useEffect(() => {
    let isMounted = true;
    if (routeDetails?.originIata && routeDetails?.destIata) {
      fetchRouteWeather(routeDetails.originIata, routeDetails.destIata)
        .then(data => {
          if (isMounted) setTrackedWeather(data);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [routeDetails?.originIata, routeDetails?.destIata]);

  const trackedRisk = useMemo(() => {
    if (!trackedWeather?.originWeather || !trackedWeather?.destWeather) return null;
    return predictDelayRisk(trackedWeather.originWeather, trackedWeather.destWeather, 0);
  }, [trackedWeather]);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || window.innerWidth,
          height: containerRef.current.clientHeight || Math.max(620, window.innerHeight - 120)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initial load + 30-second polling
  useEffect(() => {
    let isCancelled = false;

    const loadRadarData = async () => {
      try {
        const res = await fetch('/api/radar');
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setPlanes(data.planes || []);
          setRadarMeta({
            source: data.source || 'simulated',
            count: data.count || data.planes?.length || 0,
            timestamp: data.timestamp || 0
          });
        }
      } catch (err) {
        console.warn('Failed to fetch /api/radar, using current state:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadRadarData();

    const pollInterval = setInterval(() => {
      setIsRefreshing(true);
      loadRadarData();
    }, 30000);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, []);

  // Smooth local dead-reckoning movement & tracked plane progress
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTrackedProgress(prev => (prev + 0.003) % 1.0);

      setPlanes(prevPlanes =>
        prevPlanes.map(plane => {
          const speedDeg = (plane.velocityMs || 220) * 2 / 111320;
          const rad = (plane.heading || 0) * (Math.PI / 180);
          const nextLat = Number((plane.lat + (speedDeg * Math.cos(rad))).toFixed(4));
          const nextLng = Number((plane.lng + (speedDeg * Math.sin(rad) / Math.cos(plane.lat * (Math.PI / 180)))).toFixed(4));
          return {
            ...plane,
            lat: nextLat,
            lng: nextLng
          };
        })
      );
    }, 2000);

    return () => clearInterval(moveInterval);
  }, []);

  // Center Globe on India or Tracked Route on mount
  useEffect(() => {
    if (globeRef.current) {
      if (routeDetails) {
        const midLat = (routeDetails.originCoord.lat + routeDetails.destCoord.lat) / 2;
        const midLng = (routeDetails.originCoord.lng + routeDetails.destCoord.lng) / 2;
        globeRef.current.pointOfView({ lat: midLat, lng: midLng, altitude: 0.95 }, 1200);
      } else {
        globeRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 1.6 }, 1000);
      }
    }
  }, [routeDetails]);

  // Clean WebGL resources on unmount
  useEffect(() => {
    const globeInstance = globeRef.current;
    return () => {
      if (globeInstance?._destructor) {
        try {
          globeInstance._destructor();
        } catch {
          // ignore cleanup errors on unmount
        }
      }
    };
  }, []);

  // ── 1. FILTERED PLANES (Category Filter + Search + Enriched Corridors) ──
  const { filteredPlanes, commercialCount } = useMemo(() => {
    // Synthesize active tracked booking flight if present
    let trackedPlaneObj = null;
    if (routeDetails) {
      const curLat = routeDetails.originCoord.lat + (routeDetails.destCoord.lat - routeDetails.originCoord.lat) * trackedProgress;
      const curLng = routeDetails.originCoord.lng + (routeDetails.destCoord.lng - routeDetails.originCoord.lng) * trackedProgress;
      trackedPlaneObj = {
        icao24: 'TRACKED_BOOKING',
        callsign: routeDetails.flightNumber,
        lat: curLat,
        lng: curLng,
        altitudeMeters: 10668,
        velocityMs: 235,
        heading: routeDetails.heading,
        originCountry: 'India',
        onGround: false,
        route: `${routeDetails.originIata} → ${routeDetails.destIata}`,
        isTrackedBooking: true,
        pnr: routeDetails.pnr,
        airlineInfo: { name: routeDetails.airline, isCommercial: true, color: '#ec4899' },
        corridor: {
          routeLabel: `${routeDetails.originCoord.city} (${routeDetails.originIata}) → ${routeDetails.destCoord.city} (${routeDetails.destIata})`,
          origin: routeDetails.originCoord,
          destination: routeDetails.destCoord
        }
      };
    }

    // When isolating tracked flight, display ONLY that specific flight on radar
    if (trackedPlaneObj && isolateTrackedFlight) {
      return { filteredPlanes: [trackedPlaneObj], commercialCount: 1 };
    }

    let commCount = 0;

    const enriched = planes.map(p => {
      const airlineInfo = getAirlineInfo(p.callsign);
      if (airlineInfo.isCommercial || p.route) commCount++;
      const corridor = estimateFlightCorridor(p.lat, p.lng, p.heading, p.callsign);
      return {
        ...p,
        airlineInfo,
        corridor
      };
    });

    let list = enriched;

    // Apply Filter Mode
    if (filterMode === 'domestic') {
      list = list.filter(p => p.airlineInfo?.isCommercial || !!p.route);
    } else if (filterMode === 'high') {
      list = list.filter(p => (p.altitudeMeters || 0) >= 7620); // >= 25,000 ft
    }

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(p =>
        (p.callsign && p.callsign.toUpperCase().includes(q)) ||
        (p.icao24 && p.icao24.toUpperCase().includes(q)) ||
        (p.corridor?.routeLabel && p.corridor.routeLabel.toUpperCase().includes(q)) ||
        (p.airlineInfo?.name && p.airlineInfo.name.toUpperCase().includes(q))
      );
    }

    if (trackedPlaneObj) {
      list = [trackedPlaneObj, ...list];
    }

    return { filteredPlanes: list, commercialCount: commCount };
  }, [planes, searchQuery, filterMode, routeDetails, trackedProgress, isolateTrackedFlight]);

  // LIVE SYNCHRONIZED TARGET: Keeps selected plane's telemetry, position & corridor updated with live motion
  const liveSelectedPlane = useMemo(() => {
    if (!selectedPlane) return null;
    return filteredPlanes.find(p => p.icao24 === selectedPlane.icao24) || selectedPlane;
  }, [selectedPlane, filteredPlanes]);

  // Active target for trajectory drawing and HUD (selected, or hovered)
  const activeFocusPlane = liveSelectedPlane || hoveredPlane;

  // ── FOLLOW PLANE CAMERA SYSTEM ──
  useEffect(() => {
    if (isFollowingPlane && liveSelectedPlane && globeRef.current) {
      globeRef.current.pointOfView({
        lat: liveSelectedPlane.lat,
        lng: liveSelectedPlane.lng,
        altitude: 0.35 // Close-up chase camera view
      }, 1000);
    }
  }, [isFollowingPlane, liveSelectedPlane]);

  const handleToggleFollow = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextState = !isFollowingPlane;
    setIsFollowingPlane(nextState);

    if (nextState && liveSelectedPlane && globeRef.current) {
      // Dive camera into close proximity
      globeRef.current.pointOfView({
        lat: liveSelectedPlane.lat,
        lng: liveSelectedPlane.lng,
        altitude: 0.35
      }, 900);
    } else if (!nextState && globeRef.current) {
      // Return to comfortable overview
      globeRef.current.pointOfView({
        altitude: 1.3
      }, 800);
    }
  };

  // ── 2. REGIONAL HUB AIRPORT LABELS (Clean, Uncrowded) ──
  const airportLabels = useMemo(() => {
    const majorIatas = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'GOI', 'AMD', 'COK', 'JAI', 'LKO', 'VGA'];
    const activeIatas = new Set(majorIatas);

    // If a flight is focused, add its origin and destination labels if not already visible
    if (activeFocusPlane?.corridor?.destination?.iata) {
      activeIatas.add(activeFocusPlane.corridor.destination.iata);
    }
    if (activeFocusPlane?.corridor?.origin?.iata) {
      activeIatas.add(activeFocusPlane.corridor.origin.iata);
    }

    const labels = [];
    activeIatas.forEach(iata => {
      const apt = AIRPORT_COORDINATES[iata];
      if (!apt) return;
      const isTopMetro = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU'].includes(iata);
      const isTargetDest = activeFocusPlane?.corridor?.destination?.iata === iata;

      labels.push({
        lat: apt.lat,
        lng: apt.lng,
        text: `${iata} · ${apt.city}`,
        size: isTargetDest ? 0.38 : (isTopMetro ? 0.30 : 0.22),
        color: isTargetDest
          ? '#fbbf24'
          : visualMode === 'night' 
            ? (isTopMetro ? '#34d399' : '#10b981')
            : (isTopMetro ? '#60a5fa' : '#94a3b8'),
        iata,
        city: apt.city
      });
    });

    return labels;
  }, [visualMode, activeFocusPlane]);

  // ── 3. ELEGANT PULSING RADAR BEACONS (Top Hubs + Focused Destination) ──
  const ringsData = useMemo(() => {
    const rings = [];
    const keyHubs = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU'];

    // Pulse key hubs
    keyHubs.forEach((iata, idx) => {
      const apt = AIRPORT_COORDINATES[iata];
      if (apt) {
        rings.push({
          lat: apt.lat,
          lng: apt.lng,
          maxR: 1.0,
          propagationSpeed: 1.2,
          repeatPeriod: 1400 + (idx * 150),
          color: visualMode === 'night' ? () => '#10b981' : () => '#38bdf8'
        });
      }
    });

    // Destination target beacon for active plane!
    if (activeFocusPlane?.corridor?.destination) {
      const dest = activeFocusPlane.corridor.destination;
      rings.push({
        lat: dest.lat,
        lng: dest.lng,
        maxR: 1.8,
        propagationSpeed: 2.2,
        repeatPeriod: 1000,
        color: () => '#fbbf24' // High-visibility gold ping at target destination
      });
    }

    return rings;
  }, [visualMode, activeFocusPlane]);

  // ── 4. FLIGHT TRAJECTORY ARCS (GUARANTEED for 100% of aircraft!) ──
  const arcsData = useMemo(() => {
    const arcs = [];

    // 1. If tracking a booking, draw its dedicated flight corridor arc
    if (routeDetails) {
      arcs.push({
        startLat: routeDetails.originCoord.lat,
        startLng: routeDetails.originCoord.lng,
        endLat: routeDetails.destCoord.lat,
        endLng: routeDetails.destCoord.lng,
        color: visualMode === 'night' ? ['#10b981', '#34d399'] : ['#ec4899', '#818cf8'],
        altitude: 0.16,
        dashLength: 0.4,
        dashGap: 0.15,
        animateTime: 2000
      });
    }

    // 2. Trajectory for selected or hovered plane
    if (activeFocusPlane && activeFocusPlane.corridor) {
      const orig = activeFocusPlane.corridor.origin;
      const dest = activeFocusPlane.corridor.destination;

      // Primary Arc: Active forward flight vector from aircraft to Destination
      if (dest) {
        arcs.push({
          startLat: activeFocusPlane.lat,
          startLng: activeFocusPlane.lng,
          endLat: dest.lat,
          endLng: dest.lng,
          color: visualMode === 'night' 
            ? ['#34d399', '#10b981'] 
            : ['#38bdf8', '#fbbf24'], // High-contrast glowing cyan to amber
          altitude: 0.14,
          dashLength: 0.35,
          dashGap: 0.12,
          animateTime: 1600
        });
      }

      // Secondary Arc: Departure path from Origin to current position (subtle trail)
      if (orig) {
        arcs.push({
          startLat: orig.lat,
          startLng: orig.lng,
          endLat: activeFocusPlane.lat,
          endLng: activeFocusPlane.lng,
          color: visualMode === 'night' 
            ? ['rgba(16, 185, 129, 0.25)', 'rgba(52, 211, 153, 0.65)'] 
            : ['rgba(148, 163, 184, 0.25)', 'rgba(56, 189, 248, 0.65)'],
          altitude: 0.11,
          dashLength: 0.22,
          dashGap: 0.22,
          animateTime: 2800
        });
      }
    }

    return arcs;
  }, [routeDetails, activeFocusPlane, visualMode]);

  // ── 5. SEAMLESS CLICKABLE PLANE MARKER WITH FIXED 28px SQUARE HITBOX ──
  const getPlaneHtmlElement = useCallback((d) => {
    const el = document.createElement('div');
    const isSelected = selectedPlane && selectedPlane.icao24 === d.icao24;
    const isHovered = hoveredPlane && hoveredPlane.icao24 === d.icao24;
    const isTracked = !!d.isTrackedBooking;
    const shouldShowLabel = showAllLabels || isSelected || isHovered || isTracked;

    el.className = `radar-plane-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isTracked ? 'tracked' : ''}`;

    const baseColor = isTracked
      ? '#ec4899'
      : isSelected
      ? '#fbbf24'
      : isHovered
      ? '#38bdf8'
      : d.airlineInfo?.color || (visualMode === 'night' ? '#10b981' : '#38bdf8');

    const destinationTag = d.corridor?.destination?.iata ? ` → ${d.corridor.destination.iata}` : '';

    el.innerHTML = `
      <div class="radar-plane-wrapper">
        ${isTracked ? '<div class="radar-ping-glow"></div>' : ''}
        ${isSelected ? '<div class="radar-selected-glow"></div>' : ''}
        
        <!-- Centered Directional Aircraft Glyph -->
        <div class="radar-plane-glyph" style="transform: rotate(${d.heading || 0}deg);">
          <svg width="${isSelected ? '22' : isHovered ? '20' : '16'}" height="${isSelected ? '22' : isHovered ? '20' : '16'}" viewBox="0 0 24 24" fill="${baseColor}" stroke="${isSelected ? '#fff' : 'none'}" stroke-width="1.5">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>

        <!-- Callout Label: Position Absolute & Pointer-Events None (Never shifts hit area or steals clicks) -->
        ${shouldShowLabel ? `
          <div class="radar-plane-callout" style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid ${isSelected ? '#fbbf24' : baseColor};
          ">
            <span style="color: ${baseColor};">${d.callsign || d.icao24}</span>${destinationTag}
          </div>
        ` : ''}
      </div>
    `;

    el.onmouseenter = () => setHoveredPlane(d);
    el.onmouseleave = () => setHoveredPlane(null);

    // Reliable click and pointer interception so clicks never fall through to globe
    const handleMarkerSelect = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      setSelectedPlane(d);
      setIsFollowingPlane(false);
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.95 }, 600);
      }
    };

    el.onclick = handleMarkerSelect;
    el.onpointerdown = (e) => e.stopPropagation();
    el.onmousedown = (e) => e.stopPropagation();

    return el;
  }, [selectedPlane, hoveredPlane, showAllLabels, visualMode]);

  const currentTheme = VISUAL_MODES[visualMode];

  return (
    <div
      ref={containerRef}
      className={`gods-eye-container mode-${visualMode} animate-fade-in`}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 110px)',
        minHeight: '640px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#030712',
        border: `1px solid ${currentTheme.hudBorder}`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 0, 0, 0.9)`
      }}
    >
      {/* ── 3D Interactive Globe ────────────────────────────────────── */}
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={currentTheme.globeImage}
        bumpImageUrl={currentTheme.bumpImage}
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor={currentTheme.atmosphereColor}
        atmosphereAltitude={0.22}
        showAtmosphere={true}
        showGraticules={true}
        htmlElementsData={filteredPlanes}
        htmlElement={getPlaneHtmlElement}
        htmlTransitionDuration={800}
        arcsData={arcsData}
        arcStartLat={d => d.startLat}
        arcStartLng={d => d.startLng}
        arcEndLat={d => d.endLat}
        arcEndLng={d => d.endLng}
        arcColor={d => d.color}
        arcAltitude={d => d.altitude}
        arcDashLength={d => d.dashLength}
        arcDashGap={d => d.dashGap}
        arcDashAnimateTime={d => d.animateTime}
        ringsData={ringsData}
        ringLat={d => d.lat}
        ringLng={d => d.lng}
        ringMaxRadius={d => d.maxR}
        ringPropagationSpeed={d => d.propagationSpeed}
        ringRepeatPeriod={d => d.repeatPeriod}
        ringColor={d => d.color}
        labelsData={airportLabels}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.text}
        labelSize={d => d.size}
        labelColor={d => d.color}
        labelDotRadius={0.12}
        labelAltitude={0.005}
        labelResolution={3}
        onGlobeClick={() => {
          setSelectedPlane(null);
          setIsFollowingPlane(false);
        }}
      />

      {/* ── Initial Telemetry Scanning Overlay ─────────────────────── */}
      {isLoading && planes.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.92)',
          padding: '24px 32px',
          borderRadius: '16px',
          border: `1px solid ${currentTheme.hudBorder}`,
          backdropFilter: 'blur(16px)',
          zIndex: 110,
          color: '#fff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
        }}>
          <div className="radar-sweep-icon">
            <Radar size={42} style={{ color: currentTheme.primaryColor }} />
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '1px' }}>
            ACQUIRING AIRSPACE TELEMETRY...
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Scanning OpenSky Network over Indian flight corridors
          </div>
        </div>
      )}

      {/* ── STRUCTURED TACTICAL HUD TOP BAR (Pointer Events None on wrapper) ─ */}
      <div
        className="radar-hud-wrapper"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
          pointerEvents: 'none'
        }}
      >
        {/* Tier 1: Main Header & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            background: currentTheme.hudBg,
            backdropFilter: 'blur(18px)',
            border: `1px solid ${currentTheme.hudBorder}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'auto'
          }}
        >
          {/* Brand & Airspace Specs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="radar-sweep-icon">
              <Radar size={22} style={{ color: currentTheme.primaryColor }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '1.5px', color: '#fff', textTransform: 'uppercase' }}>
                Aero<span style={{ color: currentTheme.primaryColor }}>Radar</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.5px' }}>
                INDIAN AIRSPACE SURVEILLANCE &bull; 6°N-37°N | 68°E-98°E
              </div>
            </div>
          </div>

          {/* Center Telemetry Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: radarMeta.source === 'live' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(234, 179, 8, 0.18)',
                color: radarMeta.source === 'live' ? '#4ade80' : '#facc15',
                border: `1px solid ${radarMeta.source === 'live' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
              }}
            >
              <Radio size={12} className="animate-pulse" />
              {radarMeta.source === 'live' ? 'LIVE OPENSKY' : 'SIMULATED CORRIDOR'}
            </span>

            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
              {filteredPlanes.length} Active Targets
            </span>

            {isRefreshing && (
              <RefreshCw size={14} className="animate-spin" style={{ color: currentTheme.primaryColor }} />
            )}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              title="Reset View to India"
              onClick={() => {
                if (globeRef.current) {
                  globeRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 1.6 }, 1000);
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              <Maximize2 size={13} />
              Center
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close AeroRadar"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <X size={14} />
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Filters & Visualization Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '8px 16px',
            background: currentTheme.hudBg,
            backdropFilter: 'blur(16px)',
            border: `1px solid ${currentTheme.hudBorder}`,
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'auto'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search flight, city, airline..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {routeDetails && (
              <button
                type="button"
                onClick={() => setIsolateTrackedFlight(!isolateTrackedFlight)}
                title={isolateTrackedFlight ? "Switch to show all airspace traffic" : "Isolate tracked flight only"}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isolateTrackedFlight ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: isolateTrackedFlight ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isolateTrackedFlight ? '#f472b6' : '#cbd5e1',
                  transition: 'all 0.2s ease'
                }}
              >
                <Crosshair size={12} />
                <span>{isolateTrackedFlight ? `Isolated: ${routeDetails.flightNumber}` : 'Isolate Flight'}</span>
              </button>
            )}
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={11} /> Airspace Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterMode('domestic')}
              style={{
                padding: '4px 9px',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                border: filterMode === 'domestic' ? `1px solid ${currentTheme.primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                background: filterMode === 'domestic' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                color: filterMode === 'domestic' ? '#fff' : '#94a3b8'
              }}
            >
              Domestic Airlines ({commercialCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '4px 9px',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                border: filterMode === 'all' ? `1px solid ${currentTheme.primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                background: filterMode === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                color: filterMode === 'all' ? '#fff' : '#94a3b8'
              }}
            >
              All Airspace ({planes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('high')}
              style={{
                padding: '4px 9px',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                border: filterMode === 'high' ? `1px solid ${currentTheme.primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                background: filterMode === 'high' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                color: filterMode === 'high' ? '#fff' : '#94a3b8'
              }}
            >
              High Altitude (&gt;25k ft)
            </button>
          </div>

          {/* Visual Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.7)', padding: '2px', borderRadius: '7px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {Object.keys(VISUAL_MODES).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVisualMode(mode)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    background: visualMode === mode ? currentTheme.primaryColor : 'transparent',
                    color: visualMode === mode ? '#0f172a' : '#94a3b8',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {VISUAL_MODES[mode].name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Label Mode Toggle */}
            <button
              type="button"
              onClick={() => setShowAllLabels(!showAllLabels)}
              title="Toggle Callout Labels"
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: showAllLabels ? `1px solid ${currentTheme.primaryColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                background: showAllLabels ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: showAllLabels ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Tag size={12} />
              {showAllLabels ? 'All Labels ON' : 'Hover Labels'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MISSING AIRPORT CODE CLEAR ERROR WARNING BANNER ──────── */}
      {routeError && !dismissErrorBanner && (
        <div
          className="radar-warning-banner animate-slide-down"
          style={{
            position: 'absolute',
            top: '125px',
            left: '16px',
            maxWidth: '560px',
            width: 'calc(100% - 32px)',
            background: 'rgba(239, 68, 68, 0.18)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '12px',
            padding: '12px 16px',
            zIndex: 110,
            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>
                Route Tracking Notice
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '2px' }}>
                {routeError}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissErrorBanner(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── ACTIVE CAMERA LOCK BANNER (When Following Plane) ───────── */}
      {isFollowingPlane && liveSelectedPlane && (
        <div style={{
          position: 'absolute',
          top: '115px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 26, 16, 0.96)',
          border: '1px solid #10b981',
          padding: '8px 20px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 110,
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
          color: '#34d399',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'radar-ping 1.5s infinite' }} />
          <span>CHASE CAM ACTIVE: {liveSelectedPlane.callsign || liveSelectedPlane.icao24} &bull; {liveSelectedPlane.corridor?.routeLabel || 'En Route'} &bull; {Math.round(liveSelectedPlane.altitudeMeters * 3.28084).toLocaleString()} FT</span>
          <button
            type="button"
            onClick={handleToggleFollow}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Release Camera
          </button>
        </div>
      )}

      {/* ── ROUTE TRACKING HUD BANNER (if trackedBooking provided) ── */}
      {routeDetails && (
        <div
          className="radar-route-banner animate-slide-down"
          style={{
            position: 'absolute',
            top: '125px',
            left: '16px',
            maxWidth: '520px',
            width: 'calc(100% - 32px)',
            background: currentTheme.hudBg,
            backdropFilter: 'blur(16px)',
            border: `1px solid ${visualMode === 'night' ? '#10b981' : 'rgba(236, 72, 153, 0.5)'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            zIndex: 90,
            boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Crosshair size={13} /> ACTIVE FLIGHT PATH TRACKING &bull; PNR {routeDetails.pnr}
            </span>
            <button
              type="button"
              onClick={() => {
                if (globeRef.current) {
                  const midLat = (routeDetails.originCoord.lat + routeDetails.destCoord.lat) / 2;
                  const midLng = (routeDetails.originCoord.lng + routeDetails.destCoord.lng) / 2;
                  globeRef.current.pointOfView({ lat: midLat, lng: midLng, altitude: 0.95 }, 1000);
                }
                setSelectedPlane({
                  icao24: 'TRACKED_BOOKING',
                  callsign: routeDetails.flightNumber,
                  isTrackedBooking: true
                });
                setIsolateTrackedFlight(true);
              }}
              style={{
                background: 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Focus Flight
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                {routeDetails.airline} {routeDetails.flightNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {routeDetails.originCoord.city} ({routeDetails.originIata}) → {routeDetails.destCoord.city} ({routeDetails.destIata})
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: currentTheme.primaryColor }}>
                {routeDetails.distance} km
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Dep: {routeDetails.departureTime} &bull; {routeDetails.cabinClass}
              </div>
            </div>
          </div>

          {/* Tactical Weather & Delay Risk Row */}
          {trackedWeather?.originWeather && trackedWeather?.destWeather && (
            <div style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <span><strong>{routeDetails.originIata}:</strong> {trackedWeather.originWeather.temperature}°C {trackedWeather.originWeather.condition}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>•</span>
                <span><strong>{routeDetails.destIata}:</strong> {trackedWeather.destWeather.temperature}°C {trackedWeather.destWeather.condition}</span>
              </div>
              {trackedRisk && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  background: trackedRisk.level === 'High' ? 'rgba(239,68,68,0.25)' : trackedRisk.level === 'Moderate' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)',
                  color: trackedRisk.level === 'High' ? '#f87171' : trackedRisk.level === 'Moderate' ? '#fbbf24' : '#34d399',
                  border: `1px solid ${trackedRisk.level === 'High' ? 'rgba(239,68,68,0.5)' : trackedRisk.level === 'Moderate' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'}`
                }}>
                  DELAY RISK: {trackedRisk.level} ({trackedRisk.score}%)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SIDE AIRCRAFT TACTICAL INFO CARD (When plane clicked) ── */}
      {liveSelectedPlane && (
        <div
          className="radar-side-card animate-scale-in"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: '340px',
            background: currentTheme.hudBg,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${currentTheme.hudBorder}`,
            borderRadius: '14px',
            padding: '18px',
            zIndex: 120,
            boxShadow: '0 16px 40px rgba(0,0,0,0.85)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={18} style={{ color: liveSelectedPlane.airlineInfo?.color || currentTheme.primaryColor }} />
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                    {liveSelectedPlane.callsign || liveSelectedPlane.icao24}
                  </span>
                  <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 700, color: liveSelectedPlane.airlineInfo?.color || currentTheme.primaryColor }}>
                    {liveSelectedPlane.airlineInfo?.name || 'Civil Aviation'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                ICAO: {liveSelectedPlane.icao24?.toUpperCase()} &bull; {liveSelectedPlane.originCountry || 'India'}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPlane(null);
                setIsFollowingPlane(false);
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Guaranteed Direction & Flight Corridor Banner */}
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
              <Navigation size={15} style={{ color: currentTheme.primaryColor }} />
              {liveSelectedPlane.corridor?.routeLabel || 'Cruising Indian Airspace'}
            </div>
            
            {liveSelectedPlane.corridor?.destination && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#cbd5e1', marginTop: '5px' }}>
                <span>Target: <strong>{liveSelectedPlane.corridor.destination.city}</strong></span>
                <span>Distance: <strong>~{Math.round(liveSelectedPlane.corridor.destination.distKm)} km</strong></span>
              </div>
            )}

            {liveSelectedPlane.corridor?.destination && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                <Clock size={12} style={{ color: currentTheme.primaryColor }} />
                <span>Est. Time En Route: ~{estimateTimeEnRouteMins(liveSelectedPlane.corridor.destination.distKm, liveSelectedPlane.velocityMs)} mins</span>
              </div>
            )}
          </div>

          {/* Live Telemetry Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {/* Altitude */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Mountain size={12} /> ALTITUDE
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                {Math.round(liveSelectedPlane.altitudeMeters * 3.28084).toLocaleString()} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>FT</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {liveSelectedPlane.altitudeMeters} m
              </div>
            </div>

            {/* Ground Speed */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Gauge size={12} /> SPEED
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                {Math.round(liveSelectedPlane.velocityMs * 3.6)} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>KM/H</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {Math.round(liveSelectedPlane.velocityMs * 1.94384)} knots
              </div>
            </div>

            {/* Heading */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Compass size={12} /> HEADING
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                {liveSelectedPlane.heading}° <span style={{ fontSize: '0.75rem', color: currentTheme.primaryColor }}>{getHeadingCardinal(liveSelectedPlane.heading)}</span>
              </div>
            </div>

            {/* Coordinates */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                <MapPin size={12} /> POSITION
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
                {liveSelectedPlane.lat.toFixed(3)}° N<br/>
                {liveSelectedPlane.lng.toFixed(3)}° E
              </div>
            </div>
          </div>

          {/* Follow Plane Toggle Button with Clear Active Feedback */}
          <button
            type="button"
            onClick={handleToggleFollow}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: isFollowingPlane ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.18)',
              background: isFollowingPlane ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.08)',
              color: isFollowingPlane ? '#34d399' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isFollowingPlane ? '0 0 25px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={16} />
            {isFollowingPlane ? '● CAMERA LOCKED (Tracking Live Flight)' : 'Lock & Follow Plane with Camera'}
          </button>
        </div>
      )}

      {/* ── BOTTOM RADAR CONTROLS & TIPS ──────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 80,
          pointerEvents: 'none'
        }}
      >
        <span>Indian hub airports marked with navigation beacons &bull; Click any aircraft to inspect telemetry &bull; Drag to orbit 3D globe</span>
      </div>
    </div>
  );
};

export default GodsEyeRadar;
