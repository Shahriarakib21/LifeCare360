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
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
        xl: 'h-24',
        header: 'h-8 md:h-11', // Mobile 32px, Desktop 44px
        auth: 'h-12 md:h-18',   // Mobile 48px, Desktop 72px
        sidebar: 'w-full max-w-[120px]',
        footer: 'h-6 md:h-7',   // 24-28px
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
            <div className={cn("relative flex-shrink-0", sizeClasses[size as keyof typeof sizeClasses])}>
                <Image
                    src={variant === 'horizontal' ? '/logo_horizontal.png' : '/logo_square.png'}
                    alt="LifeCare360 Logo"
                    width={500}
                    height={500}
                    priority
                    className={cn(
                        "object-contain w-auto h-full transition-all duration-300",
                        theme === 'dark' && "brightness-0 invert",
                        theme === 'light' && "brightness-0",
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
