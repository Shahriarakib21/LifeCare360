import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthInitializer from '@/components/auth/AuthInitializer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HealthLife - Your Complete Healthcare Management Platform',
  description: 'Secure, AI-powered healthcare management system connecting patients, doctors, pharmacies, labs, and insurance providers.',
  keywords: ['healthcare', 'EHR', 'medical records', 'telemedicine', 'health management'],
  authors: [{ name: 'HealthLife' }],
  openGraph: {
    title: 'HealthLife - Your Complete Healthcare Management Platform',
    description: 'Secure, AI-powered healthcare management system',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthInitializer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e293b',
              borderRadius: '12px',
              boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
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
      </body>
    </html>
  );
}

