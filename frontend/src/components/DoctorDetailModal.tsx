import React from 'react';
import {
  X,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { Doctor } from '../types';

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onBook: (doctor: Doctor) => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({ doctor, onClose, onBook }) => {
  if (!doctor) return null;

  const fallbackAvatar = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Doctor Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Doctor Main Info */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <img
              src={doctor.image_url || fallbackAvatar}
              alt={doctor.name}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '2px solid var(--color-primary)',
                boxShadow: 'var(--shadow-glow)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {doctor.name}
                </h3>
                <span className="badge badge-emerald">
                  <ShieldCheck size={11} /> Verified
                </span>
              </div>
              <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>
                {doctor.specialization}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                <Building2 size={14} />
                <span>{doctor.hospital_name} • {doctor.department_name}</span>
              </div>
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Experience</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontWeight: 700, marginTop: '2px' }}>
                <Award size={14} color="var(--color-accent-amber)" />
                <span>{doctor.experience_years} Years</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Consultation</span>
              <div style={{ fontWeight: 800, color: 'var(--color-accent-emerald)', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                ${Number(doctor.consultation_fee).toFixed(2)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</span>
              <div style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
                Active
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {doctor.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Phone size={14} color="var(--color-primary)" />
                <span>{doctor.phone}</span>
              </div>
            )}
            {doctor.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Mail size={14} color="var(--color-primary)" />
                <span>{doctor.email}</span>
              </div>
            )}
          </div>

          {/* Recurring Schedule */}
          {doctor.schedules && doctor.schedules.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} color="var(--color-primary)" />
                <span>Weekly Consultation Schedule</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {doctor.schedules.map((sch) => (
                  <div
                    key={sch.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-input)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sch.day_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <Clock size={13} />
                      <span>{sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}</span>
                      <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
                        {sch.slot_duration_minutes}m slots
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ paddingTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBook(doctor);
              }}
              className="btn btn-primary btn-lg"
              style={{ flex: 2 }}
            >
              <Calendar size={18} />
              <span>Select Date & Slot</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
