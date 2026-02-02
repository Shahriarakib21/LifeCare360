import { create } from 'zustand';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Medicine {
    id: number;
    name: string;
    generic: string;
    stock: number;
    unit: string;
    expiry: string;
    price: string;
    category: string;
    status: 'in-stock' | 'low' | 'critical' | 'expiring';
    description?: string;
    manufacturer?: string;
    storageConditions?: string;
}

export interface Prescription {
    id: string; // Mongo ID
    patientName: string;
    doctorName: string;
    date: string;
    medicines: Array<{
        name: string;
        dosage: string;
        quantity: number;
        frequency?: string;
        duration?: string;
    }>;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export interface Order {
    id: number;
    patientId: string;
    patientName?: string;
    items: Array<{
        medicineId: number;
        name: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
    paymentStatus: string;
    createdAt: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile?: any;
    createdAt: string;
    totalOrders?: number;
    lastVisit?: string;
}

export interface DashboardStats {
    totalSales: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockItems: number;
    newCustomers: number;
}

export interface Refill {
    id: string;
    patientName: string;
    medication: string;
    prescriptionId: string;
    requestDate: string;
    lastFillDate: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    quantity: number;
    refillsRemaining: number;
}

interface PharmacyState {
    medicines: Medicine[];
    prescriptions: Prescription[];
    customers: Customer[];
    orders: Order[];
    stats: DashboardStats | null;
    refills: Refill[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchMedicines: (query?: string) => Promise<void>;
    addMedicine: (medicine: Partial<Medicine>) => Promise<void>;
    updateMedicine: (id: number, medicine: Partial<Medicine>) => Promise<void>;
    deleteMedicine: (id: number) => Promise<void>;

    fetchPrescriptions: () => Promise<void>;
    addPrescription: (prescription: any) => Promise<void>;
    updatePrescription: (id: string, updates: any) => Promise<void>;
    deletePrescription: (id: string) => Promise<void>;

    fetchOrders: (status?: string, patientId?: string) => Promise<void>;
    addOrder: (order: Partial<Order>) => Promise<void>;
    updateOrderStatus: (id: number, status: string, paymentStatus?: string) => Promise<void>;

    fetchCustomers: () => Promise<void>;

    fetchStats: () => Promise<void>;

    fetchRefills: () => Promise<void>;
    updateRefill: (id: string, updates: any) => Promise<void>;
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
    medicines: [],
    prescriptions: [],
    customers: [],
    orders: [],
    stats: null,
    refills: [],
    isLoading: false,
    error: null,

    fetchMedicines: async (query = '') => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/pharmacy/medicines/search?q=${query}&limit=100`);
            const backendMedicines = response.data.data.medicines;

            const medicines: Medicine[] = backendMedicines.map((m: any) => ({
                id: m.id,
                name: m.name,
                generic: m.genericName,
                stock: m.stock,
                unit: `${m.strength} ${m.dosageForm}`,
                expiry: (m.expiryDate && !isNaN(new Date(m.expiryDate).getTime())) ? new Date(m.expiryDate).toLocaleDateString() : 'N/A',
                price: m.price,
                category: m.category,
                status: m.stock <= 5 ? 'critical' : m.stock <= 20 ? 'low' : 'in-stock',
                description: m.description,
                manufacturer: m.manufacturer,
                storageConditions: m.storageConditions
            }));

            set({ medicines, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch medicines:', error);
            set({ error: error.message || 'Failed to fetch medicines', isLoading: false });
        }
    },

    addMedicine: async (medicineData) => {
        set({ isLoading: true, error: null });
        try {
            const payload = {
                ...medicineData,
                genericName: medicineData.generic,
                strength: medicineData.unit?.split(' ')[0] || '10mg',
                dosageForm: medicineData.unit?.split(' ')[1] || 'Tablet',
                expiryDate: medicineData.expiry,
                isActive: true
            };

            await api.post('/api/pharmacy/medicines', payload);
            toast.success('Medicine added successfully');
            get().fetchMedicines();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add medicine');
            set({ isLoading: false });
        }
    },

    updateMedicine: async (id, medicineData) => {
        set({ isLoading: true, error: null });
        try {
            const payload = {
                ...medicineData,
                genericName: medicineData.generic,
                expiryDate: medicineData.expiry,
            };
            await api.put(`/api/pharmacy/medicines/${id}`, payload);
            toast.success('Medicine updated successfully');
            get().fetchMedicines();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update medicine');
            set({ isLoading: false });
        }
    },

    deleteMedicine: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/api/pharmacy/medicines/${id}`);
            toast.success('Medicine deleted successfully');
            get().fetchMedicines();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete medicine');
            set({ isLoading: false });
        }
    },

    fetchPrescriptions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/pharmacy/prescriptions');
            const raw = response.data.data.prescriptions;

            const prescriptions: Prescription[] = raw.map((p: any) => ({
                id: p._id,
                patientName: p.patientId ? (p.patientId.name || p.patientId.email) : 'Unknown',
                doctorName: p.recordedBy ? p.recordedBy.name : 'Unknown',
                date: p.date,
                medicines: p.data?.prescription?.medications?.map((m: any) => ({
                    name: m.name,
                    dosage: m.dosage,
                    quantity: 1,
                    frequency: m.frequency,
                    duration: m.duration
                })) || [],
                status: 'pending'
            }));

            set({ prescriptions, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addPrescription: async (data) => {
        toast('Prescription creation is handled by Doctors via EHR.', { icon: 'ℹ️' });
    },

    updatePrescription: async (id, updates) => {
        set((state) => ({
            prescriptions: state.prescriptions.map(p =>
                p.id === id ? { ...p, ...updates } : p
            )
        }));
    },

    deletePrescription: async (id) => {
        set((state) => ({
            prescriptions: state.prescriptions.filter(p => p.id !== id)
        }));
    },


    fetchOrders: async (status, patientId) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (status && status !== 'all') params.append('status', status);
            if (patientId) params.append('patientId', patientId);

            const url = `/api/pharmacy/orders?${params.toString()}`;
            const response = await api.get(url);

            const orders: Order[] = response.data.data.orders.map((o: any) => ({
                id: o.id,
                patientId: o.patientId,
                patientName: 'Patient #' + (typeof o.patientId === 'string' ? o.patientId.substring(0, 5) : o.patientId),
                items: o.items.map((i: any) => ({
                    medicineId: i.medicineId,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price
                })),
                totalAmount: Number(o.totalAmount),
                status: o.status,
                paymentStatus: o.paymentStatus,
                createdAt: o.createdAt
            }));

            set({ orders, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addOrder: async (orderData) => {
        set({ isLoading: true });
        try {
            const payload = {
                medicines: orderData.items?.map(i => ({
                    medicineId: i.medicineId,
                    quantity: i.quantity
                })),
                shippingAddress: {
                    street: 'Walk-in', city: 'City', state: 'State', zipCode: '00000', country: 'Country'
                },
                paymentMethod: 'cash'
            };

            await api.post('/api/pharmacy/orders', payload);
            toast.success('Order created successfully');
            get().fetchOrders();
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to create order');
            set({ isLoading: false });
        }
    },

    updateOrderStatus: async (id, status, paymentStatus) => {
        set({ isLoading: true });
        try {
            await api.patch(`/api/pharmacy/orders/${id}/status`, { status, paymentStatus });
            toast.success('Order status updated');
            get().fetchOrders();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update order');
            set({ isLoading: false });
        }
    },

    fetchCustomers: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/api/pharmacy/customers');
            const customers = response.data.data.customers.map((c: any) => ({
                id: c.id || c._id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                totalOrders: c.totalOrders || 0,
                lastVisit: c.lastVisit,
                profile: c.profile,
                createdAt: c.createdAt
            }));
            set({ customers, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchStats: async () => {
        try {
            const response = await api.get('/api/pharmacy/stats');
            set({ stats: response.data.data });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    fetchRefills: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/api/pharmacy/refill-notifications');
            // Mock mapping since backend returns empty or maybe future real data
            const notifications = response.data.data.notifications || [];

            const refills: Refill[] = notifications.map((n: any) => ({
                id: n.id,
                patientName: n.patientName || 'Unknown',
                medication: n.medication || 'Unknown',
                prescriptionId: n.prescriptionId || 'N/A',
                requestDate: n.date || new Date().toISOString(),
                lastFillDate: n.lastFill || new Date().toISOString(),
                status: n.status || 'pending',
                quantity: n.quantity || 1,
                refillsRemaining: n.refillsRemaining || 0
            }));

            set({ refills, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch refills:', error);
            // Don't show error for empty refils if it's just a 404 or empty
            set({ isLoading: false });
        }
    },

    updateRefill: async (id, updates) => {
        // Optimistic update
        set(state => ({
            refills: state.refills.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
        try {
            await api.put(`/api/pharmacy/refills/${id}`, updates);
            toast.success('Refill status updated');
        } catch (error: any) {
            console.error('Failed to update refill status:', error);
            toast.error('Failed to sync refill status');
            // Revert optimistic update? Or just let it be for now since we want to be snappy.
        }
    }
}));

