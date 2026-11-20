import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Filter, 
  Calendar, 
  Plane, 
  User, 
  Layers,
  FileText
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = ({ onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'CONFIRMED' | 'CANCELLED'
  const [error, setError] = useState(null);

  // Fetch all bookings from Firestore
  const fetchAllBookings = useCallback(async () => {
    try {
      let docsList = [];
      try {
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          docsList.push({ id: doc.id, ...doc.data() });
        });
      } catch {
        // Fallback if index or createdAt ordering fails
        const fallbackSnapshot = await getDocs(collection(db, 'bookings'));
        fallbackSnapshot.forEach((doc) => {
          docsList.push({ id: doc.id, ...doc.data() });
        });
        docsList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
          return tB - tA;
        });
      }
      setBookings(docsList);
      setError(null);
    } catch (err) {
      console.error('Failed to load bookings for Admin:', err);
      setError('Could not load bookings. Please verify Firestore security rules allow admin access.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const runInitialLoad = async () => {
      try {
        let docsList = [];
        try {
          const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            docsList.push({ id: doc.id, ...doc.data() });
          });
        } catch {
          const fallbackSnapshot = await getDocs(collection(db, 'bookings'));
          fallbackSnapshot.forEach((doc) => {
            docsList.push({ id: doc.id, ...doc.data() });
          });
          docsList.sort((a, b) => {
            const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
            const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
            return tB - tA;
          });
        }
        if (!isCancelled) {
          setBookings(docsList);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load bookings for Admin:', err);
          setError('Could not load bookings. Please verify Firestore security rules allow admin access.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    runInitialLoad();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllBookings();
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    let confirmed = 0;
    let cancelled = 0;
    let revenue = 0;

    bookings.forEach((b) => {
      const isCanc = b.status === 'CANCELLED';
      if (isCanc) {
        cancelled++;
      } else {
        confirmed++;
        revenue += Number(b.totalAmountPaid || 0);
      }
    });

    return { total, confirmed, cancelled, revenue };
  }, [bookings]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status Filter
      if (statusFilter !== 'all') {
        const isCanc = b.status === 'CANCELLED';
        if (statusFilter === 'CONFIRMED' && isCanc) return false;
        if (statusFilter === 'CANCELLED' && !isCanc) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pnr = b.id ? b.id.toLowerCase() : '';
        const flightNum = b.flight?.flightNumber ? b.flight.flightNumber.toLowerCase() : '';
        const airline = b.flight?.airline ? b.flight.airline.toLowerCase() : '';
        const origin = b.flight?.origin ? b.flight.origin.toLowerCase() : '';
        const dest = b.flight?.destination ? b.flight.destination.toLowerCase() : '';
        const status = b.status ? b.status.toLowerCase() : '';
        const userEmail = b.userId ? b.userId.toLowerCase() : '';

        // Check passenger names
        let passengerMatch = false;
        if (Array.isArray(b.passengers?.list)) {
          passengerMatch = b.passengers.list.some(p =>
            `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q)
          );
        } else if (b.passengers?.firstName || b.passengers?.lastName) {
          passengerMatch = `${b.passengers.firstName || ''} ${b.passengers.lastName || ''}`.toLowerCase().includes(q);
        }

        const match =
          pnr.includes(q) ||
          flightNum.includes(q) ||
          airline.includes(q) ||
          origin.includes(q) ||
          dest.includes(q) ||
          status.includes(q) ||
          userEmail.includes(q) ||
          passengerMatch;

        if (!match) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter]);

  const formatDate = (rawDate) => {
    if (!rawDate) return 'N/A';
    try {
      const dateObj = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getPrimaryPassenger = (passengers) => {
    if (!passengers) return '1 Passenger';
    if (Array.isArray(passengers.list) && passengers.list.length > 0) {
      const primary = passengers.list[0];
      const count = passengers.list.length;
      return `${primary.firstName || ''} ${primary.lastName || ''}${count > 1 ? ` (+${count - 1})` : ''}`.trim() || 'Passenger';
    }
    if (passengers.firstName || passengers.lastName) {
      return `${passengers.firstName || ''} ${passengers.lastName || ''}`.trim() || 'Passenger';
    }
    return '1 Passenger';
  };

  return (
    <div className="admin-dashboard-container animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', color: '#fff' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.25rem 1.5rem',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>
              Aero Space <span style={{ color: '#fbbf24' }}>Admin Command Center</span>
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Global flight bookings, system revenue telemetry & order management
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#fbbf24' }} />
            <span>Refresh</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
              <span>Exit Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          fontSize: '0.88rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Bookings */}
        <div style={{
          background: 'var(--surface-color)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>TOTAL BOOKINGS</span>
            <Layers size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {isLoading ? '...' : metrics.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            All-time customer transactions
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div style={{
          background: 'var(--surface-color)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>CONFIRMED</span>
            <CheckCircle2 size={18} style={{ color: 'var(--success-color)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-color)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {isLoading ? '...' : metrics.confirmed}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active tickets & verified passengers
          </div>
        </div>

        {/* Cancelled Bookings */}
        <div style={{
          background: 'var(--surface-color)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>CANCELLED</span>
            <XCircle size={18} style={{ color: 'var(--danger-color)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--danger-color)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {isLoading ? '...' : metrics.cancelled}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Seats released back to inventory
          </div>
        </div>

        {/* Total Revenue */}
        <div style={{
          background: 'var(--surface-color)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span>TOTAL REVENUE (INR)</span>
            <IndianRupee size={18} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning-color)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {isLoading ? '...' : `₹${metrics.revenue.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Net confirmed gross earnings
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        background: 'var(--surface-color)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--surface-border)',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search PNR, route, passenger, airline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 34px',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Filter size={13} /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'all' ? '1px solid var(--warning-color)' : '1px solid var(--surface-border)',
              background: statusFilter === 'all' ? 'var(--warning-bg)' : 'var(--surface-subtle)',
              color: statusFilter === 'all' ? 'var(--warning-color)' : 'var(--text-secondary)'
            }}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'CONFIRMED' ? '1px solid var(--success-color)' : '1px solid var(--surface-border)',
              background: statusFilter === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--surface-subtle)',
              color: statusFilter === 'CONFIRMED' ? 'var(--success-color)' : 'var(--text-secondary)'
            }}
          >
            Confirmed ({metrics.confirmed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'CANCELLED' ? '1px solid var(--danger-color)' : '1px solid var(--surface-border)',
              background: statusFilter === 'CANCELLED' ? 'var(--danger-bg)' : 'var(--surface-subtle)',
              color: statusFilter === 'CANCELLED' ? 'var(--danger-color)' : 'var(--text-secondary)'
            }}
          >
            Cancelled ({metrics.cancelled})
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div style={{
        background: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.76rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1rem' }}>PNR / ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Flight & Route</th>
                <th style={{ padding: '0.85rem 1rem' }}>Passenger(s)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date Booked</th>
                <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block', color: '#fbbf24' }} />
                    Loading flight bookings from Firestore...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={32} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const pnr = b.id ? b.id.substring(0, 6).toUpperCase() : 'N/A';
                  const isCancelled = b.status === 'CANCELLED';

                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s ease',
                        background: isCancelled ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isCancelled ? 'rgba(239, 68, 68, 0.04)' : 'transparent'}
                    >
                      {/* PNR / ID */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.5px' }}>
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          #{pnr}
                        </span>
                      </td>

                      {/* Flight & Route */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <Plane size={14} style={{ color: 'var(--accent-color)' }} />
                          <span>{b.flight?.airline} {b.flight?.flightNumber}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {b.flight?.origin || '---'} → {b.flight?.destination || '---'} &bull; {b.selectedClass?.name || 'Economy'}
                        </div>
                      </td>

                      {/* Passenger */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <User size={14} style={{ color: 'var(--accent-color)' }} />
                          <span>{getPrimaryPassenger(b.passengers)}</span>
                        </div>
                        {b.userId && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            UID: {b.userId.substring(0, 10)}...
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} style={{ color: '#94a3b8' }} />
                          <span>{formatDate(b.createdAt)}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>
                        ₹{Number(b.totalAmountPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          background: isCancelled ? 'rgba(239, 68, 68, 0.16)' : 'rgba(34, 197, 94, 0.16)',
                          color: isCancelled ? '#f87171' : '#4ade80',
                          border: isCancelled ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(34, 197, 94, 0.35)'
                        }}>
                          {isCancelled ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                          {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

