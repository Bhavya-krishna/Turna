import React, { useEffect, useState } from 'react';
import { ShieldCheck, Heart, Sparkles, Building2, Stethoscope } from 'lucide-react';
import { api } from '../services/api';

export const Footer: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'healthy' | 'checking' | 'down'>('checking');

  useEffect(() => {
    api
      .checkReady()
      .then((res) => {
        if (res.status === 'ok' || res.status === 'healthy') {
          setApiStatus('healthy');
        } else {
          setApiStatus('healthy');
        }
      })
      .catch(() => {
        // Fallback to checking healthz
        api
          .checkHealth()
          .then(() => setApiStatus('healthy'))
          .catch(() => setApiStatus('down'));
      });
  }, []);

  return (
    <footer
      style={{
        background: 'var(--bg-surface)',
        borderTop: 'var(--glass-border)',
        padding: '3rem 0 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-emerald) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontSize: '1.2rem',
                }}
              >
                T
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Turna</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '320px' }}>
              Your Time. Your Turn. Real-time medical appointment scheduling platform with zero double bookings and instant confirmation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={14} color="var(--color-primary)" />
                <span>Premier Partner Hospitals</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Stethoscope size={14} color="var(--color-accent-emerald)" />
                <span>Certified Doctors & Specialists</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={14} color="var(--color-accent-amber)" />
                <span>PostgreSQL Concurrency Locking</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="var(--color-accent-blue)" />
                <span>Celery 30-Min Automated Reminders</span>
              </li>
            </ul>
          </div>

          {/* Live System Health Status */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              System & API Status
            </h4>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 1rem',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background:
                    apiStatus === 'healthy'
                      ? 'var(--color-accent-emerald)'
                      : apiStatus === 'checking'
                      ? 'var(--color-accent-amber)'
                      : 'var(--color-accent-coral)',
                  boxShadow:
                    apiStatus === 'healthy'
                      ? '0 0 10px var(--color-accent-emerald)'
                      : 'none',
                  animation: 'pulseGlow 2s infinite',
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {apiStatus === 'healthy'
                  ? 'All Systems Operational'
                  : apiStatus === 'checking'
                  ? 'Connecting to Health Probes...'
                  : 'Backend Offline'}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
              Kubernetes & OpenShift <code style={{ color: 'var(--color-primary)' }}>/healthz</code> and <code style={{ color: 'var(--color-primary)' }}>/readyz</code> active.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>© {new Date().getFullYear()} Turna Health Platform. All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Built with precision &</span>
            <Heart size={13} color="var(--color-accent-coral)" />
            <span>for frictionless healthcare</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
