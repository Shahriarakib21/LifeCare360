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
        "fixed left-0 top-0 h-screen bg-secondary-900 transition-all duration-500 z-[60] flex flex-col shadow-2xl",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="h-[80px] flex items-center justify-center border-b border-white/5 px-4 bg-white/5 backdrop-blur-xl">
        {isExpanded ? (
          <Logo size="sidebar" />
        ) : (
          <Logo size="sm" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-3 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 group relative",
                isActive
                  ? "bg-primary-500 text-white shadow-xl shadow-primary-500/20"
                  : "text-secondary-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:scale-110",
                isActive && "drop-shadow-sm"
              )} />
              {isExpanded && (
                <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>
              )}

              {/* Active indicator */}
              {isActive && !isExpanded && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-l-full shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Expand/Collapse Toggle */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-secondary-500 hover:bg-white/5 hover:text-white transition-all group"
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Minimize</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>
    </aside>
  );
}
