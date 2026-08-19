import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HospitalCard } from './components/HospitalCard';
import { DoctorCard } from './components/DoctorCard';
import { BookingModal } from './components/BookingModal';
import { HospitalDetailModal } from './components/HospitalDetailModal';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { AppointmentsList } from './components/AppointmentsList';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import type { Hospital, Doctor } from './types';
import { api } from './services/api';
import { Building2, Stethoscope, AlertCircle, RefreshCw } from 'lucide-react';

const TurnaApp: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'hospitals' | 'doctors' | 'bookings'>('hospitals');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<number | null>(null);

  // Data State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(true);

  // Active Modals
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [detailHospital, setDetailHospital] = useState<Hospital | null>(null);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);

  // Fetch Hospitals
  const fetchHospitals = () => {
    setIsLoadingHospitals(true);
    api
      .getHospitals({ search: searchTerm, city: selectedCity })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setHospitals(list);
      })
      .catch((err) => {
        console.error('Error fetching hospitals:', err);
        toast.error('Failed to load hospitals', err.message);
      })
      .finally(() => setIsLoadingHospitals(false));
  };

  // Fetch Doctors
  const fetchDoctors = () => {
    setIsLoadingDoctors(true);
    api
      .getDoctors({
        search: searchTerm,
        hospital: selectedHospitalFilter || undefined,
        specialization: selectedSpecialty || undefined,
      })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.results || [];
        setDoctors(list);
      })
      .catch((err) => {
        console.error('Error fetching doctors:', err);
        toast.error('Failed to load doctors', err.message);
      })
      .finally(() => setIsLoadingDoctors(false));
  };

  useEffect(() => {
    fetchHospitals();
  }, [searchTerm, selectedCity]);

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, selectedHospitalFilter, selectedSpecialty]);

  // Derived Cities and Specialties for Filter Dropdowns
  const cities = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => {
      if (h.city) set.add(h.city);
    });
    return Array.from(set).sort();
  }, [hospitals]);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Handlers for switching views & applying filters
  const handleViewHospitalDoctors = (hospitalId: number) => {
    setSelectedHospitalFilter(hospitalId);
    setActiveTab('doctors');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSelectDepartment = (_deptId: number) => {
    setActiveTab('doctors');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab !== 'bookings' && (
          <HeroSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            cities={cities}
            specialties={specialties}
            totalHospitals={hospitals.length}
            totalDoctors={doctors.length}
          />
        )}

        {/* View 1: Hospitals Explorer */}
        {activeTab === 'hospitals' && (
          <section className="container" style={{ paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={24} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Premier Partner Hospitals</h2>
                <span className="badge badge-primary">{hospitals.length} Hospitals</span>
              </div>
              <button onClick={fetchHospitals} className="btn btn-ghost btn-sm" title="Refresh hospitals">
                <RefreshCw size={15} />
              </button>
            </div>

            {isLoadingHospitals ? (
              <div className="grid-cards">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <AlertCircle size={36} color="var(--color-accent-amber)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Hospitals Found</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  Try changing your search keyword or selected city.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity('');
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid-cards">
                {hospitals.map((hospital) => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    onSelectHospital={(h) => setDetailHospital(h)}
                    onViewDoctors={handleViewHospitalDoctors}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* View 2: Doctors Directory & Real-time Slots */}
        {activeTab === 'doctors' && (
          <section className="container" style={{ paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Stethoscope size={24} color="var(--color-accent-emerald)" />
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Certified Specialists & Doctors</h2>
                <span className="badge badge-emerald">{doctors.length} Doctors</span>
              </div>

              {selectedHospitalFilter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filtered by hospital</span>
                  <button
                    onClick={() => setSelectedHospitalFilter(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-accent-coral)' }}
                  >
                    Clear Hospital Filter ✕
                  </button>
                </div>
              )}
            </div>

            {isLoadingDoctors ? (
              <div className="grid-cards">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <AlertCircle size={36} color="var(--color-accent-amber)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Doctors Match Criteria</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  Try adjusting your search terms or specialty filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecialty('');
                    setSelectedHospitalFilter(null);
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid-cards">
                {doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    onBook={(doc) => setBookingDoctor(doc)}
                    onViewDetails={(doc) => setDetailDoctor(doc)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* View 3: Patient Appointments Dashboard */}
        {activeTab === 'bookings' && (
          <AppointmentsList onExploreDoctors={() => setActiveTab('doctors')} />
        )}
      </main>

      <Footer />

      {/* Global Interactive Modals */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBookingSuccess={() => {
            // Can switch to bookings tab if desired
          }}
        />
      )}

      {detailHospital && (
        <HospitalDetailModal
          hospital={detailHospital}
          onClose={() => setDetailHospital(null)}
          onSelectDepartment={handleSelectDepartment}
          onViewDoctors={handleViewHospitalDoctors}
        />
      )}

      {detailDoctor && (
        <DoctorDetailModal
          doctor={detailDoctor}
          onClose={() => setDetailDoctor(null)}
          onBook={(doc) => {
            setDetailDoctor(null);
            setBookingDoctor(doc);
          }}
        />
      )}

      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TurnaApp />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
