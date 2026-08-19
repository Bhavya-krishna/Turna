import React, { useEffect, useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, Stethoscope, ChevronRight, ShieldCheck } from 'lucide-react';
import type { Hospital, Department } from '../types';
import { api } from '../services/api';

interface HospitalDetailModalProps {
  hospital: Hospital | null;
  onClose: () => void;
  onSelectDepartment: (deptId: number) => void;
  onViewDoctors: (hospitalId: number) => void;
}

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  hospital,
  onClose,
  onSelectDepartment,
  onViewDoctors,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  useEffect(() => {
    if (hospital) {
      if (hospital.departments && hospital.departments.length > 0) {
        setDepartments(hospital.departments);
      } else {
        setIsLoadingDepts(true);
        api
          .getHospitalDepartments(hospital.id)
          .then((res) => {
            const list = Array.isArray(res) ? res : res.results || [];
            setDepartments(list);
          })
          .catch((err) => {
            console.error('Error fetching hospital departments:', err);
          })
          .finally(() => setIsLoadingDepts(false));
      }
    }
  }, [hospital]);

  if (!hospital) return null;

  const fallbackImage = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header with Hospital Banner */}
        <div style={{ position: 'relative', height: '180px', width: '100%' }}>
          <img
            src={hospital.image_url || fallbackImage}
            alt={hospital.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(8, 13, 26, 0.95) 0%, rgba(8, 13, 26, 0.3) 100%)',
            }}
          />
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.4)',
              color: '#FFFFFF',
            }}
          >
            <X size={18} />
          </button>
          <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '0.4rem' }}>
              <ShieldCheck size={12} /> Certified Medical Center
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>{hospital.name}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Location & Contact Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Address</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <MapPin size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{hospital.address}, {hospital.city}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Direct Contact</span>
              {hospital.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                  <Phone size={14} /> <span>{hospital.phone}</span>
                </div>
              )}
              {hospital.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <Mail size={14} /> <span>{hospital.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Departments List */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Medical Departments ({departments.length})
            </h3>

            {isLoadingDepts ? (
              <div className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />
            ) : departments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No specific departments listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    onClick={() => {
                      onSelectDepartment(dept.id);
                      onClose();
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--color-primary)" />
                        <span>{dept.name}</span>
                      </div>
                      {dept.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                          {dept.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        <Stethoscope size={11} /> {dept.doctors_count || 0} Doctors
                      </span>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{ paddingTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Close
            </button>
            <button
              onClick={() => {
                onViewDoctors(hospital.id);
                onClose();
              }}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Stethoscope size={16} />
              <span>View All Doctors in {hospital.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
