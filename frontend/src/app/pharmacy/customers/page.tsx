'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, Edit2, User, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { usePharmacyStore } from '@/store/pharmacyStore';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    registeredDate: string;
    totalOrders: number;
    lastVisit: string;
}

export default function CustomersPage() {
    // Get data and actions from pharmacy store
    const customers = usePharmacyStore((state) => state.customers);
    const fetchCustomers = usePharmacyStore((state) => state.fetchCustomers);

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    // Use store type or compatible
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    React.useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = (customers || []).filter((customer) =>
        (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer?.phone || '').includes(searchQuery)
    );

    const handleAddCustomer = () => {
        toast('To add a new customer, please register a new Patient account in the System.', { icon: 'ℹ️' });
        setIsAddModalOpen(false);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
                    <p className="text-secondary-600 mt-1">Manage customer information and history</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                </Button>
            </div>

            {/* Search */}
            <Card padding="lg">
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                />
            </Card>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                        <Card key={customer.id} padding="lg" className="hover:shadow-lg transition-shadow">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-secondary-900">{customer.name}</h3>
                                            <p className="text-sm text-secondary-500">ID: {customer.id}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setIsDetailsModalOpen(true);
                                        }}
                                        className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                                        <Mail className="w-4 h-4" />
                                        <span>{customer.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{customer.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                                        <MapPin className="w-4 h-4" />
                                        <span className="line-clamp-1">{customer.profile?.address || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-primary-600">0</p>
                                        <p className="text-xs text-secondary-500">Total Orders</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-secondary-900">
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p className="text-xs text-secondary-500">Joined</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center">
                        <User className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                        <p className="text-secondary-600">No customers found</p>
                        <p className="text-sm text-secondary-500 mt-1">
                            {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title="Add New Customer">
                <div className="space-y-4">
                    <p className="text-secondary-600">
                        New customers should register via the Patient Portal or be added by Admin.
                        <br />
                        (This feature is currently read-only for Pharmacy staff)
                    </p>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>Close</Button>
                    </div>
                </div>
            </Modal>

            {/* Customer Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Customer Details">
                {selectedCustomer && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg">
                            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="w-8 h-8 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-secondary-900">{selectedCustomer.name}</h3>
                                <p className="text-sm text-secondary-600">ID: {selectedCustomer.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                                <div className="flex items-center gap-2 p-3 bg-secondary-50 rounded-lg">
                                    <Mail className="w-4 h-4 text-secondary-400" />
                                    <span className="text-sm text-secondary-900">{selectedCustomer.email}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                                <div className="flex items-center gap-2 p-3 bg-secondary-50 rounded-lg">
                                    <Phone className="w-4 h-4 text-secondary-400" />
                                    <span className="text-sm text-secondary-900">{selectedCustomer.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Address</label>
                            <div className="flex items-center gap-2 p-3 bg-secondary-50 rounded-lg">
                                <MapPin className="w-4 h-4 text-secondary-400" />
                                <span className="text-sm text-secondary-900">{selectedCustomer.profile?.address || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-secondary-50 rounded-lg">
                                <p className="text-2xl font-bold text-primary-600">0</p>
                                <p className="text-xs text-secondary-600 mt-1">Total Orders</p>
                            </div>
                            <div className="text-center p-4 bg-secondary-50 rounded-lg">
                                <p className="text-sm font-medium text-secondary-900">
                                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-xs text-secondary-600 mt-1">Registered</p>
                            </div>
                            <div className="text-center p-4 bg-secondary-50 rounded-lg">
                                <p className="text-sm font-medium text-secondary-900">
                                    N/A
                                </p>
                                <p className="text-xs text-secondary-600 mt-1">Last Visit</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                            <Button>
                                <FileText className="w-4 h-4 mr-2" />
                                View History
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
