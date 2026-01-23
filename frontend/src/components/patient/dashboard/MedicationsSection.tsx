'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Pill, AlertCircle, ShoppingCart, RefreshCcw, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MedicationsSection({ medications = [] }: { medications?: any[] }) {
    const router = useRouter();

    // Flatten medications from EHR records
    const displayMeds = React.useMemo(() => {
        const list: any[] = [];
        medications.forEach(record => {
            const pData = record.data?.prescription;
            if (!pData) return;

            if (pData.medications && Array.isArray(pData.medications)) {
                pData.medications.forEach((m: any) => list.push(m));
            } else if (pData.medication) {
                // Legacy format
                list.push({
                    name: pData.medication,
                    dosage: pData.dosage,
                    instruction: pData.instructions || pData.frequency
                });
            }
        });
        return list.slice(0, 3); // Take top 3
    }, [medications]);

    return (
        <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Medicines</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 p-0" onClick={() => router.push('/patient/medications')}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {displayMeds.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active medications.</p>
                    </div>
                ) : (
                    displayMeds.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500`}>
                                <Pill className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-slate-900 truncate">{med.name}</h4>
                                </div>
                                <p className="text-xs text-slate-500">{med.dosage || ''} {med.instruction ? `• ${med.instruction}` : ''}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => router.push('/pharmacy')}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Order Medicines
                </Button>
            </div>
        </Card>
    );
}
