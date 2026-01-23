import Link from 'next/link';
import { Shield, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-error-600" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Access Denied
          </h1>
          <p className="text-secondary-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

