'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Clock,
  CheckCircle,
  Search,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FlaskConical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/common/Logo';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/lab/dashboard' },
  { icon: Upload, label: 'Upload Test', href: '/lab/upload-report' },
  { icon: Clock, label: 'Pending Tests', href: '/lab/requests' },
  { icon: CheckCircle, label: 'Completed', href: '/lab/completed' },
  { icon: BarChart3, label: 'Revenue', href: '/lab/revenue' },
  { icon: Search, label: 'Patient Search', href: '/lab/patients' },
  { icon: BarChart3, label: 'Analytics', href: '/lab/reports' },
  { icon: Settings, label: 'Settings', href: '/lab/settings' },
];

export default function LabSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-[60] flex flex-col",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="h-[72px] flex items-center justify-center border-b border-gray-200 px-4">
        {isExpanded ? (
          <Logo size="lg" />
        ) : (
          <Logo size="sm" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                isActive && "drop-shadow-sm"
              )} />
              {isExpanded && (
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}

              {/* Active indicator */}
              {isActive && !isExpanded && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Expand/Collapse Toggle */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
