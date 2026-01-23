'use client';

import React from 'react';
import Sidebar from '@/components/patient/Sidebar';
import PatientHeader from '@/components/patient/PatientHeader';

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[100dvh] overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <PatientHeader />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
