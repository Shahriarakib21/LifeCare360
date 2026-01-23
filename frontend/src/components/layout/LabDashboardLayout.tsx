'use client';

import React from 'react';
import LabSidebar from './LabSidebar';
import LabHeader from './LabHeader';

interface LabDashboardLayoutProps {
    children: React.ReactNode;
}

const LabDashboardLayout = ({ children }: LabDashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#070b14] text-white">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px]" />
            </div>

            <LabSidebar />

            <div className="pl-64 flex flex-col min-h-screen">
                <LabHeader />

                <main className="flex-1 mt-20 p-8 relative z-10">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>

                <footer className="py-6 px-8 border-t border-white/5 text-center text-gray-500 text-xs">
                    <p>© 2025 HEALTHCARE Laboratory Information Management System. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LabDashboardLayout;
