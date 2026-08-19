import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  Stethoscope,
  XCircle,
  Building2,
  Receipt,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import type { Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AppointmentsListProps {
  onExploreDoctors: () => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({ onExploreDoctors }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const toast = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'cancelled'>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchBookings = () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api
      .getMyBookings()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setBookings(list);
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err);
        toast.error('Could not fetch bookings', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, [isAuthenticated]);

  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Are you sure you want to cancel appointment #${booking.id} with ${booking.doctor_name}? The slot will be released back to the hospital schedule.`)) {
      return;
    }

    setCancellingId(booking.id);
    try {
      await api.cancelBooking(booking.id);
      toast.success('Appointment Cancelled', 'The slot has been released and your payment status refunded.');
      // Refresh bookings list
      fetchBookings();
    } catch (err: any) {
      toast.error('Cancellation Failed', err.message || 'Could not cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'upcoming') return b.status === 'CONFIRMED';
    if (filterTab === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div
          className="glass-card"
          style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <CalendarCheck size={48} color="var(--color-primary)" style={{ margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Your Bookings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Please sign in to view your scheduled hospital appointments and manage bookings.
          </p>
          <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1rem 1.5rem 3rem' }}>
      {/* Header and Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            My Appointments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage your scheduled doctor appointments, view receipts, and track reminders.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={fetchBookings} className="btn btn-ghost" title="Refresh bookings">
            <RefreshCw size={16} />
          </button>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-elevated)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`btn btn-sm ${filterTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              Upcoming ({bookings.filter((b) => b.status === 'CONFIRMED').length})
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilterTab('cancelled')}
              className={`btn btn-sm ${filterTab === 'cancelled' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              Cancelled ({bookings.filter((b) => b.status === 'CANCELLED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No Appointments Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.92rem' }}>
            {filterTab === 'upcoming'
              ? "You don't have any upcoming doctor appointments scheduled."
              : 'No appointments match this filter.'}
          </p>
          <button onClick={onExploreDoctors} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Explore Doctors & Book Slot
          </button>
        </div>
      ) : (
        /* Bookings List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const isCancelled = b.status === 'CANCELLED';

            return (
              <div
                key={b.id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  borderLeft: isConfirmed
                    ? '4px solid var(--color-accent-emerald)'
                    : isCancelled
                    ? '4px solid var(--color-accent-coral)'
                    : '4px solid var(--color-primary)',
                }}
              >
                {/* Left: Doctor & Hospital Details */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flex: '2 1 300px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      background: isConfirmed ? 'var(--color-accent-emerald-light)' : 'var(--badge-bg)',
                      color: isConfirmed ? 'var(--color-accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Stethoscope size={24} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {b.doctor_name}
                      </h3>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {b.doctor_specialization}
                      </span>
                      <span
                        className={`badge ${
                          isConfirmed ? 'badge-emerald' : isCancelled ? 'badge-coral' : 'badge-amber'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={13} color="var(--color-primary)" />
                        <span>
                          {b.hospital_name} ({b.hospital_city}) • {b.department_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Receipt size={13} />
                        <span>Booking ID: #{b.id} • Paid: ${Number(b.amount_paid).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center: Appointment Date & Time Box */}
                <div
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    flex: '1 1 180px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                    <Calendar size={16} color="var(--color-primary)" />
                    <span>{b.slot_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent-emerald)', fontWeight: 600, fontSize: '0.88rem' }}>
                    <Clock size={15} />
                    <span>
                      {formatTimeDisplay(b.slot_start_time)} - {formatTimeDisplay(b.slot_end_time)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions (Cancel Booking) */}
                {isConfirmed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
                    <button
                      disabled={cancellingId === b.id}
                      onClick={() => handleCancelBooking(b)}
                      className="btn btn-danger btn-sm"
                    >
                      <XCircle size={15} />
                      <span>{cancellingId === b.id ? 'Releasing...' : 'Cancel'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
