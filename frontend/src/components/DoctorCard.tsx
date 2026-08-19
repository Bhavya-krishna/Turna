import React from 'react';
import { Calendar, Award, Building2, Stethoscope, ChevronRight } from 'lucide-react';
import type { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
  onViewDetails: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook, onViewDetails }) => {
  const fallbackAvatar = `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80`;

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        gap: '1rem',
        position: 'relative',
      }}
    >
      {/* Top Header: Avatar & Key Info */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={doctor.image_url || fallbackAvatar}
            alt={doctor.name}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              border: '2px solid var(--color-primary)',
              boxShadow: '0 4px 15px rgba(0, 180, 216, 0.25)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--color-accent-emerald)',
              border: '2px solid var(--bg-surface-elevated)',
            }}
            title="Available for Appointments"
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {doctor.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              <Stethoscope size={11} /> {doctor.specialization}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Building2 size={13} color="var(--color-primary)" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {doctor.hospital_name} {doctor.hospital_city ? `(${doctor.hospital_city})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Specs: Department, Experience, Consultation Fee */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Experience</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Award size={14} color="var(--color-accent-amber)" />
            <span>{doctor.experience_years} Years</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Consultation Fee</span>
          <div style={{ fontWeight: 800, color: 'var(--color-accent-emerald)', fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
            ${Number(doctor.consultation_fee).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
        <button
          onClick={() => onViewDetails(doctor)}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          Profile
        </button>
        <button
          onClick={() => onBook(doctor)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1.6 }}
        >
          <Calendar size={14} />
          <span>Book Slot</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
