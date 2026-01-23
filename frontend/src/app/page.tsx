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
import TypingAnimation from '@/components/ui/TypingAnimation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LabSection from '@/components/home/LabSection';
import PriceTransparency from '@/components/home/PriceTransparency';
import LabAwareness from '@/components/home/LabAwareness';

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
    city?: string;
    state?: string;
  };
  hospital?: string;
  clinic?: string;
  isVerified: boolean;
}

export default function HomePage() {
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
        console.error('Error fetching doctors:', error);
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

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (doctors.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(doctors.length / 3));
  };

  const prevSlide = () => {
    if (doctors.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(doctors.length / 3)) % Math.ceil(doctors.length / 3));
  };

  const visibleDoctors = doctors.length > 0 ? doctors.slice(currentIndex * 3, currentIndex * 3 + 3) : [];

  const importantNotes = [
    { icon: Shield, text: 'HIPAA Compliant & Secure', color: 'text-primary-600' },
    { icon: Clock, text: '24/7 Access to Your Health Records', color: 'text-success-600' },
    { icon: Heart, text: 'AI-Powered Health Insights', color: 'text-error-600' },
    { icon: Zap, text: 'Instant Prescription Delivery', color: 'text-warning-600' },
  ];

  const features = [
    {
      icon: FileText,
      title: 'Lifetime Electronic Health Records',
      description: 'Complete medical history from birth to present, securely stored and easily accessible. Never lose track of your health data again.',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Brain,
      title: 'AI-Powered Health Analytics',
      description: 'Intelligent health trend analysis, anomaly detection, and personalized recommendations powered by advanced machine learning.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'Connected Healthcare Ecosystem',
      description: 'Seamlessly connect with doctors, pharmacies, labs, hospitals, and insurance providers through a unified platform.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'HIPAA & GDPR compliant with AES-256 encryption, MFA authentication, and patient-controlled data visibility.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Activity,
      title: 'Real-Time Health Monitoring',
      description: 'Track vital signs, medication adherence, and health metrics with smart reminders and automated alerts.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Heart,
      title: 'Personalized Care Plans',
      description: 'Customized diet plans, exercise routines, and treatment recommendations tailored to your specific health needs.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Video,
      title: 'Telemedicine Support',
      description: 'Consult with doctors remotely through secure video calls, eliminating the need for in-person visits when appropriate.',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: FlaskConical,
      title: 'Lab Test Integration',
      description: 'Direct integration with laboratories for seamless test result delivery and comprehensive health analysis.',
      color: 'from-cyan-500 to-cyan-600',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up in minutes with your email. Complete your profile and set up your health preferences.',
      icon: Users,
    },
    {
      step: '02',
      title: 'Connect with Providers',
      description: 'Find and connect with verified doctors, book appointments, and access your medical records.',
      icon: Stethoscope,
    },
    {
      step: '03',
      title: 'Manage Your Health',
      description: 'Track your health metrics, receive AI-powered insights, and manage medications all in one place.',
      icon: Activity,
    },
    {
      step: '04',
      title: 'Stay Informed',
      description: 'Get personalized recommendations, health alerts, and access to your complete medical history anytime.',
      icon: Brain,
    },
  ];

  const benefits = [
    {
      title: 'For Patients',
      items: [
        'Lifetime access to all medical records',
        'AI-powered health insights and predictions',
        'Easy appointment booking and management',
        'Medication reminders and tracking',
        'Secure communication with healthcare providers',
        'Prescription delivery to your doorstep',
      ],
    },
    {
      title: 'For Doctors',
      items: [
        'Comprehensive patient history at your fingertips',
        'Digital prescription management',
        'Efficient appointment scheduling',
        'Telemedicine capabilities',
        'Patient consent management',
        'Analytics and reporting tools',
      ],
    },
    {
      title: 'For Pharmacies',
      items: [
        'Online medicine catalog',
        'Prescription verification system',
        'Order management and tracking',
        'Refill reminders for patients',
        'Alternative medicine suggestions',
        'Secure payment processing',
      ],
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Patients', icon: Users },
    { number: '500+', label: 'Verified Doctors', icon: Stethoscope },
    { number: '50K+', label: 'Medical Records', icon: FileText },
    { number: '99.9%', label: 'Uptime', icon: Shield },
  ];

  // Don't render landing page content if user is a doctor (will be redirected)
  if (isAuthenticated && user?.role === 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
          {/* Animated Background Lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Green Lines */}
            <div className="absolute top-0 left-0 w-full h-full">
              {[10, 30, 50, 70, 90].map((left, idx) => (
                <motion.div
                  key={`green-${idx}`}
                  className="absolute w-1 bg-success-500 opacity-20"
                  style={{ left: `${left}%`, height: '100%' }}
                  animate={{ y: idx % 2 === 0 ? [0, -100, 0] : [0, 100, 0] }}
                  transition={{ duration: 7 + idx, repeat: Infinity, ease: 'linear' }}
                />
              ))}
            </div>

            {/* Yellow Lines */}
            <div className="absolute top-0 left-0 w-full h-full">
              {[15, 40, 60, 85].map((left, idx) => (
                <motion.div
                  key={`yellow-${idx}`}
                  className="absolute w-1 bg-warning-400 opacity-25"
                  style={{ left: `${left}%`, height: '105%' }}
                  animate={{ y: idx % 2 === 0 ? [0, 110, 0] : [0, -95, 0] }}
                  transition={{ duration: 8 + idx, repeat: Infinity, ease: 'linear' }}
                />
              ))}
            </div>
          </div>

          <div className="container-custom relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6">
                  <TypingAnimation
                    text="Your Complete Healthcare Management Platform"
                    speed={50}
                    className="block"
                  />
                </h1>
                <p className="text-lg md:text-xl text-secondary-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                  Secure, AI-powered healthcare connecting patients, doctors, pharmacies, and labs through a unified digital ecosystem.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/auth/register">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/doctors">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                      Find a Doctor
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative w-full h-[500px] lg:h-[600px]"
              >
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/hero-image.jpg"
                    alt="Healthcare Management Platform"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full z-10"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full z-10"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">{stat.number}</h3>
                    <p className="text-secondary-600 font-medium">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Doctors Carousel */}
        {!loading && doctors.length > 0 && (
          <section className="py-20 bg-white relative overflow-hidden">
            <div className="container-custom">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                  Our Featured Doctors
                </h2>
                <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                  Meet our team of experienced and verified healthcare professionals
                </p>
              </motion.div>

              <div
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {doctors.length > 3 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 transition-colors border border-secondary-200"
                      aria-label="Previous doctors"
                    >
                      <ChevronLeft className="w-6 h-6 text-secondary-700" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 transition-colors border border-secondary-200"
                      aria-label="Next doctors"
                    >
                      <ChevronRight className="w-6 h-6 text-secondary-700" />
                    </button>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                  <AnimatePresence mode="wait">
                    {visibleDoctors.map((doctor, index) => (
                      <motion.div
                        key={`${doctor.id}-${currentIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.1,
                          ease: "easeInOut"
                        }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className="bg-white rounded-2xl p-6 border border-secondary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => router.push(`/doctors?id=${doctor.id}`)}
                      >
                        <div className="flex items-start space-x-4 mb-4">
                          {doctor.profileImage ? (
                            <img
                              src={doctor.profileImage.startsWith('http') ? doctor.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${doctor.profileImage}`}
                              alt={doctor.name || doctor.specialization}
                              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-primary-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-lg">
                                {(doctor.name || doctor.specialization).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-secondary-900 truncate">
                                {doctor.name || `Dr. ${doctor.specialization}`}
                              </h3>
                              {doctor.isVerified && (
                                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-primary-600 font-medium mb-2">
                              {doctor.specialization}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-secondary-600">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-warning-500 fill-warning-500 mr-1" />
                                <span className="font-medium">{Number(doctor.rating || 0).toFixed(1)}</span>
                                <span className="ml-1">({doctor.totalReviews || 0})</span>
                              </div>
                              <span>•</span>
                              <span>{doctor.experience || 0} yrs exp</span>
                            </div>
                          </div>
                        </div>

                        {doctor.address?.city && (
                          <div className="flex items-center text-sm text-secondary-600 mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{doctor.address.city}{doctor.address.state ? `, ${doctor.address.state}` : ''}</span>
                          </div>
                        )}

                        {(doctor.hospital || doctor.clinic) && (
                          <p className="text-sm text-secondary-600 mb-4 truncate">
                            {doctor.hospital || doctor.clinic}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                          <div>
                            <p className="text-xs text-secondary-500">Consultation Fee</p>
                            <p className="text-lg font-bold text-primary-600">৳{Number(doctor.consultationFee || 0).toFixed(2)}</p>
                          </div>
                          <Link href={`/doctors?id=${doctor.id}`}>
                            <Button size="sm" className="text-xs px-4 py-2">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {doctors.length > 3 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    {Array.from({ length: Math.ceil(doctors.length / 3) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                          ? 'bg-primary-600 w-8'
                          : 'bg-secondary-300 hover:bg-secondary-400'
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center mt-12">
                <Link href="/doctors">
                  <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                    View All Doctors
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Medicine Shop Section */}
        <section className="py-20 bg-gradient-to-br from-white to-secondary-50">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6 order-2 md:order-1"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-secondary-900">
                  Online Medicine Shop
                </h2>
                <p className="text-xl text-secondary-600">
                  Order your prescribed medications online with fast delivery. Browse through our extensive
                  catalog of medicines, compare prices, check for drug interactions, and get your prescriptions
                  delivered to your doorstep with secure payment processing.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-lg text-secondary-700">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 flex-shrink-0" />
                    Wide range of branded and generic medicines
                  </li>
                  <li className="flex items-center text-lg text-secondary-700">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 flex-shrink-0" />
                    Fast and secure delivery with tracking
                  </li>
                  <li className="flex items-center text-lg text-secondary-700">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 flex-shrink-0" />
                    Prescription verification and refill reminders
                  </li>
                  <li className="flex items-center text-lg text-secondary-700">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 flex-shrink-0" />
                    Drug interaction checker for safety
                  </li>
                </ul>
                <Link href="/medicines">
                  <Button size="lg" className="mt-6 text-lg px-8 py-4">
                    Shop Medicines
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative order-1 md:order-2"
              >
                <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/medicine-image.jpg"
                    alt="Medicine Shop"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Lab Section */}
        <LabSection />

        {/* Price Transparency Section */}
        <PriceTransparency />

        {/* Lab Awareness Section */}
        <LabAwareness />

        {/* Features Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="container-custom relative">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none"
              style={{ backgroundImage: 'url(/hero-image.jpg)' }}
            ></div>

            <div className="relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                  Comprehensive Healthcare Features
                </h2>
                <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
                  Everything you need to manage your health, all in one secure, AI-powered platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="group"
                    >
                      <div className="bg-white rounded-2xl p-6 border border-secondary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 h-full">
                        <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-secondary-900 mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-secondary-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-black">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-white max-w-3xl mx-auto">
                Get started in minutes and take control of your healthcare journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="relative"
                  >
                    <div className="bg-secondary-800 rounded-2xl p-8 border border-secondary-700 hover:shadow-xl hover:border-primary-500 transition-all duration-300 text-center h-full">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="mt-6 mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-primary-600/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-8 h-8 text-primary-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
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

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-secondary-900 to-secondary-800 text-white text-center">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Healthcare Experience?
              </h2>
              <p className="text-xl text-secondary-300 mb-10 max-w-2xl mx-auto">
                Join thousands of patients, doctors, and healthcare providers who trust Lifecare360 for their healthcare management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="px-8 py-4 bg-white text-primary-600 hover:bg-secondary-100">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/doctors">
                  <Button variant="secondary" size="lg" className="px-8 py-4 border-white/30 text-white hover:bg-white/10">
                    Find a Doctor
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
