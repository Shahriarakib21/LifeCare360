'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Video, Clock, MapPin, Plus, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

export default function AppointmentsSection({ appointments = [] }: { appointments?: any[] }) {
    const router = useRouter();

    return (
        <Card className="h-full border-none shadow-soft flex flex-col bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-black text-secondary-900 tracking-tight">Appointments</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-600 font-bold hover:bg-primary-50"
                    onClick={() => router.push('/patient/appointments')}
                >
                    See All
                </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                        <ImagePlaceholder type="generic" className="w-20 h-20 rounded-2xl" />
                        <div className="space-y-1">
                            <p className="text-secondary-900 font-black">No Active Schedule</p>
                            <p className="text-sm text-secondary-500 font-medium tracking-tight">Consult with our world-class specialists.</p>
                        </div>
                    </div>
                ) : (
                    appointments.slice(0, 3).map((apt) => (
                        <div key={apt.id || Math.random()} className="group p-5 rounded-3xl bg-secondary-50/50 border border-secondary-100 hover:border-primary-100 hover:bg-white hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-300">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm relative shrink-0">
                                    <ImagePlaceholder type="doctor" className="w-full h-full" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-secondary-900 truncate group-hover:text-primary-600 transition-colors uppercase text-sm tracking-wide">
                                        {apt.doctorName || 'Dr. Specialist'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-secondary-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-secondary-100">
                                            <Calendar className="w-3 h-3 text-primary-500" /> {new Date(apt.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-secondary-100">
                                            <Clock className="w-3 h-3 text-primary-500" /> {apt.time}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                {apt.feeStatus === 'unpaid' || apt.feeStatus === 'pending' ? (
                                    <Button
                                        variant="accent"
                                        fullWidth
                                        className="rounded-xl py-3 text-xs font-black uppercase tracking-widest"
                                        onClick={() => router.push(`/patient/appointments?pay=${apt.id}`)}
                                        leftIcon={<CreditCard className="w-4 h-4" />}
                                    >
                                        Settle Fee (৳{apt.visitFee})
                                    </Button>
                                ) : apt.type === 'video' ? (
                                    <Button fullWidth variant="primary" className="rounded-xl py-3 text-xs font-black uppercase tracking-widest" leftIcon={<Video className="w-4 h-4" />}>
                                        Join Consultation
                                    </Button>
                                ) : (
                                    <Button variant="ghost" className="w-full border border-secondary-200 hover:border-primary-200 text-secondary-600 rounded-xl py-3 text-xs font-black uppercase tracking-widest" leftIcon={<MapPin className="w-4 h-4" />}>
                                        View Location
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-secondary-100">
                <Button
                    variant="ghost"
                    className="w-full border-2 border-dashed border-secondary-200 text-secondary-500 hover:border-primary-500 hover:text-primary-600 rounded-2xl hover:bg-primary-50/50"
                    onClick={() => router.push('/patient/appointments')}
                    leftIcon={<Plus className="w-5 h-5" />}
                >
                    Book New Consultation
                </Button>
            </div>
        </Card>
    );
}
