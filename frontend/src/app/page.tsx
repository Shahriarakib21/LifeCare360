'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Stethoscope, Pill, CheckCircle, Shield, Clock, Heart, Zap,
  FileText, Brain, Users, Activity, Lock, Smartphone, Globe, TrendingUp,
  Calendar, Video, FlaskConical, Building2, CreditCard, Star, Award, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TypingAnimation from '@/components/ui/TypingAnimation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

export default function HomePage() {
  console.log('HomePage Rendering');
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Redirect doctors to their dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && user?.role === 'doctor') {
      router.push('/doctor/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/api/public/doctors/search?limit=12');
        const doctorsData = response.data?.data?.doctors || [];
        setDoctors(doctorsData);
      } catch (error) {
        console.warn('Error fetching doctors (using fallback/empty):', error);
        // Fallback to empty array to prevent UI crash
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (doctors.length === 0 || isPaused) return;

    const maxSlides = Math.ceil(doctors.length / 3);
    if (maxSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % maxSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [doctors.length, isPaused]);

  const quickAccessCards = [
    {
      id: 'doctor',
      icon: Stethoscope,
      title: 'Find Doctors',
      description: 'Consult with world-class specialists online or in-person.',
      href: '/doctors',
      color: 'bg-primary-50 text-primary-600',
      delay: 0.1
    },
    {
      id: 'lab',
      icon: FlaskConical,
      title: 'Book Lab Test',
      description: 'Reliable diagnostics with home sample collection.',
      href: '/labs',
      color: 'bg-secondary-50 text-secondary-600',
      delay: 0.2
    },
    {
      id: 'pharmacy',
      icon: Pill,
      title: 'Pharmacy Shop',
      description: 'Order medicines and healthcare products delivered fast.',
      href: '/medicines',
      color: 'bg-green-50 text-green-600',
      delay: 0.3
    },
    {
      id: 'blog',
      icon: Heart,
      title: 'Health Blog',
      description: 'Expert medical advice and wellness tips for your daily life.',
      href: '/blog',
      color: 'bg-accent-50 text-accent-600',
      delay: 0.4
    },
  ];

  const stats = [
    { number: '10K+', label: 'Happy Patients', icon: Users, delay: 0 },
    { number: '500+', label: 'Specialist Doctors', icon: Stethoscope, delay: 0.1 },
    { number: '150+', label: 'Partner Labs', icon: Building2, delay: 0.2 },
    { number: '24/7', label: 'Support Available', icon: Clock, delay: 0.3 },
  ];

  const benefits = [
    {
      title: 'For Patients',
      items: [
        'Easy access to medical records',
        'Direct consultation with specialists',
        'Hassle-free lab test bookings',
        'Secure prescription management'
      ]
    },
    {
      title: 'For Doctors',
      items: [
        'Digital patient management',
        'Easy health tracking analytics',
        'Secure communication tools',
        'Organized schedule management'
      ]
    },
    {
      title: 'For Partners',
      items: [
        'Seamless lab collaboration',
        'Efficient order fulfillment',
        'Integrated inventory tracking',
        'Direct patient engagement'
      ]
    }
  ];

  const importantNotes = [
    { icon: Shield, text: 'Verified Specialists', color: 'text-primary-200' },
    { icon: Lock, text: 'Secure Data', color: 'text-primary-200' },
    { icon: Activity, text: 'Real-time Tracking', color: 'text-primary-200' },
    { icon: Clock, text: '24/7 Availability', color: 'text-primary-200' }
  ];

  const nextSlide = useCallback(() => {
    if (doctors.length === 0) return;
    const maxSlides = Math.ceil(doctors.length / 3);
    setCurrentIndex((prev) => (prev + 1) % maxSlides);
  }, [doctors.length]);

  const prevSlide = useCallback(() => {
    if (doctors.length === 0) return;
    const maxSlides = Math.ceil(doctors.length / 3);
    setCurrentIndex((prev) => (prev - 1 + maxSlides) % maxSlides);
  }, [doctors.length]);

  if (isAuthenticated && user?.role === 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <Header />

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 flex items-center">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-100/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center lg:text-left space-y-8"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-bold tracking-wide animate-fade-in">
                  <Activity className="w-4 h-4 mr-2" />
                  THE FUTURE OF HEALTHCARE IS HERE
                </div>

                <h1 className="text-5xl lg:text-7xl font-black text-secondary-900 leading-[1.1]">
                  Complete <span className="text-primary-600">Care</span> <br />
                  For Your <span className="text-secondary-500">Family</span>
                </h1>

                <p className="text-xl text-secondary-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Join 10,000+ patients managing their medical records, consulting with experts, and ordering lab tests through our secure, unified ecosystem.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link href="/auth/register">
                    <Button variant="accent" size="lg" className="px-10 py-5 rounded-2xl group shadow-2xl">
                      Register as Patient
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/doctors">
                    <Button variant="secondary" size="lg" className="px-10 py-5 rounded-2xl bg-white/50 backdrop-blur-md">
                      Find a Doctor
                    </Button>
                  </Link>
                </div>

                {/* Statistics Preview */}
                <div className="pt-8 border-t border-secondary-100 grid grid-cols-2 gap-8 lg:max-w-md">
                  <div>
                    <p className="text-3xl font-black text-secondary-900">500+</p>
                    <p className="text-sm font-medium text-secondary-500">Verified Doctors</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-secondary-900">100%</p>
                    <p className="text-sm font-medium text-secondary-500">Secure Privacy</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] group bg-gradient-to-br from-primary-100 to-primary-50">
                  <Image
                    src="/hero-image.jpg"
                    alt="LifeCare360 Professional Care"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    unoptimized
                    onError={(e) => {
                      console.error('Hero image failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  {/* Floating Action Badge */}
                  <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-up z-20">
                    <div className="w-14 h-14 rounded-2xl bg-success-100 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-secondary-900">Instant Access</p>
                      <p className="text-xs text-secondary-500">Your health data, anywhere, anytime.</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-100 rounded-full blur-2xl opacity-60"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary-100 rounded-full blur-3xl opacity-60"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Quick Access Grid --- */}
        <section className="py-24 bg-secondary-50/50">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="space-y-4 max-w-2xl">
                <p className="text-primary-600 font-black tracking-widest text-sm uppercase">Medical Services</p>
                <h2 className="text-4xl lg:text-5xl font-black text-secondary-900">Everything you need, <br />in one secure platform.</h2>
              </div>
              <p className="text-secondary-500 max-w-xs md:text-right">Access world-class clinical services with just a few clicks.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickAccessCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: card.delay }}
                  >
                    <Link href={card.href} className="flex flex-col h-full group">
                      <div className="bg-white p-8 rounded-[2rem] border border-secondary-100 shadow-soft hover:shadow-medium transition-all duration-500 flex flex-col items-center text-center space-y-6 h-full hover:border-primary-100">
                        <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500", card.color)}>
                          <Icon className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xl font-black text-secondary-900">{card.title}</h3>
                          <p className="text-secondary-500 text-sm leading-relaxed">{card.description}</p>
                        </div>
                        <div className="pt-4 mt-auto">
                          <span className="text-primary-600 font-bold text-sm inline-flex items-center group-hover:gap-2 transition-all">
                            Access Now <ArrowRight className="w-4 h-4 ml-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Featured Doctors --- */}
        <section className="py-24 bg-white relative">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider">
                  Verified Professionals
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-secondary-900 leading-tight">
                  Meet Our <span className="text-primary-600">Expert Specialists</span>
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/doctors">
                  <Button variant="ghost" className="text-primary-600 font-bold hover:bg-primary-50">
                    View All Doctors <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                {doctors.length > 3 && (
                  <div className="flex gap-2">
                    <button onClick={prevSlide} className="w-12 h-12 rounded-xl border border-secondary-200 flex items-center justify-center hover:bg-secondary-50 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-secondary-600" />
                    </button>
                    <button onClick={nextSlide} className="w-12 h-12 rounded-xl border border-secondary-200 flex items-center justify-center hover:bg-secondary-50 transition-colors">
                      <ChevronRight className="w-5 h-5 text-secondary-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {doctors.slice(currentIndex * 3, currentIndex * 3 + 3).map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="w-full"
                  >
                    <Card hover className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] group bg-white rounded-[2rem] p-6 h-full flex flex-col">
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5">
                        {doctor.profileImage ? (
                          <img
                            src={doctor.profileImage.startsWith('http') ? doctor.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${doctor.profileImage}`}
                            alt={doctor.name || doctor.specialization}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <ImagePlaceholder type="doctor" className="w-full h-full" />
                        )}
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white/20">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-warning-500 fill-warning-500" />
                            <span className="text-xs font-bold text-secondary-900">{Number(doctor.rating || 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col space-y-4">
                        <div className="min-h-[4.5rem]">
                          <h3 className="text-base font-black text-secondary-900 group-hover:text-primary-600 transition-colors mb-1.5 line-clamp-2 leading-tight break-words">
                            {doctor.name || `Dr. ${doctor.specialization}`}
                          </h3>
                          <p className="text-primary-600 font-bold text-[10px] tracking-wide uppercase line-clamp-2 leading-tight break-words">{doctor.specialization}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm py-3 border-y border-secondary-100">
                          <div className="flex items-center text-secondary-500 min-w-0">
                            <Award className="w-4 h-4 mr-1.5 text-primary-400 flex-shrink-0" />
                            <span className="text-xs font-medium whitespace-nowrap">{doctor.experience || 0} yrs</span>
                          </div>
                          <div className="font-black text-secondary-900 text-sm flex-shrink-0">
                            ৳{Number(doctor.consultationFee || 0).toFixed(0)}
                          </div>
                        </div>

                        <Link href={`/doctors?id=${doctor.id}`} className="block mt-auto">
                          <Button fullWidth variant="primary" className="rounded-xl py-2.5 text-sm font-bold whitespace-nowrap">
                            Book Appointment
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* --- Diagnostic Laboratory --- */}
        <section className="py-24 bg-secondary-900 relative overflow-hidden">
          {/* Futuristic Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <div className="container-custom relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-bold uppercase tracking-wider border border-primary-500/20">
                  Reliable Diagnostics
                </div>
                <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                  High-Precision <br />
                  <span className="text-primary-500">Lab Reports</span>
                </h2>
                <p className="text-xl text-secondary-400 leading-relaxed max-w-xl">
                  Get accurate test results delivered directly to your profile. From routine blood work to advanced screenings, we partner with certified labs to bring you excellence.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href="/labs">
                    <Button variant="primary" size="lg" className="px-8 py-4 rounded-xl">View All Tests</Button>
                  </Link>
                  <Link href="/labs">
                    <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 px-8 py-4 rounded-xl">Check Lab Presence</Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Popular Tests Widget */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-6">
                  <p className="text-sm font-bold text-primary-500 uppercase tracking-widest">Popular Lab Packages</p>

                  {[
                    { name: 'Complete Blood Count (CBC)', price: '850', color: 'bg-red-500' },
                    { name: 'Lipid Profile Screen', price: '1,200', color: 'bg-blue-500' },
                    { name: 'Full Body Health Checkup', price: '4,500', color: 'bg-emerald-500' },
                  ].map((test, i) => (
                    <motion.div
                      key={test.name}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="group p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 shadow-xl")}>
                          <FlaskConical className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{test.name}</p>
                          <p className="text-secondary-500 text-xs uppercase tracking-widest mt-1">Instant Booking Available</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-500 font-black text-lg">৳{test.price}</p>
                        <p className="text-[10px] text-secondary-600 font-bold uppercase">Best Value</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Pharmacy Shop --- */}
        <section className="py-24 bg-gradient-to-br from-secondary-50 to-white">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:order-2 space-y-8"
              >
                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider">
                  Medicine & Wellness
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-secondary-900 leading-tight">
                  Your Reliable <br /><span className="text-green-600">e-Pharmacy Partner</span>
                </h2>
                <p className="text-xl text-secondary-600 leading-relaxed max-w-xl">
                  Order authentic medicines and healthcare essentials with doorstep delivery. Compare brand vs generic versions and manage your prescriptions online.
                </p>

                <div className="space-y-4">
                  {[
                    { text: 'Doorstep Delivery in 2-4 Hours', icon: Zap },
                    { text: 'Prescription Verification System', icon: Shield },
                    { text: 'Secure Payments & Order Tracking', icon: CreditCard },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-bold text-secondary-900">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/medicines">
                    <Button variant="accent" size="lg" className="px-10 py-5 rounded-2xl">
                      Explore Pharmacy
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:order-1 relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className={cn("space-y-4", i === 2 ? "mt-12" : "")}>
                      <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-xl relative group">
                        <ImagePlaceholder type="product" className="w-full h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                          <p className="text-white font-black text-lg">Essential Care</p>
                          <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Premium Quality</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Decorative Stats */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-[2rem] shadow-2xl space-y-2 border border-secondary-50 animate-bounce group hover:animate-none">
                  <div className="flex items-center gap-2">
                    <Star className="text-warning-500 fill-warning-500 w-5 h-5" />
                    <span className="font-black text-secondary-900 text-xl">4.9/5</span>
                  </div>
                  <p className="text-xs font-bold text-secondary-500 uppercase tracking-tighter">Customer Satisfaction</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Health Blog Section --- */}
        <section className="py-24 bg-white">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-16">
              <div className="space-y-4">
                <p className="text-accent-500 font-black tracking-widest text-sm uppercase">Wellness Insights</p>
                <h2 className="text-4xl lg:text-5xl font-black text-secondary-900">Latest from the Blog</h2>
              </div>
              <Link href="/blog" className="hidden md:block">
                <Button variant="secondary" className="rounded-xl">View All Articles</Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Understanding Preventative Healthcare', cat: 'Wellness', delay: 0.1 },
                { title: 'The Role of AI in Diagnostics', cat: 'Technology', delay: 0.2 },
                { title: 'Managing Mental Health in a Digital Age', cat: 'Health', delay: 0.3 },
              ].map((blog) => (
                <motion.div
                  key={blog.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: blog.delay }}
                >
                  <Card hover className="p-0 border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden group h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <ImagePlaceholder type="blog" className="w-full h-full translate-y-0 group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-black text-secondary-900">
                        {blog.cat}
                      </div>
                    </div>
                    <div className="p-8 space-y-4 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-secondary-900 leading-tight group-hover:text-primary-600 transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-secondary-500 text-sm line-clamp-3">
                        Discover the latest trends and expert advice on maintaining your health and wellness in this comprehensive guide written by our medical specialists.
                      </p>
                      <div className="pt-4 mt-auto">
                        <Link href="/blog" className="text-secondary-900 font-bold text-sm inline-flex items-center hover:gap-2 transition-all">
                          Read Full Article <ArrowRight className="w-4 h-4 ml-1 text-primary-500" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center md:hidden">
              <Link href="/blog">
                <Button variant="secondary" fullWidth size="lg">Explore All Articles</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Features Grid (Replacing old feature section) --- */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-secondary-900">Digital Health Infrastructure</h2>
              <p className="text-xl text-secondary-600">A unified platform built for scale, security, and exceptional patient outcomes.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Electronic Records', icon: FileText, desc: 'Lifetime EHR storage with secure patient-controlled access.', color: 'from-teal-500 to-emerald-500' },
                { title: 'AI Health Analytics', icon: Brain, desc: 'Intelligent trend analysis and anomaly detection for early care.', color: 'from-cyan-500 to-blue-500' },
                { title: 'Smart Ecosystem', icon: Users, desc: 'Connected network of pharmacies, labs, and specialists.', color: 'from-purple-500 to-indigo-500' },
                { title: 'High-Level Security', icon: Lock, desc: 'HIPAA & GDPR compliant standards with AES-256 encryption.', color: 'from-orange-500 to-red-500' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2.5rem] bg-secondary-50 border border-secondary-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-secondary-900 mb-4">{f.title}</h3>
                  <p className="text-secondary-600 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Benefits for Everyone
              </h2>
              <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
                A platform designed to serve patients, doctors, and healthcare providers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 border border-primary-100"
                >
                  <h3 className="text-2xl font-bold text-secondary-900 mb-6">
                    {benefit.title}
                  </h3>
                  <ul className="space-y-4">
                    {benefit.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start text-secondary-700">
                        <CheckCircle className="w-5 h-5 text-success-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6">
                  <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Your Health Data is Secure
                </h2>
                <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                  We take your privacy seriously. Our platform is HIPAA and GDPR compliant with bank-level
                  encryption, multi-factor authentication, and patient-controlled data sharing.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <Shield className="w-8 h-8 mb-4 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">HIPAA Compliant</h3>
                    <p className="text-primary-100 text-sm">Meets all healthcare data protection standards</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <Lock className="w-8 h-8 mb-4 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">AES-256 Encryption</h3>
                    <p className="text-primary-100 text-sm">Military-grade encryption for all data</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <Users className="w-8 h-8 mb-4 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">Patient Control</h3>
                    <p className="text-primary-100 text-sm">You decide who can access your data</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {importantNotes.map((note, index) => {
                const Icon = note.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Icon className={`w-12 h-12 ${note.color} mb-4`} />
                      <p className="text-white font-semibold text-lg">{note.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Trust Stats & Counters --- */}
        <section className="py-24 bg-primary-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 12.5%, transparent 12.5%, transparent 50%, #000 50%, #000 62.5%, transparent 62.5%, transparent 100%)', backgroundSize: '10px 10px' }}></div>
          <div className="container-custom relative z-10 text-white">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay }}
                  className="space-y-2"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary-200" />
                    </div>
                  </div>
                  <p className="text-5xl lg:text-6xl font-black tracking-tighter">{stat.number}</p>
                  <p className="text-primary-100 font-bold text-sm uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 bg-white">
          <div className="container-custom">
            <div className="bg-secondary-900 rounded-[3rem] p-12 lg:p-24 text-center space-y-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-600 translate-y-[100%] group-hover:translate-y-[95%] transition-transform duration-1000 blur-3xl opacity-50"></div>

              <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                <h2 className="text-4xl lg:text-7xl font-black text-white leading-tight">Ready to take control of your health?</h2>
                <p className="text-xl text-secondary-400">Join thousands of people who trust LifeCare360 for their medical journey. Start your free account today.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                <Link href="/auth/register">
                  <Button variant="primary" size="lg" className="px-12 py-6 rounded-2xl text-xl">Create Account Now</Button>
                </Link>
                <Link href="/doctors">
                  <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 px-12 py-6 rounded-2xl text-xl">Talk to a Specialist</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

interface Doctor {
  id: number;
  name?: string;
  specialization: string;
  experience: number;
  rating: number;
  totalReviews: number;
  consultationFee: number;
  profileImage?: string;
  isVerified: boolean;
}
