'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, CheckCircle, XCircle, AlertCircle, Eye, Coins } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    fetchAppointments();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    applyFilters();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/doctors/appointments');
      setAppointments(response.data.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.date) {
      const filterDate = new Date(filters.date).toISOString().split('T')[0];
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date).toISOString().split('T')[0];
        return aptDate === filterDate;
      });
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredAppointments(filtered);
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      await api.put(`/api/doctors/appointments/${appointmentId}`, {
        status: 'completed',
      });
      toast.success('Appointment marked as completed');
      fetchAppointments(); // Refresh the list
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
      scheduled: 'primary',
      confirmed: 'success',
      completed: 'success',
      cancelled: 'error',
      pending: 'warning',
    };
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || !user) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading appointments..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Appointments
            </h1>
            <p className="text-secondary-600">
              Manage and view all your appointments
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/doctor/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => setFilters({ status: '', date: '' })}
              fullWidth
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Appointments List */}
      <Card padding="lg">
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-6 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors border border-secondary-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-semibold text-lg text-secondary-900">
                        {appointment.patientName ||
                          (appointment.patient?.user?.profile
                            ? `${appointment.patient.user.profile.firstName} ${appointment.patient.user.profile.lastName}`.trim()
                            : appointment.patient?.user?.email || 'Patient')}
                      </p>
                      <Badge variant={getStatusBadge(appointment.status)} size="sm">
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(appointment.date, 'long')}</span>
                      </div>
                      {appointment.time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time}</span>
                        </div>
                      )}
                      {appointment.type && (
                        <Badge variant="secondary" size="sm">
                          {appointment.type}
                        </Badge>
                      )}
                      {appointment.duration && (
                        <span>Duration: {appointment.duration} min</span>
                      )}
                      {appointment.visitFee !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-secondary-900">
                            ৳{appointment.visitFee}
                          </span>
                          <Badge variant={appointment.feeStatus === 'PAID' ? 'success' : 'warning'} size="sm">
                            {appointment.feeStatus || 'UNPAID'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-secondary-600 italic">
                        {appointment.notes}
                      </p>
                    )}
                    {appointment.meetingLink && (
                      <a
                        href={appointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        Join Meeting →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {(appointment.patientId || appointment.patient?._id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          // Get patientId from multiple possible sources
                          // Priority: patientId (direct) > patient._id (nested)
                          const patientId = appointment.patientId
                            || appointment.patient?._id;

                          if (!patientId) {
                            console.warn('Patient ID not found in appointment:', appointment);
                            toast.error('Patient ID not found');
                            return;
                          }

                          // Convert to string and ensure it's a valid MongoDB ObjectId format
                          const patientIdStr = String(patientId).trim();

                          if (!patientIdStr || patientIdStr === 'undefined' || patientIdStr === 'null') {
                            console.warn('Invalid patient ID:', patientIdStr);
                            toast.error('Invalid patient ID');
                            return;
                          }

                          // Navigate to patient detail page
                          router.push(`/doctor/patients/${patientIdStr}`);
                        } catch (error) {
                          console.error('Error navigating to patient:', error);
                          toast.error('Failed to open patient details. Please try again.');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Patient
                    </Button>
                  )}
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkCompleted(appointment.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              No appointments found
            </h3>
            <p className="text-secondary-600">
              {appointments.length === 0
                ? "You don't have any appointments yet."
                : 'No appointments match your current filters.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

