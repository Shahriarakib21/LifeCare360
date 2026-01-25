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

import { motion } from 'framer-motion';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 p-8 space-y-10 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-secondary-900 tracking-tight leading-tight">
              Clinical <span className="text-primary-600">Overview</span>
            </h1>
            <p className="text-secondary-500 font-bold uppercase text-xs tracking-[0.2em]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="rounded-2xl px-6 bg-secondary-50 border-secondary-100"
              onClick={() => router.push('/doctor/appointments')}
              leftIcon={<Clock className="w-5 h-5" />}
            >
              Full Schedule
            </Button>
            <Button
              variant="primary"
              className="rounded-2xl px-8 shadow-xl"
              onClick={() => router.push('/doctor/patients')}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              New Encounter
            </Button>
          </div>
        </motion.div>

        {!isProfileComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-accent-50/50 border-2 border-accent-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-accent-500 rounded-3xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-secondary-900">Credentialing Incomplete</h3>
                <p className="text-secondary-600 font-medium">Please finish your professional verification to begin taking appointments.</p>
              </div>
            </div>
            <Button variant="accent" size="lg" className="rounded-2xl px-8 whitespace-nowrap" onClick={() => router.push('/doctor/profile')}>
              Verify Credentials
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard delay={0.1} title="Daily Load" value={stats.todayAppointments} icon={Calendar} color="from-primary-500 to-primary-600" sub="Queue Status" />
          <StatCard delay={0.2} title="Discharged" value={stats.completedToday} icon={CheckCircle} color="from-success-500 to-success-600" sub="Today's Ops" />
          <StatCard delay={0.3} title="Upcoming" value={stats.upcomingAppointments} icon={Clock} color="from-secondary-500 to-secondary-600" sub="Waitlist" />
          <StatCard delay={0.4} title="Avg. Rating" value={(Number(stats.rating) || 0).toFixed(1)} icon={Star} color="from-accent-500 to-accent-600" sub="Patient feedback" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="h-full border-none shadow-soft overflow-hidden rounded-[2.5rem] bg-white p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-black text-secondary-900 tracking-tight">Active Queue</h2>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-secondary-50">
                  Live View
                </Badge>
              </div>

              <div className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <ImagePlaceholder type="generic" className="w-20 h-20 rounded-3xl mx-auto" />
                    <p className="text-secondary-400 font-black uppercase text-xs tracking-widest">No Active Encounters</p>
                  </div>
                ) : (
                  todayAppointments.map((apt, idx) => (
                    <div key={idx} className="group p-5 rounded-3xl bg-secondary-50/50 border border-secondary-50 hover:border-primary-100 hover:bg-white hover:shadow-xl transition-all duration-500 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-white shadow-sm flex items-center justify-center border border-secondary-100 group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-black text-secondary-900 uppercase tracking-tight text-sm group-hover:text-primary-600 transition-colors uppercase">{apt.patientName}</p>
                          <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">{apt.time} • Scheduled</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-black uppercase tracking-tighter px-3 py-1",
                        apt.status === 'completed' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-primary-50 text-primary-700 border-primary-100'
                      )}>
                        {apt.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full border-none shadow-soft overflow-hidden rounded-[2.5rem] bg-secondary-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-black tracking-tight leading-none">History</h2>
              </div>

              <div className="space-y-6 relative z-10">
                {recentPatients.map((p, idx) => (
                  <Link href={`/doctor/patients/${p._id}`} key={idx} className="group block p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                    <p className="font-black text-sm uppercase tracking-widest text-primary-400 mb-2 truncate">
                      {p.user?.profile?.firstName} {p.user?.profile?.lastName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                      <span>Visit: {new Date(p.lastVisit).toLocaleDateString()}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, sub, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-8 flex items-center justify-between bg-white border border-secondary-100 shadow-soft group hover:shadow-xl transition-all duration-500 rounded-[2rem] relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-4xl font-black text-secondary-900 tracking-tighter">{value}</p>
          <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{sub}</p>
        </div>
        <div className={cn("relative z-10 w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500", color)}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Subtle Watermark */}
        <div className="absolute -bottom-4 -left-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
          <Icon className="w-24 h-24" />
        </div>
      </Card>
    </motion.div>
  );
}
