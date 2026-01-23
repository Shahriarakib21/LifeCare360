'use client';

import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1e293b',
          borderRadius: '12px',
          boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

