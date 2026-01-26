'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'header' | 'auth' | 'sidebar' | 'footer';
    variant?: 'square' | 'horizontal';
    theme?: 'light' | 'dark' | 'none'; // 'dark' theme means logo for dark background (displays white)
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({
    size = 'md',
    variant = 'square',
    theme = 'none',
    className = '',
    showText = false,
    textClassName = ''
}) => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const getHomeRoute = () => {
        if (!isAuthenticated || !user) return '/';
        const routes: Record<string, string> = {
            patient: '/patient/dashboard',
            doctor: '/doctor/dashboard',
            lab: '/lab/dashboard',
            pharmacy: '/pharmacy/dashboard',
            admin: '/admin/dashboard',
            hospital: '/hospital/dashboard',
            insurance: '/insurance/dashboard',
        };
        return routes[user.role] || '/';
    };

    const homeRoute = getHomeRoute();

    // Map standardized sizes to Tailwind classes or style objects
    const sizeClasses = {
        sm: 'h-8 w-auto',
        md: 'h-12 w-auto',
        lg: 'h-16 w-auto',
        xl: 'h-24 w-auto',
        header: 'h-8 md:h-11 w-auto', // Mobile 32px, Desktop 44px
        auth: 'h-16 md:h-20 w-auto',   // Increased size for auth pages
        sidebar: 'h-12 md:h-14 w-auto', // Fixed sidebar logo height
        footer: 'h-6 md:h-7 w-auto',   // 24-28px
    };

    return (
        <Link
            href={homeRoute}
            className={cn(
                "flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none rounded-xl p-1",
                className
            )}
            aria-label="LifeCare360 Home"
        >
            <div className={cn("relative flex-shrink-0 flex items-center justify-center", sizeClasses[size as keyof typeof sizeClasses])}>
                <Image
                    src={variant === 'horizontal' ? '/logo_horizontal.png' : '/logo_square.png'}
                    alt="LifeCare360 Logo"
                    width={500}
                    height={500}
                    priority
                    className={cn(
                        "object-contain h-full w-auto transition-all duration-300",
                        theme === 'dark' && "brightness-0 invert",
                        theme === 'light' && "brightness-100", // Ensure no darkening for light theme
                    )}
                />
            </div>
            {showText && (
                <span className={cn(
                    "font-bold text-primary-600 tracking-tight",
                    size === 'sm' || size === 'footer' ? 'text-lg' : 'text-xl',
                    textClassName
                )}>
                    LifeCare360
                </span>
            )}
        </Link>
    );
};

export default Logo;
