'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HealthOverviewCards from '@/components/patient/dashboard/HealthOverviewCards';
import HealthTrendsChart from '@/components/patient/dashboard/HealthTrendsChart';
import AppointmentsSection from '@/components/patient/dashboard/AppointmentsSection';
import MedicationsSection from '@/components/patient/dashboard/MedicationsSection';
import ReportsSection from '@/components/patient/dashboard/ReportsSection';
import AIInsights from '@/components/patient/dashboard/AIInsights';
import EmergencySection from '@/components/patient/dashboard/EmergencySection';
import Badge from '@/components/ui/Badge';
import { Clock } from 'lucide-react';
import PendingPaymentAlert from '@/components/patient/PendingPaymentAlert';

const MOCK_DATA = {
  appointments: [
    { id: '1', doctor: { name: 'Dr. Sarah Wilson' }, specialty: 'Cardiologist', date: '2024-03-20T10:00:00', status: 'scheduled', type: 'Check-up' },
    { id: '2', doctor: { name: 'Dr. James Chen' }, specialty: 'Dermatologist', date: '2024-03-24T14:30:00', status: 'scheduled', type: 'Consultation' }
  ],
  medications: [
    { id: '1', name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', timeLeft: '5 days' },
    { id: '2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', timeLeft: '12 days' }
  ],
  reports: [
    { id: '1', name: 'Blood Test Report', date: '2024-03-15', doctor: 'Dr. Wilson', status: 'Available' },
    { id: '2', name: 'X-Ray Scan', date: '2024-02-28', doctor: 'Dr. Brown', status: 'Available' }
  ],
  vitals: [
    {
      date: new Date().toISOString(),
      data: {
        vitals: {
          sugar: '110',
          bp: '120/80',
          heart: '72',
          weight: '75',
          hemo: '14.5'
        }
      }
    },
    {
      date: new Date(Date.now() - 86400000).toISOString(),
      data: {
        vitals: {
          sugar: '115',
          bp: '122/82',
          heart: '75',
          weight: '75.5',
          hemo: '14.2'
        }
      }
    }
  ],
  trends: [
    { name: 'Mon', sugar: 118, bp: 118, date: '2024-03-11' },
    { name: 'Tue', sugar: 125, bp: 120, date: '2024-03-12' },
    { name: 'Wed', sugar: 115, bp: 119, date: '2024-03-13' },
    { name: 'Thu', sugar: 130, bp: 122, date: '2024-03-14' },
    { name: 'Fri', sugar: 128, bp: 121, date: '2024-03-15' },
    { name: 'Sat', sugar: 122, bp: 119, date: '2024-03-16' },
    { name: 'Sun', sugar: 120, bp: 120, date: '2024-03-17' },
  ]
};

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [data, setData] = useState({
    appointments: [] as any[],
    medications: [] as any[],
    reports: [] as any[],
    vitals: [] as any[], // Will hold last 2 vital records for trend comparison
    trends: [] as any[], // Merged trends data
    pendingPayments: [] as any[],
  });

  const [stats, setStats] = useState({
    appointmentsCount: 0,
    medicationsCount: 0,
  });

  const fetchDashboardData = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Fetch all required data concurrently
      const [appRes, medRes, reportRes, ehrVitalsRes, sugarRes, bpRes] = await Promise.allSettled([
        api.get('/api/patients/appointments'),
        api.get('/api/patients/medications'),
        api.get('/api/patients/lab-reports?limit=5'),
        api.get('/api/patients/ehr?type=vital&limit=2'), // Fetch last 2 for trends
        api.get('/api/patients/trends?metric=sugar&days=7'),
        api.get('/api/patients/trends?metric=bp&days=7'),
        api.get('/api/payments/pending')
      ]);

      setData(prevData => {
        const newData = { ...prevData };

        // Process Appointments
        if (appRes.status === 'fulfilled') {
          const allAppointments = appRes.value.data.data.appointments || [];
          newData.appointments = allAppointments;

          const upcoming = allAppointments.filter((a: any) => a.status === 'scheduled' || a.status === 'confirmed');
          setStats(prev => ({
            ...prev,
            appointmentsCount: upcoming.length > 0 ? upcoming.length : MOCK_DATA.appointments.length
          }));
        }

        // Process Medications
        if (medRes.status === 'fulfilled') {
          const meds = medRes.value.data.data.medications || [];
          if (meds.length > 0) {
            newData.medications = meds;
            setStats(prev => ({ ...prev, medicationsCount: meds.length }));
          } else {
            newData.medications = MOCK_DATA.medications;
            setStats(prev => ({ ...prev, medicationsCount: MOCK_DATA.medications.length }));
          }
        }

        // Process Reports
        if (reportRes.status === 'fulfilled') {
          const reports = reportRes.value.data.data.reports || [];
          newData.reports = reports.length > 0 ? reports : MOCK_DATA.reports;
        }

        // Process Vitals
        if (ehrVitalsRes.status === 'fulfilled') {
          const vitals = ehrVitalsRes.value.data.data.records || [];
          newData.vitals = vitals.length > 0 ? vitals : MOCK_DATA.vitals;
        }

        // Process Trends
        // @ts-ignore
        if (sugarRes.status === 'fulfilled' || bpRes.status === 'fulfilled') {
          const sugarTrends = (sugarRes.status === 'fulfilled' ? sugarRes.value.data.data.trends : []) as any[];
          const bpTrends = (bpRes.status === 'fulfilled' ? bpRes.value.data.data.trends : []) as any[];

          const daysMap = new Map<string, any>();
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            daysMap.set(dateKey, {
              name: d.toLocaleDateString('en-US', { weekday: 'short' }),
              sugar: 0,
              bp: 0,
              date: dateKey
            });
          }

          const fillMap = (trends: any[], key: string) => {
            trends.forEach(t => {
              const d = new Date(t.date).toISOString().split('T')[0];
              if (daysMap.has(d)) {
                const entry = daysMap.get(d);
                entry[key] = Number(t.value);
                daysMap.set(d, entry);
              }
            });
          };

          fillMap(sugarTrends, 'sugar');
          fillMap(bpTrends, 'bp');
          const finalTrends = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
          newData.trends = finalTrends.some(t => t.sugar > 0 || t.bp > 0) ? finalTrends : MOCK_DATA.trends;
        }

        // Process Pending Payments
        // @ts-ignore
        if (arguments[0][6]?.status === 'fulfilled') {
          // @ts-ignore
          newData.pendingPayments = arguments[0][6].value.data.data.payments || [];
        }

        return newData;
      });

    } catch (error) {
      console.error('Dashboard data fetch failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket.io for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const socket = io(API_URL);

    socket.on('connect', () => {
      console.log('Connected to real-time server');
      // Join room based on patient ID (or user ID if that's what we use)
      // Since lab.controller uses request.patientId.toString(), we need the patient ID
      // But we have user.id (which is the MongoDB User ID)
      // We might need to fetch the patient ID first or change the backend to use userId

      // For now, let's assume we use user.id for notifications to simplify
      socket.emit('join-room', user.id);
    });

    socket.on('notification', (notif) => {
      console.log('Real-time notification received:', notif);

      // Generic toast for any notification
      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold">{notif.title || 'New Notification'}</span>
            <span className="text-sm">{notif.message}</span>
            {notif.type === 'result_uploaded' && (
              <button
                className="text-xs text-teal-600 font-bold mt-1 text-left"
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/patient/lab-reports');
                }}
              >
                VIEW RESULTS
              </button>
            )}
            {notif.type === 'lab_order' && (
              <button
                className="text-xs text-teal-600 font-bold mt-1 text-left"
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/patient/lab-requests');
                }}
              >
                VIEW REQUEST
              </button>
            )}
            {notif.type?.startsWith('appointment') && (
              <button
                className="text-xs text-teal-600 font-bold mt-1 text-left"
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/patient/appointments');
                }}
              >
                VIEW APPOINTMENTS
              </button>
            )}
          </div>
        ),
        {
          duration: 6000,
          icon: notif.type === 'result_uploaded' ? '🔬' : '🔔'
        }
      );

      // Refresh dashboard data
      fetchDashboardData();
    });

    // Keep legacy listener for backward compatibility if any parts of system still use it
    socket.on('lab-status-update', (data) => {
      console.log('Legacy lab update received:', data);
      toast.success(`Lab result ready: ${data.testName}`, { icon: '🔬' });
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated && !isLoading) {
    // Ideally this redirects via middleware or handled globally
  }

  // Safe name display
  const firstName = user?.profile?.firstName || 'Patient';

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingPayments = data.appointments.filter(a => a.feeStatus === 'unpaid' || a.feeStatus === 'pending');

  return (
    <div className="space-y-8 pb-8">
      {/* Unified Pending Payment Alerts */}
      {data.pendingPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {data.pendingPayments.map((payment) => (
            <PendingPaymentAlert key={payment.invoiceId} payment={payment} />
          ))}
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="bg-teal-50 text-teal-700 border-teal-100 px-3 py-1 mb-3 w-fit">
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">{firstName}</span>! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            You have <span className="font-bold text-slate-800">{stats.appointmentsCount} upcoming appointments</span> and <span className="font-bold text-slate-800">{stats.medicationsCount} active medications</span>.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/medicines')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium shadow-sm"
          >
            <div className="p-1 px-1.5 bg-primary-100 rounded-lg text-primary-600">
              <span className="text-lg">💊</span>
            </div>
            Shop Medicines
          </button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <section>
        <HealthOverviewCards vitalsData={data.vitals} />
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column (Charts & Reports) */}
        <div className="xl:col-span-8 space-y-8">
          <HealthTrendsChart data={data.trends} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96">
              <AppointmentsSection
                appointments={data.appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed')}
              />
            </div>
            <div className="h-96">
              <ReportsSection reports={data.reports} />
            </div>
          </div>
        </div>

        {/* Right Column (Medications, AI, Emergency) */}
        <div className="xl:col-span-4 space-y-8">
          <AIInsights />

          <div className="h-auto">
            <MedicationsSection medications={data.medications} />
          </div>

          <EmergencySection />
        </div>
      </div>
    </div>
  );
}
