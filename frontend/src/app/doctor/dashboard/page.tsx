'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Users, Calendar, FileText, TrendingUp, Clock, CheckCircle, FlaskConical, Activity, ArrowRight, Star, Plus, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    rating: 0,
  });
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') initialize();
  }, [initialize]);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const [appointmentsRes, doctorRes] = await Promise.all([
        api.get('/api/doctors/appointments'),
        api.get('/api/doctors/profile'),
      ]);

      const allApts = appointmentsRes.data?.data?.appointments || [];
      const todayStr = new Date().toISOString().split('T')[0];

      const todayApts = allApts.filter((apt: any) => apt.date && apt.date.split('T')[0] === todayStr);
      const upcomingApts = allApts.filter((apt: any) => apt.date && apt.date.split('T')[0] >= todayStr && apt.status !== 'completed');

      setAppointments(allApts);
      setTodayAppointments(todayApts);

      const patients = new Map();
      allApts.forEach((apt: any) => {
        if (apt.patientId) patients.set(apt.patientId, { ...apt.patient, lastVisit: apt.date });
      });
      setRecentPatients(Array.from(patients.values()).slice(0, 5));

      setStats({
        todayAppointments: todayApts.length,
        upcomingAppointments: upcomingApts.length,
        completedToday: todayApts.filter((apt: any) => apt.status === 'completed').length,
        rating: doctorRes.data?.data?.doctor?.rating || 0,
      });
      setIsProfileComplete(!!doctorRes.data?.data?.doctor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!isAuthenticated || !user) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-secondary-900">Doctor Dashboard</h1>
          <Button onClick={() => router.push('/doctor/appointments')}>Manage Appointments</Button>
        </div>

        {!isProfileComplete && (
          <div className="bg-warning-50 border-2 border-warning-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-warning-900">Profile Incomplete</h3>
                <p className="text-warning-700">Please complete your professional profile to start receiving appointments.</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => router.push('/doctor/profile')}>
              Update Profile
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Today's Visits" value={stats.todayAppointments} icon={Calendar} color="primary" />
          <StatCard title="Completed" value={stats.completedToday} icon={CheckCircle} color="success" />
          <StatCard title="Upcoming" value={stats.upcomingAppointments} icon={Clock} color="warning" />
          <StatCard title="Rating" value={(Number(stats.rating) || 0).toFixed(1)} icon={Star} color="secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card padding="lg" className="lg:col-span-2" title="Schedule Overview">
            <div className="space-y-4">
              {todayAppointments.map((apt, idx) => (
                <div key={idx} className="p-4 border rounded-xl flex justify-between items-center bg-white">
                  <div>
                    <p className="font-bold">{apt.patientName}</p>
                    <p className="text-sm text-secondary-500">{apt.time}</p>
                  </div>
                  <Badge variant={apt.status === 'completed' ? 'success' : 'primary'}>{apt.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" title="Recent Patients">
            <div className="space-y-4">
              {recentPatients.map((p, idx) => (
                <Link href={`/doctor/patients/${p._id}`} key={idx} className="block p-2 hover:bg-secondary-100 rounded-lg">
                  <p className="font-bold">{p.user?.profile?.firstName} {p.user?.profile?.lastName}</p>
                  <p className="text-xs text-secondary-500">Last visit: {new Date(p.lastVisit).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = { primary: 'text-primary-600 bg-primary-50', success: 'text-success-600 bg-success-50', warning: 'text-warning-600 bg-warning-50', secondary: 'text-secondary-600 bg-secondary-50' };
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-secondary-500 uppercase">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${colors[color]}`}><Icon className="w-6 h-6" /></div>
    </Card>
  );
}
