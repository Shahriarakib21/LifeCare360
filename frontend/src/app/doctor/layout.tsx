'use client';

import React from 'react';
import DoctorSidebar from '@/components/doctor/DoctorSidebar';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <DoctorSidebar />
      <main className="flex-1 overflow-y-auto" style={{ height: '100vh', maxHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
