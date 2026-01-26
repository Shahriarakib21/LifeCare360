'use client';

// Pharmacy Dashboard Page
import React, { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { SummaryCards } from '@/components/pharmacy/SummaryCards';
import { PrescriptionList, type Prescription } from '@/components/pharmacy/PrescriptionList';
import { InventoryTable, type InventoryItem } from '@/components/pharmacy/InventoryTable';
import { QuickActions } from '@/components/pharmacy/QuickActions';
import { Pill, AlertTriangle, ShoppingBag, FileClock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

export default function PharmacyDashboardPage() {
    const { user } = useAuthStore();
    const userName = user?.profile?.firstName || user?.email?.split('@')[0] || 'Technician';

    const medicines = usePharmacyStore((state) => state.medicines);
    const prescriptions = usePharmacyStore((state) => state.prescriptions);
    const orders = usePharmacyStore((state) => state.orders);
    const backendStats = usePharmacyStore((state) => state.stats);

    const addMedicine = usePharmacyStore((state) => state.addMedicine);
    const updateMedicine = usePharmacyStore((state) => state.updateMedicine);
    const deleteMedicine = usePharmacyStore((state) => state.deleteMedicine);

    const fetchMedicines = usePharmacyStore((state) => state.fetchMedicines);
    const fetchPrescriptions = usePharmacyStore((state) => state.fetchPrescriptions);
    const fetchOrders = usePharmacyStore((state) => state.fetchOrders);
    const fetchStats = usePharmacyStore((state) => state.fetchStats);

    React.useEffect(() => {
        fetchMedicines();
        fetchPrescriptions();
        fetchOrders();
        fetchStats();
    }, [fetchMedicines, fetchPrescriptions, fetchOrders, fetchStats]);

    const inventory: InventoryItem[] = (medicines || []).map(m => ({
        id: m.id,
        name: m.name,
        generic: m.generic,
        stock: m.stock,
        unit: m.unit,
        expiry: m.expiry,
        price: m.price,
        status: m.status
    }));

    const setInventory = React.useCallback((updater: React.SetStateAction<InventoryItem[]>) => {
        const newInventory = typeof updater === 'function' ? updater(inventory) : updater;
        const currentIds = new Set(inventory.map(i => i.id));
        const newIds = new Set(newInventory.map(i => i.id));

        newInventory.forEach(item => {
            if (!currentIds.has(item.id)) {
                addMedicine({
                    name: item.name,
                    generic: item.generic,
                    stock: item.stock,
                    unit: item.unit,
                    expiry: item.expiry,
                    price: item.price,
                    category: '',
                    status: item.status
                });
            } else {
                const oldItem = inventory.find(i => i.id === item.id);
                if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(item)) {
                    updateMedicine(item.id, item);
                }
            }
        });

        inventory.forEach(item => {
            if (!newIds.has(item.id)) {
                deleteMedicine(item.id);
            }
        });
    }, [inventory, addMedicine, updateMedicine, deleteMedicine]);

    const stats = useMemo(() => {
        if (backendStats) {
            return [
                {
                    name: 'Inventory Count',
                    value: medicines.length,
                    change: 0,
                    changeType: 'neutral' as const,
                    icon: Pill,
                    color: 'text-primary-600',
                    bgColor: 'bg-primary-100',
                    subtitle: 'Medicines tracked'
                },
                {
                    name: 'Shortage Alerts',
                    value: backendStats.lowStockItems,
                    change: 0,
                    changeType: backendStats.lowStockItems > 0 ? 'warning' as const : 'neutral' as const,
                    icon: AlertTriangle,
                    color: 'text-error-600',
                    bgColor: 'bg-error-100',
                    subtitle: backendStats.lowStockItems > 0 ? 'Requires Restock' : 'Stock Optimal',
                },
                {
                    name: "Gross Yield",
                    value: `৳${backendStats.totalSales.toLocaleString()}`,
                    change: 0,
                    changeType: 'neutral' as const,
                    icon: ShoppingBag,
                    color: 'text-success-600',
                    bgColor: 'bg-success-100',
                    subtitle: 'Total operational sales'
                },
            ];
        }

        const totalMedicines = (medicines || []).length;
        const lowStockCount = (medicines || []).filter(item => item.status === 'low' || item.status === 'critical').length;

        return [
            {
                name: 'Total Medicines',
                value: totalMedicines,
                change: 0,
                changeType: 'neutral' as const,
                icon: Pill,
                color: 'text-primary-600',
                bgColor: 'bg-primary-100',
            },
            {
                name: 'Low Stock Alerts',
                value: lowStockCount,
                change: 0,
                changeType: lowStockCount > 0 ? 'warning' as const : 'neutral' as const,
                icon: AlertTriangle,
                color: 'text-error-600',
                bgColor: 'bg-error-100',
                subtitle: lowStockCount > 0 ? 'Requires Attention' : 'All Good',
            },
            {
                name: "Total Orders",
                value: (orders || []).length,
                change: 0,
                changeType: 'neutral' as const,
                icon: ShoppingBag,
                color: 'text-success-600',
                bgColor: 'bg-success-100',
            },
        ];
    }, [medicines, orders, backendStats]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 pb-20"
        >
            {/* High-Fidelity Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-br from-secondary-800 to-secondary-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                            <ShoppingBag className="w-5 h-5 text-primary-400" />
                        </div>
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] leading-none">Pharmaceutical Operations</p>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        Inventory <span className="opacity-40">Intelligence</span>
                    </h1>
                    <p className="text-secondary-300 text-lg font-medium opacity-80">Welcome back, {userName}. Your pharmacy is currently managing {medicines.length} unique SKU records.</p>
                </div>
                <div className="relative z-10">
                    <Button variant="primary" className="rounded-2xl px-10 py-6 text-xs font-black uppercase tracking-widest bg-white text-secondary-900 hover:bg-secondary-50 shadow-xl">
                        Register Intake
                    </Button>
                </div>
            </div>

            {/* Metrics Section */}
            <SummaryCards stats={stats} />

            {/* Inventory Ecosystem */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <InventoryTable inventory={inventory} setInventory={setInventory} />
                </div>
                <div className="space-y-8">
                    <QuickActions />
                    <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
                        <h3 className="text-xl font-black text-secondary-900 tracking-tight mb-8 uppercase text-xs tracking-widest text-primary-600">Stock Velocity</h3>
                        <div className="space-y-6">
                            {[
                                { label: "Fast Moving", val: "78%", color: "bg-success-500" },
                                { label: "Standard", val: "45%", color: "bg-primary-500" },
                                { label: "Critical Low", val: "12%", color: "bg-error-500" },
                            ].map((item) => (
                                <div key={item.label} className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-secondary-400">{item.label}</span>
                                        <span className="text-secondary-900">{item.val}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: item.val }}
                                            className={cn("h-full rounded-full", item.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
