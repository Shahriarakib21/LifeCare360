'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Pill,
  FileText,
  ShoppingBag,
  Users,
  RefreshCcw,
  BarChart,
  Settings,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/common/Logo';

const navigation = [
  { name: 'Dashboard', href: '/pharmacy', icon: LayoutDashboard },
  { name: 'Medicine Inventory', href: '/pharmacy/inventory', icon: Pill },
  { name: 'Orders', href: '/pharmacy/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/pharmacy/customers', icon: Users },
  { name: 'Refills', href: '/pharmacy/refills', icon: RefreshCcw },
  { name: 'Reports', href: '/pharmacy/reports', icon: BarChart },
  { name: 'Settings', href: '/pharmacy/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-secondary-100">
      <div className="flex items-center justify-center h-20 border-b border-secondary-100">
        <Logo size="lg" />
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              )}
            >
              <Icon className={clsx('w-5 h-5', isActive ? 'text-primary-600' : 'text-secondary-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-secondary-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-error-600 rounded-lg hover:bg-error-50 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
