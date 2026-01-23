'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBgColor = 'bg-primary-50',
  trend,
}: StatCardProps) {
  return (
    <Card padding="lg" hover>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-secondary-500 text-xs font-medium uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-success-600' : 'text-error-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
