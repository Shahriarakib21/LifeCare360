import React from 'react';
import LabSidebar from '@/components/lab/LabSidebar';
import LabHeader from '@/components/lab/LabHeader';

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30">
      <LabSidebar />
      <LabHeader />

      <main className="ml-20 pt-[72px] min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
