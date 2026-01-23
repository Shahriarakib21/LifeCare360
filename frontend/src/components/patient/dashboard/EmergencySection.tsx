'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { PhoneCall, AlertCircle } from 'lucide-react';

export default function EmergencySection() {
    const [showSOS, setShowSOS] = React.useState(false);

    const handleEmergencyCall = () => {
        // In a real app, this might trigger a VoIP call or send a WebSocket alert
        // For now, we simulate the action
        setShowSOS(true);
    };

    return (
        <>
            <Card className="bg-rose-50 border-rose-100 flex flex-col justify-center items-center text-center p-6 shadow-none h-full">
                <div className="mb-4 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-rose-900 font-bold text-lg mb-1">Emergency Limit?</h3>
                <p className="text-rose-700/80 text-xs mb-4">Immediate connection to nearest specialist</p>

                <button
                    onClick={handleEmergencyCall}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <PhoneCall className="w-5 h-5" />
                    SOS Emergency
                </button>
            </Card>

            {/* Simple standard modal for confirmation - using standard available UI components if possible, 
                otherwise inline absolute overlay for simplicity in this component scope */}
            {showSOS && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-4">
                            <AlertCircle className="w-8 h-8" />
                            <h3 className="text-xl font-bold">Emergency Alert</h3>
                        </div>
                        <p className="text-slate-600">
                            Connecting you to the nearest emergency responder...
                        </p>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Ambulance</span>
                                <a href="tel:911" className="text-rose-600 font-bold hover:underline">911</a>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Hospital Hotline</span>
                                <a href="tel:1-800-LIFE" className="text-rose-600 font-bold hover:underline">1-800-LIFE</a>
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => setShowSOS(false)}
                                className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600"
                            >
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
