'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function DoctorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Doctor dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-error-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              Dashboard Error
            </h1>
            <p className="text-secondary-600 mb-6">
              {error.message || 'Failed to load dashboard. Please try again.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Link href="/">
                <Button variant="secondary">
                  <Home className="w-4 h-4 mr-2" />
                  Go home
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

