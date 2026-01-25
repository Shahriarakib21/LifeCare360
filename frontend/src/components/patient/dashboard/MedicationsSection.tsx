'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Pill, ShoppingCart, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

export default function MedicationsSection({ medications = [] }: { medications?: any[] }) {
    const router = useRouter();

    const displayMeds = React.useMemo(() => {
        const list: any[] = [];
        medications.forEach(record => {
            const pData = record.data?.prescription;
            if (!pData) return;

            if (pData.medications && Array.isArray(pData.medications)) {
                pData.medications.forEach((m: any) => list.push(m));
            } else if (pData.medication) {
                list.push({
                    name: pData.medication,
                    dosage: pData.dosage,
                    instruction: pData.instructions || pData.frequency
                });
            }
        });
        return list.slice(0, 3);
    }, [medications]);

    return (
        <Card className="h-full border-none shadow-soft flex flex-col bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-black text-secondary-900 tracking-tight">Active Pills</h2>
                </div>
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl bg-secondary-50 text-secondary-500 hover:bg-secondary-100 p-0" onClick={() => router.push('/patient/medications')}>
                    <RefreshCcw className="w-5 h-5" />
                </Button>
            </div>

            <div className="space-y-4">
                {displayMeds.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                        <ImagePlaceholder type="product" className="w-16 h-16 rounded-2xl mx-auto opacity-50" />
                        <p className="text-sm font-black text-secondary-400 uppercase tracking-widest">No Active Rx</p>
                    </div>
                ) : (
                    displayMeds.map((med, idx) => (
                        <div key={idx} className="group flex items-center gap-4 p-4 rounded-3xl bg-green-50/30 border border-green-100 hover:border-green-200 hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-white shadow-sm flex items-center justify-center border border-green-100 group-hover:scale-110 transition-transform">
                                <Pill className="w-6 h-6 text-green-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-secondary-900 truncate uppercase tracking-tight group-hover:text-green-600 transition-colors">
                                    {med.name}
                                </h4>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">
                                    {med.dosage || 'Standard'} • {med.instruction || 'As Directed'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-secondary-100">
                <Button
                    fullWidth
                    variant="primary"
                    className="rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-lg"
                    onClick={() => router.push('/medicines')}
                    leftIcon={<ShoppingCart className="w-4 h-4" />}
                >
                    Order Refills
                </Button>
            </div>
        </Card>
    );
}
