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

export default function PharmacyDashboardPage() {
    const { user } = useAuthStore();
    const userName = user?.profile?.firstName || user?.email?.split('@')[0] || 'User';

    // Get data from pharmacy store
    const medicines = usePharmacyStore((state) => state.medicines);
    const prescriptions = usePharmacyStore((state) => state.prescriptions);
    const orders = usePharmacyStore((state) => state.orders);
    const backendStats = usePharmacyStore((state) => state.stats);

    // Get actions from pharmacy store
    const addMedicine = usePharmacyStore((state) => state.addMedicine);
    const updateMedicine = usePharmacyStore((state) => state.updateMedicine);
    const deleteMedicine = usePharmacyStore((state) => state.deleteMedicine);
    const updatePrescription = usePharmacyStore((state) => state.updatePrescription);

    // Fetch actions
    const fetchMedicines = usePharmacyStore((state) => state.fetchMedicines);
    const fetchPrescriptions = usePharmacyStore((state) => state.fetchPrescriptions);
    const fetchOrders = usePharmacyStore((state) => state.fetchOrders);
    const fetchStats = usePharmacyStore((state) => state.fetchStats);

    // Fetch data on mount
    React.useEffect(() => {
        fetchMedicines();
        fetchPrescriptions();
        fetchOrders();
        fetchStats();
    }, [fetchMedicines, fetchPrescriptions, fetchOrders, fetchStats]);

    // Convert medicines to InventoryItem format for the InventoryTable component
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

    // Helper function to update inventory (converts back to Medicine format)
    const setInventory = (updater: React.SetStateAction<InventoryItem[]>) => {
        const newInventory = typeof updater === 'function' ? updater(inventory) : updater;

        // Find which items were added, updated, or deleted
        const currentIds = new Set(inventory.map(i => i.id));
        const newIds = new Set(newInventory.map(i => i.id));

        // Handle additions
        newInventory.forEach(item => {
            if (!currentIds.has(item.id)) {
                addMedicine({
                    name: item.name,
                    generic: item.generic,
                    stock: item.stock,
                    unit: item.unit,
                    expiry: item.expiry,
                    price: item.price,
                    category: '', // Default category
                    status: item.status
                });
            } else {
                // Handle updates
                const oldItem = inventory.find(i => i.id === item.id);
                if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(item)) {
                    updateMedicine(item.id, item);
                }
            }
        });

        // Handle deletions
        inventory.forEach(item => {
            if (!newIds.has(item.id)) {
                deleteMedicine(item.id);
            }
        });
    };

    // Helper function to update prescriptions
    const setPrescriptions = (updater: React.SetStateAction<Prescription[]>) => {
        // Since we are using store actions, we might directly call updatePrescription
        // But the PrescriptionList component expects this setter style.
        // We'll trust the store will update via websocket or re-fetch in real app, 
        // but for now local optimistic update via store.

        // This is tricky because React state setters are synchronous for local state, 
        // but here we are interfacing with a store.
        // The PrescriptionList probably modifies the local array and calls setPrescriptions.
        // We really should just handle the specific update logic if possible.
        // But let's leave it compatible.

        // Actually, PrescriptionList likely just calls onEdit/onDelete/onStatusChange props if available?
        // Let's check imports. It imports `PrescriptionList` and `type Prescription`.
    };

    // Dynamic Stats Calculation - Use backend stats if available
    const stats = useMemo(() => {
        if (backendStats) {
            return [
                {
                    name: 'Total Medicines',
                    value: medicines.length,
                    change: 0,
                    changeType: 'neutral' as const,
                    icon: Pill,
                    color: 'text-primary-600',
                    bgColor: 'bg-primary-100',
                },
                {
                    name: 'Low Stock Alerts',
                    value: backendStats.lowStockItems,
                    change: 0,
                    changeType: backendStats.lowStockItems > 0 ? 'warning' as const : 'neutral' as const,
                    icon: AlertTriangle,
                    color: 'text-warning-600',
                    bgColor: 'bg-warning-100',
                    subtitle: backendStats.lowStockItems > 0 ? 'Requires Attention' : 'All Good',
                },
                {
                    name: "Total Sales",
                    value: `৳${backendStats.totalSales.toLocaleString()}`,
                    change: 0,
                    changeType: 'neutral' as const,
                    icon: ShoppingBag,
                    color: 'text-success-600',
                    bgColor: 'bg-success-100',
                },
            ];
        }

        // Fallback to local calculation if backend stats not ready
        const totalMedicines = (medicines || []).length;
        const lowStockCount = (medicines || []).filter(item => item.status === 'low' || item.status === 'critical').length;
        const pendingCount = (prescriptions || []).filter(p => p.status === 'pending').length;

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
                color: 'text-warning-600',
                bgColor: 'bg-warning-100',
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
    }, [medicines, prescriptions, orders, backendStats]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-secondary-900">Pharmacy Dashboard</h1>
                <p className="text-secondary-500 mt-1">
                    Welcome back, {userName}. Here's what's happening today.
                </p>
            </div>

            {/* Summary Cards */}
            <SummaryCards stats={stats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <InventoryTable inventory={inventory} setInventory={setInventory} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <QuickActions />
            </div>
        </div>
    );
}
