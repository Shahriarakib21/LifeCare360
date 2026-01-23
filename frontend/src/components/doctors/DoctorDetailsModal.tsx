'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Star, Phone, Mail, Globe, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
  bio?: string;
  qualifications?: string[];
  languages?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  availability?: {
    days?: string[];
    hours?: {
      start?: string;
      end?: string;
    };
    timezone?: string;
  };
  hospital?: string;
  clinic?: string;
  isVerified: boolean;
  isActive: boolean;
}

interface DoctorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number | null;
  onBookAppointment?: (doctor: Doctor) => void;
}

const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  isOpen,
  onClose,
  doctorId,
  onBookAppointment,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchDoctorDetails();
    } else {
      setDoctor(null);
    }
  }, [isOpen, doctorId]);

  const fetchDoctorDetails = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/public/doctors/${doctorId}`);
      setDoctor(response.data.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatAvailabilityDays = (days?: string[]) => {
    if (!days || days.length === 0) return 'Not specified';
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Details"
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {doctor && onBookAppointment && (
            <Button onClick={() => {
              onBookAppointment(doctor);
              onClose();
            }}>
              Book Appointment
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading doctor details..." />
        </div>
      ) : doctor ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-4 pb-4 border-b border-secondary-200">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage.startsWith('http') ? doctor.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${doctor.profileImage}`}
                alt={doctor.name || doctor.specialization}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-primary-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-2xl">
                  {doctor.name?.charAt(0) || doctor.specialization.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-secondary-900">
                  {doctor.name || `Dr. ${doctor.specialization}`}
                </h2>
                {doctor.isVerified ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-lg text-primary-600 font-medium">{doctor.specialization}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                  <span className="font-semibold">{Number(doctor.rating).toFixed(1)}</span>
                  <span className="text-sm text-secondary-500">
                    ({doctor.totalReviews || 0} reviews)
                  </span>
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {doctor.experience} years experience
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {doctor.bio && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">About</h3>
              <p className="text-secondary-600">{doctor.bio}</p>
            </div>
          )}

          {/* Qualifications */}
          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Qualifications</h3>
              <ul className="list-disc list-inside space-y-1 text-secondary-600">
                {doctor.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctor.contact?.phone && (
              <div className="flex items-center space-x-2 text-secondary-600">
                <Phone className="w-5 h-5 text-primary-600" />
                <span>{doctor.contact.phone}</span>
              </div>
            )}
            {doctor.contact?.email && (
              <div className="flex items-center space-x-2 text-secondary-600">
                <Mail className="w-5 h-5 text-primary-600" />
                <span>{doctor.contact.email}</span>
              </div>
            )}
            {doctor.contact?.website && (
              <div className="flex items-center space-x-2 text-secondary-600">
                <Globe className="w-5 h-5 text-primary-600" />
                <a href={doctor.contact.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {doctor.contact.website}
                </a>
              </div>
            )}
          </div>

          {/* Address */}
          {doctor.address && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Location</h3>
              <div className="flex items-start space-x-2 text-secondary-600">
                <MapPin className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  {doctor.address.street && <p>{doctor.address.street}</p>}
                  <p>
                    {doctor.address.city}
                    {doctor.address.state && `, ${doctor.address.state}`}
                    {doctor.address.zipCode && ` ${doctor.address.zipCode}`}
                  </p>
                  {doctor.address.country && <p>{doctor.address.country}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Hospital/Clinic */}
          {(doctor.hospital || doctor.clinic) && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Practice</h3>
              {doctor.hospital && <p className="text-secondary-600">{doctor.hospital}</p>}
              {doctor.clinic && <p className="text-secondary-600">{doctor.clinic}</p>}
            </div>
          )}

          {/* Availability */}
          {doctor.availability && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Availability</h3>
              <div className="space-y-2 text-secondary-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span>
                    <strong>Days:</strong> {formatAvailabilityDays(doctor.availability.days)}
                  </span>
                </div>
                {doctor.availability.hours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span>
                      <strong>Hours:</strong> {formatTime(doctor.availability.hours.start)} - {formatTime(doctor.availability.hours.end)}
                    </span>
                  </div>
                )}
                {doctor.availability.timezone && (
                  <p className="text-sm text-secondary-500">Timezone: {doctor.availability.timezone}</p>
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((lang, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Consultation Fee */}
          <div className="pt-4 border-t border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Consultation Fee</p>
                <p className="text-2xl font-bold text-secondary-900">
                  ৳{Number(doctor.consultationFee).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-secondary-600">Doctor details not found.</p>
        </div>
      )}
    </Modal>
  );
};

export default DoctorDetailsModal;

