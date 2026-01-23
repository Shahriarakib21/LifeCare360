'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle, CreditCard, FlaskConical,
    Stethoscope, ShoppingBag, Clock, ChevronRight
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface PendingPayment {
    invoiceId: string;
    serviceType: 'doctor' | 'lab' | 'pharmacy';
    totalAmount: number;
    itemBreakdown: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    expiresAt: string;
    createdAt: string;
    serviceDetails: {
        appointmentDate?: string;
        appointmentTime?: string;
        doctorName?: string;
        labName?: string;
        testNames?: string[];
        pharmacyName?: string;
        itemCount?: number;
    };
}

interface PendingPaymentAlertProps {
    payment: PendingPayment;
}

export default function PendingPaymentAlert({ payment }: PendingPaymentAlertProps) {
    const router = useRouter();

    // Get service-specific icon and color
    const getServiceConfig = () => {
        switch (payment.serviceType) {
            case 'doctor':
                return {
                    icon: Stethoscope,
                    color: 'cyan',
                    bgColor: 'bg-cyan-50',
                    borderColor: 'border-cyan-200',
                    textColor: 'text-cyan-700',
                    label: 'Doctor Consultation',
                };
            case 'lab':
                return {
                    icon: FlaskConical,
                    color: 'indigo',
                    bgColor: 'bg-indigo-50',
                    borderColor: 'border-indigo-200',
                    textColor: 'text-indigo-700',
                    label: 'Laboratory Test',
                };
            case 'pharmacy':
                return {
                    icon: ShoppingBag,
                    color: 'emerald',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-200',
                    textColor: 'text-emerald-700',
                    label: 'Pharmacy Order',
                };
        }
    };

    const config = getServiceConfig();
    const ServiceIcon = config.icon;

    // Get service-specific details
    const getServiceDetails = () => {
        const { serviceDetails } = payment;

        if (payment.serviceType === 'doctor') {
            return (
                <>
                    <p className="font-bold text-slate-900">{serviceDetails.doctorName}</p>
                    {serviceDetails.appointmentDate && (
                        <p className="text-sm text-slate-600">
                            {formatDate(serviceDetails.appointmentDate)} at {serviceDetails.appointmentTime}
                        </p>
                    )}
                </>
            );
        }

        if (payment.serviceType === 'lab') {
            return (
                <>
                    <p className="font-bold text-slate-900">{serviceDetails.labName}</p>
                    {serviceDetails.testNames && serviceDetails.testNames.length > 0 && (
                        <p className="text-sm text-slate-600">
                            {serviceDetails.testNames.slice(0, 2).join(', ')}
                            {serviceDetails.testNames.length > 2 && ` +${serviceDetails.testNames.length - 2} more`}
                        </p>
                    )}
                </>
            );
        }

        if (payment.serviceType === 'pharmacy') {
            return (
                <>
                    <p className="font-bold text-slate-900">{serviceDetails.pharmacyName}</p>
                    <p className="text-sm text-slate-600">
                        {serviceDetails.itemCount} item{serviceDetails.itemCount !== 1 ? 's' : ''}
                    </p>
                </>
            );
        }
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        const now = new Date();
        const expires = new Date(payment.expiresAt);
        const diff = expires.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes <= 0) return 'Expired';
        if (minutes < 60) return `${minutes} min remaining`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
    };

    const handlePayNow = () => {
        router.push(`/patient/payments?invoiceId=${payment.invoiceId}`);
    };

    return (
        <Card className={`${config.bgColor} ${config.borderColor} border-l-4 shadow-lg hover:shadow-xl transition-all animate-pulse-subtle`}>
            <div className="flex items-start gap-4">
                {/* Service Icon */}
                <div className={`w-14 h-14 rounded-2xl ${config.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <ServiceIcon className={`w-7 h-7 ${config.textColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                            Payment Pending
                        </span>
                    </div>

                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-700 mb-1">
                        {config.label}
                    </h3>

                    <div className="mb-3">
                        {getServiceDetails()}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Amount Due</p>
                            <p className="text-2xl font-black text-slate-900">৳{payment.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                                <Clock className="w-3 h-3" />
                                {getTimeRemaining()}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Invoice: {payment.invoiceId}</p>
                        </div>
                    </div>

                    {/* Pay Now Button */}
                    <Button
                        onClick={handlePayNow}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm h-12 rounded-xl shadow-lg"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
