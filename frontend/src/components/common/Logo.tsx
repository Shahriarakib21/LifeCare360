'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

const sizeConfig = {
    sm: { width: 140, height: 45, textSize: 'text-base' },
    md: { width: 200, height: 70, textSize: 'text-xl' },
    lg: { width: 280, height: 95, textSize: 'text-2xl' },
};

const Logo: React.FC<LogoProps> = ({
    size = 'md',
    className = '',
    showText = false,
    textClassName = ''
}) => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const config = sizeConfig[size];

    // Determine home route based on user role
    const getHomeRoute = () => {
        if (!isAuthenticated || !user) {
            return '/';
        }

        switch (user.role) {
            case 'patient':
                return '/patient/dashboard';
            case 'doctor':
                return '/doctor/dashboard';
            case 'lab':
                return '/lab/dashboard';
            case 'pharmacy':
                return '/pharmacy/dashboard';
            case 'admin':
                return '/admin/dashboard';
            default:
                return '/';
        }
    };

    const homeRoute = getHomeRoute();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(homeRoute);
    };

    return (
        <Link
            href={homeRoute}
            onClick={handleClick}
            className={`flex items-center gap-2 transition-all duration-200 hover:opacity-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg ${className}`}
            aria-label="Navigate to home"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(homeRoute);
                }
            }}
        >
            <div className="relative flex-shrink-0" style={{ width: config.width, height: config.height }}>
                <Image
                    src="/Lifecare360.png"
                    alt="Lifecare360 - Healthcare Platform Logo"
                    fill
                    sizes={`${config.width}px`}
                    priority
                    className="object-contain"
                />
            </div>
            {showText && (
                <span className={`font-bold text-primary-600 ${config.textSize} hidden lg:block ${textClassName}`}>
                    Lifecare360
                </span>
            )}
        </Link>
    );
};

export default Logo;
