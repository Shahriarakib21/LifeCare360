'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Video, Clock, MapPin, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AppointmentsSection({ appointments = [] }: { appointments?: any[] }) {
    const router = useRouter();

    return (
        <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Appointments</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    onClick={() => router.push('/patient/appointments')}
                >
                    View All
                </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No appointments scheduled</p>
                        <p className="text-sm text-slate-400 mt-1">Book a consultation with a specialist.</p>
                    </div>
                ) : (
                    appointments.slice(0, 3).map((apt) => (
                        <div key={apt.id || Math.random()} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-100 hover:bg-teal-50/30 transition-all duration-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                                    <User className="w-6 h-6" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{apt.doctorName || 'Unknown Doctor'}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{apt.doctorSpecialty || 'General Physician'}</p>

                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                            <Calendar className="w-3 h-3 text-teal-500" /> {new Date(apt.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                            <Clock className="w-3 h-3 text-teal-500" /> {apt.time}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                {apt.feeStatus === 'unpaid' || apt.feeStatus === 'pending' ? (
                                    <Button
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 h-auto text-sm"
                                        onClick={() => router.push(`/patient/appointments?pay=${apt.id}`)}
                                    >
                                        <Clock className="w-4 h-4 mr-2" /> Pay Now (৳{apt.visitFee})
                                    </Button>
                                ) : apt.type === 'video' ? (
                                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 h-auto text-sm">
                                        <Video className="w-4 h-4 mr-2" /> Join Call
                                    </Button>
                                ) : (
                                    <Button variant="ghost" className="w-full border border-slate-200 hover:border-teal-200 hover:bg-teal-50 text-slate-600 rounded-xl py-2 h-auto text-sm">
                                        <MapPin className="w-4 h-4 mr-2" /> Directions
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className="w-full border border-dashed border-slate-300 text-slate-500 hover:border-teal-500 hover:text-teal-600 rounded-xl"
                    onClick={() => router.push('/patient/appointments')}
                >
                    + Book New Appointment
                </Button>
            </div>
        </Card>
    );
}
