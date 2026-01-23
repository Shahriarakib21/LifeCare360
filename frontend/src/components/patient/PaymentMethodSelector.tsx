'use client';

import React from 'react';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface PaymentMethodSelectorProps {
    selectedMethod: 'bkash' | 'nagad' | null;
    onSelect: (method: 'bkash' | 'nagad') => void;
}

export default function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
    const methods = [
        {
            id: 'bkash',
            name: 'bKash',
            logo: '/images/payments/bkash.png', // Ensure these exist or use placeholders
            color: 'bg-[#D12053]',
            textColor: 'text-white',
        },
        {
            id: 'nagad',
            name: 'Nagad',
            logo: '/images/payments/nagad.png',
            color: 'bg-[#F7941E]',
            textColor: 'text-white',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((method) => (
                <button
                    key={method.id}
                    onClick={() => onSelect(method.id as 'bkash' | 'nagad')}
                    className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${selectedMethod === method.id
                            ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    {/* Method Name Display (since logos might be missing) */}
                    <div className={`w-16 h-16 rounded-2xl ${method.color} flex items-center justify-center shadow-md`}>
                        <span className="font-black text-xl text-white">{method.name.charAt(0)}</span>
                    </div>

                    <div className="text-center">
                        <span className="block font-black text-slate-900 uppercase tracking-tight">{method.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobile Banking</span>
                    </div>

                    {selectedMethod === method.id && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
