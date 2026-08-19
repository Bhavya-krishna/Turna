import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Doctor, AppointmentSlot, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface BookingModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose, onBookingSuccess }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const toast = useToast();

  // Steps: 'select-slot' -> 'patient-details' -> 'payment' -> 'confirmed'
  const [step, setStep] = useState<'select-slot' | 'patient-details' | 'payment' | 'confirmed'>('select-slot');

  // Dates state
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; label: string; dayName: string; dayNum: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName;
      dates.push({ dateStr, label, dayName, dayNum });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]?.dateStr || '');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);

  // Patient Info Form
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Payment & Booking Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Sync user details when modal opens
  useEffect(() => {
    if (user) {
      setPatientName(user.name || user.email.split('@')[0]);
      setPatientPhone(user.phone || '');
    }
  }, [user]);

  // Fetch slots for doctor and selected date
  useEffect(() => {
    if (!doctor || !selectedDate) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);

    api
      .getDoctorSlots(doctor.id, selectedDate)
      .then((res) => {
        const slotsList = Array.isArray(res) ? res : res.results || [];
        setSlots(slotsList);
      })
      .catch((err) => {
        console.error('Error fetching slots:', err);
        toast.error('Could not load slots', err.message);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [doctor, selectedDate]);

  if (!doctor) return null;

  // Filter slots into Morning / Afternoon / Evening
  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    const morning: AppointmentSlot[] = [];
    const afternoon: AppointmentSlot[] = [];
    const evening: AppointmentSlot[] = [];

    slots.forEach((s) => {
      const hour = parseInt(s.start_time.split(':')[0], 10);
      if (hour < 12) morning.push(s);
      else if (hour < 17) afternoon.push(s);
      else evening.push(s);
    });

    return { morningSlots: morning, afternoonSlots: afternoon, eveningSlots: evening };
  }, [slots]);

  const handleSlotSelect = (slot: AppointmentSlot) => {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedSlot(slot);
  };

  const handleProceedToDetails = () => {
    if (!selectedSlot) {
      toast.warning('Select a Time Slot', 'Please click an available time slot to continue.');
      return;
    }
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setStep('patient-details');
  };

  const handleProceedToPayment = () => {
    if (!patientName.trim()) {
      toast.warning('Name Required', 'Please enter patient name.');
      return;
    }
    if (!patientPhone.trim()) {
      toast.warning('Phone Required', 'Please enter a contact phone number.');
      return;
    }
    setStep('payment');
  };

  const handleConfirmAndPay = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);

    try {
      // Step 1: Initiate Payment Order
      const paymentOrder = await api.initiatePayment(selectedSlot.id);

      // Step 2: Book slot with concurrency-safe transaction
      const booking = await api.createBooking({
        slot_id: selectedSlot.id,
        patient_name: patientName,
        patient_phone: patientPhone,
        notes,
        payment_id: `pay_demo_${Date.now()}`,
        payment_order_id: paymentOrder.order_id,
        payment_signature: 'sig_mock_verified',
      });

      setConfirmedBooking(booking);
      setStep('confirmed');
      if (onBookingSuccess) onBookingSuccess(booking);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      toast.success('Appointment Confirmed!', `Booked with ${doctor.name} for ${selectedSlot.date}`);
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('no longer available') || err.message?.includes('locked')) {
        toast.error('Slot Conflict', 'This slot was just booked by another user. Please choose another time.');
        setStep('select-slot');
        // Refresh slots
        api.getDoctorSlots(doctor.id, selectedDate).then((res) => {
          setSlots(Array.isArray(res) ? res : res.results || []);
        });
      } else {
        toast.error('Booking Failed', err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeDisplay = (timeStr: string) => {
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {step === 'confirmed' ? 'Appointment Confirmed' : 'Book Appointment'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {doctor.name} • {doctor.specialization}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-full)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Doctor Summary Strip */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'var(--bg-input)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <Building2 size={14} color="var(--color-primary)" />
            <span>{doctor.hospital_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <Stethoscope size={14} color="var(--color-accent-emerald)" />
            <span>{doctor.department_name}</span>
          </div>
          <div style={{ fontWeight: 800, color: 'var(--color-accent-emerald)', fontSize: '0.95rem' }}>
            Fee: ${Number(doctor.consultation_fee).toFixed(2)}
          </div>
        </div>

        {/* Step Progress Bar */}
        {step !== 'confirmed' && (
          <div style={{ display: 'flex', padding: '0.75rem 1.5rem', background: 'var(--bg-surface-elevated)', gap: '0.5rem' }}>
            <div
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: 'var(--color-primary)',
              }}
            />
            <div
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step === 'patient-details' || step === 'payment' ? 'var(--color-primary)' : 'var(--border-subtle)',
              }}
            />
            <div
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step === 'payment' ? 'var(--color-primary)' : 'var(--border-subtle)',
              }}
            />
          </div>
        )}

        {/* Modal Body: STEP 1 - Select Slot */}
        {step === 'select-slot' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Date Selection Strip */}
            <div>
              <label className="input-label" style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} color="var(--color-primary)" />
                <span>Select Appointment Date</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem',
                }}
              >
                {availableDates.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      style={{
                        flex: '0 0 75px',
                        padding: '0.6rem 0.4rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isSelected ? '0 4px 15px rgba(0, 180, 216, 0.35)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85 }}>{d.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{d.dayNum}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={15} color="var(--color-accent-emerald)" />
                  <span>Available Time Slots</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {slots.filter((s) => s.status === 'AVAILABLE').length} Available
                </span>
              </div>

              {isLoadingSlots ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="skeleton" style={{ height: '80px', width: '100%', marginBottom: '0.5rem' }} />
                  <span>Loading available slots...</span>
                </div>
              ) : slots.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <AlertCircle size={28} color="var(--color-accent-amber)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No slots available for this date</p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Please select another date above or check other specialists.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Morning Slots */}
                  {morningSlots.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Morning Slots
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {morningSlots.map((s) => {
                          const isSelected = selectedSlot?.id === s.id;
                          const isAvailable = s.status === 'AVAILABLE';
                          return (
                            <button
                              key={s.id}
                              disabled={!isAvailable}
                              onClick={() => handleSlotSelect(s)}
                              style={{
                                padding: '0.55rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected
                                  ? 'var(--color-accent-emerald)'
                                  : isAvailable
                                  ? 'var(--bg-input)'
                                  : 'rgba(255, 255, 255, 0.02)',
                                color: isSelected
                                  ? '#080D1A'
                                  : isAvailable
                                  ? 'var(--text-primary)'
                                  : 'var(--text-muted)',
                                border: isSelected
                                  ? '1px solid var(--color-accent-emerald)'
                                  : isAvailable
                                  ? '1px solid var(--border-strong)'
                                  : '1px solid var(--border-subtle)',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                transition: 'all var(--transition-fast)',
                                opacity: isAvailable ? 1 : 0.45,
                              }}
                            >
                              {formatTimeDisplay(s.start_time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Slots */}
                  {afternoonSlots.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Afternoon Slots
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {afternoonSlots.map((s) => {
                          const isSelected = selectedSlot?.id === s.id;
                          const isAvailable = s.status === 'AVAILABLE';
                          return (
                            <button
                              key={s.id}
                              disabled={!isAvailable}
                              onClick={() => handleSlotSelect(s)}
                              style={{
                                padding: '0.55rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected
                                  ? 'var(--color-accent-emerald)'
                                  : isAvailable
                                  ? 'var(--bg-input)'
                                  : 'rgba(255, 255, 255, 0.02)',
                                color: isSelected
                                  ? '#080D1A'
                                  : isAvailable
                                  ? 'var(--text-primary)'
                                  : 'var(--text-muted)',
                                border: isSelected
                                  ? '1px solid var(--color-accent-emerald)'
                                  : isAvailable
                                  ? '1px solid var(--border-strong)'
                                  : '1px solid var(--border-subtle)',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                transition: 'all var(--transition-fast)',
                                opacity: isAvailable ? 1 : 0.45,
                              }}
                            >
                              {formatTimeDisplay(s.start_time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evening Slots */}
                  {eveningSlots.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Evening Slots
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {eveningSlots.map((s) => {
                          const isSelected = selectedSlot?.id === s.id;
                          const isAvailable = s.status === 'AVAILABLE';
                          return (
                            <button
                              key={s.id}
                              disabled={!isAvailable}
                              onClick={() => handleSlotSelect(s)}
                              style={{
                                padding: '0.55rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected
                                  ? 'var(--color-accent-emerald)'
                                  : isAvailable
                                  ? 'var(--bg-input)'
                                  : 'rgba(255, 255, 255, 0.02)',
                                color: isSelected
                                  ? '#080D1A'
                                  : isAvailable
                                  ? 'var(--text-primary)'
                                  : 'var(--text-muted)',
                                border: isSelected
                                  ? '1px solid var(--color-accent-emerald)'
                                  : isAvailable
                                  ? '1px solid var(--border-strong)'
                                  : '1px solid var(--border-subtle)',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                transition: 'all var(--transition-fast)',
                                opacity: isAvailable ? 1 : 0.45,
                              }}
                            >
                              {formatTimeDisplay(s.start_time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 1 Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                {selectedSlot && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-emerald)', fontWeight: 600 }}>
                    Selected: {formatTimeDisplay(selectedSlot.start_time)} on {selectedSlot.date}
                  </span>
                )}
              </div>
              <button
                disabled={!selectedSlot}
                onClick={handleProceedToDetails}
                className="btn btn-primary"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: STEP 2 - Patient Details */}
        {step === 'patient-details' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Patient Information</h3>

            <div className="input-group">
              <label className="input-label">Patient Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Alice Jenkins"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Contact Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. +1 555 0192"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Consultation Notes / Symptoms (Optional)</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Briefly describe your symptoms or medical concerns..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ paddingLeft: '2.5rem', resize: 'none' }}
                />
                <FileText size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '1rem' }} />
              </div>
            </div>

            {/* Step 2 Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setStep('select-slot')} className="btn btn-ghost">
                Back to Slots
              </button>
              <button onClick={handleProceedToPayment} className="btn btn-primary">
                <span>Proceed to Payment</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: STEP 3 - Payment & Review */}
        {step === 'payment' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Review & Complete Payment</h3>

            {/* Summary Bill Box */}
            <div
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Doctor</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doctor.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedSlot?.date} • {selectedSlot && formatTimeDisplay(selectedSlot.start_time)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Patient</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{patientName} ({patientPhone})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hospital</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doctor.hospital_name}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Total Amount</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-accent-emerald)', fontFamily: 'var(--font-display)' }}>
                  ${Number(doctor.consultation_fee).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-light)',
                border: '1px solid rgba(0, 180, 216, 0.3)',
              }}
            >
              <CreditCard size={20} color="var(--color-primary)" />
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                <strong>Razorpay Test Mode Active:</strong> Instant mock authorization enabled for guaranteed booking.
              </div>
            </div>

            {/* Step 3 Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setStep('patient-details')} className="btn btn-ghost" disabled={isSubmitting}>
                Back
              </button>
              <button
                onClick={handleConfirmAndPay}
                disabled={isSubmitting}
                className="btn btn-emerald btn-lg"
                style={{ flex: '1', maxWidth: '280px' }}
              >
                {isSubmitting ? (
                  <span>Securing Slot...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Pay & Confirm Slot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: STEP 4 - Confirmation View */}
        {step === 'confirmed' && confirmedBooking && (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--color-accent-emerald-light)',
                color: 'var(--color-accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: 'var(--shadow-emerald-glow)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Booking Confirmed!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Your appointment reference ID is <strong>#{confirmedBooking.id}</strong>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>
                <span style={{ fontWeight: 600 }}>{confirmedBooking.doctor_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hospital:</span>
                <span style={{ fontWeight: 600 }}>{confirmedBooking.hospital_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Appointment Date:</span>
                <span style={{ fontWeight: 600 }}>{confirmedBooking.slot_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time:</span>
                <span style={{ fontWeight: 600 }}>{formatTimeDisplay(confirmedBooking.slot_start_time)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="badge badge-emerald">CONFIRMED</span>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} color="var(--color-primary)" />
              <span>A reminder email and 30-min alert have been scheduled.</span>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Done & View Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
