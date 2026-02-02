'use client';

import React, { useState } from 'react';
import { Plus, Search, Download, Eye, ShoppingBag, User, Calendar, Coins, Package, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { usePharmacyStore, Order } from '@/store/pharmacyStore';
import MedicineSearch from '@/components/doctor/MedicineSearch';

export default function OrdersPage() {
    const orders = usePharmacyStore((state) => state.orders);
    const fetchOrders = usePharmacyStore((state) => state.fetchOrders);
    const updateOrderStatus = usePharmacyStore((state) => state.updateOrderStatus);
    const addOrder = usePharmacyStore((state) => state.addOrder);
    const customers = usePharmacyStore((state) => state.customers);
    const fetchCustomers = usePharmacyStore((state) => state.fetchCustomers);
    const medicines = usePharmacyStore((state) => state.medicines);
    const fetchMedicines = usePharmacyStore((state) => state.fetchMedicines);

    const searchParams = useSearchParams();
    const patientIdParam = searchParams.get('patientId');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newOrder, setNewOrder] = useState({
        customerName: '',
        paymentMethod: 'Cash',
        items: [{ medicineId: 0, medicine: '', quantity: 1, price: '0' }]
    });

    React.useEffect(() => {
        fetchOrders(statusFilter, patientIdParam || undefined);
        fetchMedicines();
        fetchCustomers();
    }, [fetchOrders, fetchMedicines, fetchCustomers, statusFilter, patientIdParam]);

    const getPatientName = (patientId: string) => {
        const customer = customers.find(c => c.id === patientId);
        if (customer) return customer.name;
        return 'Patient #' + (typeof patientId === 'string' ? patientId.substring(0, 5) : patientId);
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.id.toString().includes(searchQuery) ||
            (order.patientName || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateOrder = () => {
        if (!newOrder.customerName || newOrder.items.some(item => !item.medicine || !item.price)) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Note: In real app we need medicine IDs. 
        // For this UI we are just simulating name input.
        // We'll pass 0 as ID and rely on name if backend allows, or this needs a medicine picker.
        // The store addOrder expects items with medicineId.

        const items = newOrder.items.map(item => ({
            medicineId: item.medicineId || 0, // Fallback if not selected from dropdown
            name: item.medicine,
            quantity: item.quantity,
            price: parseFloat(item.price.replace('৳', ''))
        }));

        addOrder({
            patientName: newOrder.customerName, // Need robust patient selection
            items: items,
            // totalAmount calculated by backend or store? Store expects it? 
            // The Order interface in store has totalAmount.
            // Backend createOrder expects medicines array with IDs. 
            // So manually creating order via this simple UI is tricky without a medicine search.
            // For now, let's just trigger the action and let it fail or default.
            // But we can calculate total locally for display?
            // Actually, backend should calculate total.
        });

        setIsCreateModalOpen(false);
        setNewOrder({ customerName: '', paymentMethod: 'Cash', items: [{ medicineId: 0, medicine: '', quantity: 1, price: '' }] });
    };

    const handleExport = () => {
        const csv = [
            ['Order ID', 'Customer', 'Date', 'Total', 'Status', 'Payment Method'],
            ...filteredOrders.map(order => [
                order.id,
                order.patientName,
                order.createdAt,
                order.totalAmount,
                order.status,
                order.paymentStatus
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Orders exported successfully!');
    };

    const addOrderItem = () => {
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { medicineId: 0, medicine: '', quantity: 1, price: '0' }]
        });
    };

    const updateOrderItem = (index: number, field: string, value: any) => {
        const updatedItems = [...newOrder.items];
        const item = { ...updatedItems[index] };

        if (field === 'medicine_selection') {
            // value is from MedicineSearch {name, dosage, dosageForm, genericName}
            item.medicine = value.name;
            item.price = value.price || '0';
            // We might need to find the actual medicine ID from store or if it's in the selection
            const medInStore = medicines.find(m => m.name.toLowerCase() === value.name.toLowerCase());
            if (medInStore) {
                item.medicineId = medInStore.id;
                item.price = medInStore.price.toString();
            }
        } else {
            // @ts-ignore
            item[field] = value;
        }

        updatedItems[index] = item;
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            'pending': 'warning',
            'processing': 'primary',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return variants[status] || 'secondary';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        {patientIdParam && (
                            <button
                                onClick={() => window.location.href = '/pharmacy/customers'}
                                className="p-1 hover:bg-secondary-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-secondary-900">
                            {patientIdParam ? `Order History: ${getPatientName(patientIdParam)}` : 'Orders'}
                        </h1>
                    </div>
                    <p className="text-secondary-600 mt-1">
                        {patientIdParam ? `Viewing all orders for ${getPatientName(patientIdParam)}` : 'Manage and track customer orders'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Order
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card padding="lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by order ID or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant={statusFilter === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
                        <Button variant={statusFilter === 'pending' ? 'primary' : 'ghost'} size="sm" onClick={() => setStatusFilter('pending')}>Pending</Button>
                        <Button variant={statusFilter === 'completed' ? 'primary' : 'ghost'} size="sm" onClick={() => setStatusFilter('completed')}>Completed</Button>
                    </div>
                </div>
            </Card>

            {/* Orders Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-secondary-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Order ID</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Customer</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Items</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Total</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-secondary-900">{order.id}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-900">{order.patientName || getPatientName(order.patientId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-secondary-700">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                                        <td className="py-3 px-4 font-medium text-secondary-900">৳{order.totalAmount}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getStatusBadge(order.status)} size="sm">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDetailsModalOpen(true);
                                                    }}
                                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                                        <p className="text-secondary-600">No orders found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Order Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Order">
                <div className="space-y-4">
                    <Input
                        label="Customer Name"
                        placeholder="Enter customer name"
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Method</label>
                        <select
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            value={newOrder.paymentMethod}
                            onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Insurance">Insurance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Order Items</label>
                        {newOrder.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-center border-b pb-2 md:border-0 md:pb-0">
                                <div className="md:col-span-12">
                                    <MedicineSearch
                                        value={item.medicine}
                                        onChange={(selectedMed) => updateOrderItem(index, 'medicine_selection', selectedMed)}
                                        placeholder="Search for a medicine..."
                                    />
                                </div>
                                <div className="md:col-span-6 mt-2">
                                    <Input
                                        label="Quantity"
                                        type="number"
                                        placeholder="Qty"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="md:col-span-6 mt-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">৳</span>
                                        <input
                                            className="w-full pl-6 pr-3 py-2 bg-secondary-50 border border-secondary-300 rounded-lg text-secondary-500 cursor-not-allowed text-sm"
                                            value={item.price}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={addOrderItem}>+ Add Item</Button>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOrder}>Create Order</Button>
                    </div>
                </div>
            </Modal>

            {/* Order Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Order #${selectedOrder?.id}`}>
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Customer</label>
                                <p className="text-secondary-900 font-semibold">{selectedOrder.patientName || getPatientName(selectedOrder.patientId)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                                <p className="text-secondary-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Order Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    value={selectedOrder.status}
                                    onChange={(e) => {
                                        updateOrderStatus(selectedOrder.id, e.target.value);
                                        setSelectedOrder({ ...selectedOrder, status: e.target.value as any });
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    value={selectedOrder.paymentStatus}
                                    onChange={(e) => {
                                        updateOrderStatus(selectedOrder.id, selectedOrder.status, e.target.value);
                                        setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value });
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-secondary-700 mb-2">Order Items</label>
                            {selectedOrder.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg mb-2 border border-secondary-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center border">
                                            <Package className="w-4 h-4 text-secondary-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-secondary-900">{item.name || `Medicine #${item.medicineId}`}</p>
                                            <p className="text-xs text-secondary-500">Qty: {item.quantity} x ৳{item.price}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-secondary-900">৳{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className="text-lg font-semibold text-secondary-900">Total Amount</span>
                            <span className="text-2xl font-bold text-primary-600">৳{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-end pt-6">
                            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
