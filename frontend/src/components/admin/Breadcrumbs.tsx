'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    // Skip first 'admin' part if it's there
    const breadcrumbPaths = paths[0] === 'admin' ? paths.slice(1) : paths;

    return (
        <nav className="flex items-center space-x-2 text-sm text-secondary-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/admin/dashboard" className="hover:text-primary-600 transition-colors flex items-center">
                <Home className="w-4 h-4 mr-1" />
                <span>Dashboard</span>
            </Link>

            {breadcrumbPaths.map((path, index) => {
                const href = `/admin/${breadcrumbPaths.slice(0, index + 1).join('/')}`;
                const isLast = index === breadcrumbPaths.length - 1;
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                // Skip showing "dashboard" as it's already represented by the Home icon
                if (path === 'dashboard') return null;

                return (
                    <React.Fragment key={path}>
                        <ChevronRight className="w-4 h-4 text-secondary-400" />
                        {isLast ? (
                            <span className="font-medium text-secondary-900">{label}</span>
                        ) : (
                            <Link href={href} className="hover:text-primary-600 transition-colors">
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
