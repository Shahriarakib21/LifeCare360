'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    User,
    Image as ImageIcon,
    Building2,
    FlaskConical,
    Pill,
    FileText,
    Activity
} from 'lucide-react';

type PlaceholderType = 'avatar' | 'banner' | 'product' | 'lab' | 'doctor' | 'hospital' | 'blog' | 'generic';

interface ImagePlaceholderProps {
    type?: PlaceholderType;
    className?: string;
    iconClassName?: string;
    animate?: boolean;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
    type = 'generic',
    className = '',
    iconClassName = '',
    animate = true
}) => {
    const getIcon = () => {
        switch (type) {
            case 'avatar':
            case 'doctor':
                return <User className={cn("w-1/3 h-1/3", iconClassName)} />;
            case 'hospital':
                return <Building2 className={cn("w-1/3 h-1/3", iconClassName)} />;
            case 'lab':
                return <FlaskConical className={cn("w-1/3 h-1/3", iconClassName)} />;
            case 'product':
                return <Pill className={cn("w-1/3 h-1/3", iconClassName)} />;
            case 'blog':
                return <FileText className={cn("w-1/3 h-1/3", iconClassName)} />;
            case 'generic':
            case 'banner':
            default:
                return <ImageIcon className={cn("w-1/3 h-1/3", iconClassName)} />;
        }
    };

    const getBackgroundStyles = () => {
        switch (type) {
            case 'avatar':
            case 'doctor':
                return 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-400';
            case 'lab':
                return 'bg-gradient-to-br from-secondary-50 to-secondary-100 text-secondary-400';
            case 'product':
                return 'bg-gradient-to-br from-green-50 to-green-100 text-green-400';
            default:
                return 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400';
        }
    };

    return (
        <div
            className={cn(
                "relative flex items-center justify-center overflow-hidden transition-all duration-500",
                getBackgroundStyles(),
                animate && "animate-pulse",
                className
            )}
        >
            <div className="absolute inset-0 opacity-10 blur-3xl bg-white animate-slow-pan"></div>
            {getIcon()}
            <div className="absolute inset-0 border border-black/5 rounded-[inherit]"></div>
        </div>
    );
};

export default ImagePlaceholder;
