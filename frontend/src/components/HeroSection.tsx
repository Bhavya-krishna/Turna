import React from 'react';
import { Search, MapPin, Sparkles, ShieldCheck, Clock, CheckCircle2, HeartPulse } from 'lucide-react';

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (specialty: string) => void;
  cities: string[];
  specialties: string[];
  totalHospitals: number;
  totalDoctors: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  selectedSpecialty,
  setSelectedSpecialty,
  cities,
  specialties,
  totalHospitals,
  totalDoctors,
}) => {
  return (
    <section
      style={{
        position: 'relative',
        padding: '3rem 0 2rem',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.18) 0%, rgba(6, 214, 160, 0.08) 50%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          {/* Top Pill Tag */}
          <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
            <span
              className="badge badge-primary"
              style={{
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.25)',
              }}
            >
              <Sparkles size={14} /> Turna Next-Gen Healthcare Scheduling
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 5vw, 3.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Skip the Waiting Room.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-emerald) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Book in Seconds.
            </span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Connect with certified doctors across premier hospitals. Real-time availability, instant slot locking, and automated reminders.
          </p>

          {/* Unified Search Glass Box */}
          <div
            className="glass-card"
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              boxShadow: 'var(--glass-shadow)',
              marginBottom: '2rem',
            }}
          >
            {/* Search Term Input */}
            <div
              style={{
                flex: '2 1 240px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--bg-input)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Search size={20} color="var(--color-primary)" />
              <input
                type="text"
                placeholder="Search doctors, hospitals, or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.95rem',
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* City Selector */}
            <div
              style={{
                flex: '1 1 180px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--bg-input)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <MapPin size={20} color="var(--color-accent-emerald)" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: 'var(--bg-surface-elevated)' }}>All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city} style={{ background: 'var(--bg-surface-elevated)' }}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              className="btn btn-primary"
              style={{
                flex: '0 0 auto',
                padding: '0.75rem 1.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
              }}
            >
              <Search size={18} />
              <span>Explore</span>
            </button>
          </div>

          {/* Specialty Quick Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setSelectedSpecialty('')}
              className={`btn btn-sm ${selectedSpecialty === '' ? 'btn-emerald' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}
            >
              <HeartPulse size={14} /> All Specialties
            </button>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(selectedSpecialty === spec ? '' : spec)}
                className={`btn btn-sm ${selectedSpecialty === spec ? 'btn-emerald' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Key Value Metric Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}>
                <ShieldCheck size={18} />
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>100%</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Row-Lock Concurrency</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-accent-emerald)' }}>
                <Clock size={18} />
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>&lt; 30s</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Instant Confirmation</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-accent-amber)' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{totalHospitals}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Partner Hospitals</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-accent-blue)' }}>
                <HeartPulse size={18} />
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{totalDoctors}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Verified Specialists</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
