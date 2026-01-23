'use client';

import React from 'react';
import Badge from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'completed' | 'assigned' | 'requested';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    'in-progress': { variant: 'primary' as const, label: 'In Progress' },
    completed: { variant: 'success' as const, label: 'Completed' },
    assigned: { variant: 'primary' as const, label: 'Assigned' },
    requested: { variant: 'warning' as const, label: 'Requested' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}
