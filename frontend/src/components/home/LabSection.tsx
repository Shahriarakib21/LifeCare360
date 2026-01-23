'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlaskConical, MapPin, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface Lab {
    _id: string;
    email: string;
    profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
        location?: {
            city?: string;
            state?: string;
        };
    };
    labDetails?: {
        rating?: number;
        totalReviews?: number;
        services?: string[];
    };
}

const LabSection = () => {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const response = await api.get('/api/public/labs?limit=12');
                setLabs(response.data?.data?.labs || []);
            } catch (error) {
                console.error('Error fetching labs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
    }, []);

    const nextSlide = () => {
        if (labs.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % Math.ceil(labs.length / 4));
    };

    const prevSlide = () => {
        if (labs.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + Math.ceil(labs.length / 4)) % Math.ceil(labs.length / 4));
    };

    const visibleLabs = labs.length > 0 ? labs.slice(currentIndex * 4, currentIndex * 4 + 4) : [];

    if (loading) return null;
    if (labs.length === 0) return null;

    return (
        <section className="py-20 bg-secondary-50">
            <div className="container-custom">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-bold text-secondary-900 mb-4">Partner Laboratories</h2>
                        <p className="text-xl text-secondary-600">
                            Access high-quality diagnostic services from our network of certified partner labs.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-4">
                        <button
                            onClick={prevSlide}
                            className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors border border-secondary-200"
                        >
                            <ChevronLeft className="w-6 h-6 text-secondary-700" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors border border-secondary-200"
                        >
                            <ChevronRight className="w-6 h-6 text-secondary-700" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleLabs.map((lab, index) => (
                        <motion.div
                            key={lab._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white rounded-2xl p-6 border border-secondary-200 hover:shadow-xl transition-all group"
                        >
                            <div className="relative w-20 h-20 mb-6 mx-auto">
                                {lab.profile?.avatar ? (
                                    <img
                                        src={lab.profile.avatar.startsWith('http') ? lab.profile.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${lab.profile.avatar}`}
                                        alt={`${lab.profile.firstName} ${lab.profile.lastName}`}
                                        className="w-full h-full rounded-full object-cover border-4 border-primary-50"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                        <FlaskConical className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-success-500 w-5 h-5 rounded-full border-2 border-white"></div>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors">
                                    {`${lab.profile.firstName} ${lab.profile.lastName}`.trim()}
                                </h3>
                                <div className="flex items-center justify-center gap-2 text-sm text-secondary-500 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{lab.profile.location?.city || 'City not listed'}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                    <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                                    <span className="font-bold text-secondary-900">{lab.labDetails?.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-secondary-500">({lab.labDetails?.totalReviews || 0})</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {(lab.labDetails?.services || ['Lab Visit']).slice(0, 2).map((service, idx) => (
                                    <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-secondary-100 text-secondary-600 rounded-md">
                                        {service}
                                    </span>
                                ))}
                            </div>

                            <Link href={`/labs/${lab._id}`}>
                                <Button variant="secondary" className="w-full group-hover:bg-primary-600 group-hover:text-white transition-all">
                                    View Laboratory
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link href="/labs">
                        <Button size="lg" className="px-10">
                            Browse All Laboratories
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LabSection;
