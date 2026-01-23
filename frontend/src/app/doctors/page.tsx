'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Star, Clock, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BookingModal from '@/components/appointments/BookingModal';
import DoctorDetailsModal from '@/components/doctors/DoctorDetailsModal';
import ReviewsModal from '@/components/doctors/ReviewsModal';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Doctor {
  id: number;
  name?: string;
  specialization: string;
  experience: number;
  rating: number;
  totalReviews: number;
  consultationFee: number;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  hospital?: string;
  clinic?: string;
  isVerified: boolean;
  isActive: boolean;
}

import { Suspense } from 'react';

function DoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsDoctorId, setReviewsDoctorId] = useState<number | null>(null);

  const specializations = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Dermatology',
    'Orthopedics',
    'General Medicine',
    'Internal Medicine',
    'Family Medicine',
  ];

  // Read search query and doctor ID from URL on mount
  useEffect(() => {
    const urlSearch = searchParams?.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setSpecialization(urlSearch); // Use search query as specialization filter
    }

    // Check if there's a doctor ID in the URL (from search results)
    const doctorIdParam = searchParams?.get('id');
    if (doctorIdParam) {
      const doctorId = parseInt(doctorIdParam, 10);
      if (!isNaN(doctorId)) {
        // Open the doctor details modal
        setSelectedDoctorId(doctorId);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      // Use searchQuery if provided, otherwise use specialization
      const searchTerm = searchQuery || specialization;
      if (searchTerm) params.append('specialization', searchTerm);
      if (location) params.append('city', location);

      const response = await api.get(`/api/public/doctors/search?${params.toString()}`);
      const doctorsData = response.data.data.doctors || [];
      setDoctors(doctorsData);

      // Show API message if provided (e.g., database not available)
      if (response.data.message && doctorsData.length === 0) {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      const errorMsg = handleApiError(error);
      setErrorMessage(errorMsg);
      toast.error('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, specialization, location]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleBookAppointment = (doctor: Doctor) => {
    if (!isAuthenticated) {
      toast.error('Please login to book an appointment');
      router.push('/auth/login');
      return;
    }
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleViewDetails = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setShowDetailsModal(true);
  };

  const handleBookingSuccess = () => {
    toast.success('Appointment booked successfully!');
    // Optionally refresh doctors list or redirect
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find the Right Doctor for You
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Search by specialization, location, or experience
              </p>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="container-custom -mt-8 mb-12">
          <Card padding="lg" className="shadow-medium">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search doctors by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                />
              </div>
              <div>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="input"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  leftIcon={<MapPin className="w-5 h-5" />}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Results Section */}
        <section className="container-custom pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              {loading ? 'Loading...' : `${doctors.length} Doctors Found`}
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchDoctors}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading doctors..." />
            </div>
          ) : doctors.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              {errorMessage ? (
                <>
                  <p className="text-secondary-600 mb-2 font-medium">{errorMessage}</p>
                  <p className="text-sm text-secondary-500 mb-4">
                    If you're a doctor, please make sure your profile is created and active.
                  </p>
                </>
              ) : (
                <p className="text-secondary-600 mb-4">No doctors found matching your criteria.</p>
              )}
              <Button onClick={() => {
                setSearchQuery('');
                setSpecialization('');
                setLocation('');
                setErrorMessage(null);
              }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.id} hover padding="lg">
                  <div className="flex items-start space-x-4 mb-4">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage.startsWith('http') ? doctor.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${doctor.profileImage}`}
                        alt={doctor.name || doctor.specialization}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-primary-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-semibold text-lg">
                          {(doctor.name || doctor.specialization).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                        {doctor.name || `Dr. ${doctor.specialization}`}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-2">
                        {doctor.specialization}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewsDoctorId(doctor.id);
                          setShowReviewsModal(true);
                        }}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                        <span className="text-sm font-medium text-secondary-900">
                          {Number(doctor.rating).toFixed(1)}
                        </span>
                        <span className="text-sm text-secondary-500">
                          ({doctor.totalReviews || 0} reviews)
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {doctor.address?.city && (
                      <div className="flex items-center text-sm text-secondary-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {doctor.address.city}
                        {doctor.address.state && `, ${doctor.address.state}`}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-secondary-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {doctor.experience} years experience
                    </div>
                    {doctor.hospital && (
                      <div className="text-sm text-secondary-500">
                        {doctor.hospital}
                      </div>
                    )}
                    {doctor.clinic && (
                      <div className="text-sm text-secondary-500">
                        {doctor.clinic}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                    <div>
                      <p className="text-sm text-secondary-600">Consultation Fee</p>
                      <p className="text-lg font-semibold text-secondary-900">
                        ৳{Number(doctor.consultationFee).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(doctor.id)}
                      >
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => handleBookAppointment(doctor)}>
                        Book Appointment
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {doctor.isVerified ? (
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
        onSuccess={handleBookingSuccess}
      />

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDoctorId(null);
        }}
        doctorId={selectedDoctorId}
        onBookAppointment={handleBookAppointment}
      />

      {/* Reviews Modal */}
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => {
          setShowReviewsModal(false);
          setReviewsDoctorId(null);
        }}
        doctorId={reviewsDoctorId}
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}

