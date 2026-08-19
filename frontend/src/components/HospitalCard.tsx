import React from 'react';
import { MapPin, Phone, Mail, Stethoscope, Building2, ChevronRight, ShieldCheck } from 'lucide-react';
import type { Hospital } from '../types';

interface HospitalCardProps {
  hospital: Hospital;
  onSelectHospital: (hospital: Hospital) => void;
  onViewDoctors: (hospitalId: number) => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onSelectHospital, onViewDoctors }) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Image Header with City Badge */}
      <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
        <img
          src={hospital.image_url || fallbackImage}
          alt={hospital.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform var(--transition-slow)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8, 13, 26, 0.9) 0%, rgba(8, 13, 26, 0.1) 60%, transparent 100%)',
          }}
        />
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> Verified
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: '0.85rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-primary" style={{ background: 'rgba(0, 180, 216, 0.3)' }}>
            <MapPin size={12} /> {hospital.city}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            {hospital.name}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: '3px' }} color="var(--color-primary)" />
            <span>{hospital.address}</span>
          </p>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
            <Building2 size={15} color="var(--color-primary)" />
            <span><strong>{hospital.departments_count || 0}</strong> Depts</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
            <Stethoscope size={15} color="var(--color-accent-emerald)" />
            <span><strong>{hospital.doctors_count || 0}</strong> Doctors</span>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {hospital.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={13} /> <span>{hospital.phone}</span>
            </div>
          )}
          {hospital.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={13} /> <span>{hospital.email}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onSelectHospital(hospital)}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            Details
          </button>
          <button
            onClick={() => onViewDoctors(hospital.id)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1.5 }}
          >
            <span>View Doctors</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
