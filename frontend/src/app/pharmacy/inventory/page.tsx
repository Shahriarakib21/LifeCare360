'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, AlertCircle, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { usePharmacyStore } from '@/store/pharmacyStore';

interface Medicine {
    id: number;
    name: string;
    generic: string;
    stock: number;
    unit: string;
    expiry: string;
    price: string;
    category: string;
    status: 'in-stock' | 'low' | 'critical' | 'expiring';
    manufacturer?: string;
    storageConditions?: string;
}

export default function InventoryPage() {
    // Get data and actions from pharmacy store
    // Get data and actions from pharmacy store
    const inventory = usePharmacyStore((state) => state.medicines);
    const addMedicine = usePharmacyStore((state) => state.addMedicine);
    const updateMedicine = usePharmacyStore((state) => state.updateMedicine);
    const deleteMedicine = usePharmacyStore((state) => state.deleteMedicine);
    const fetchMedicines = usePharmacyStore((state) => state.fetchMedicines);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        generic: '',
        stock: '',
        unit: 'strips',
        expiry: '',
        price: '',
        category: '',
        manufacturer: '',
        storageConditions: 'Store in a cool, dry place',
    });

    // Fetch medicines on mount and when search changes
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMedicines(searchQuery);
        }, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [fetchMedicines, searchQuery]);

    // Local filter for Status only (Search is handled by backend)
    const filteredInventory = inventory.filter((item) => {
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesStatus;
    });

    // Handlers
    const handleAddMedicine = () => {
        if (!formData.name || !formData.generic || !formData.stock || !formData.price || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        const status: 'in-stock' | 'low' | 'critical' | 'expiring' =
            parseInt(formData.stock) < 10 ? 'critical' :
                parseInt(formData.stock) < 30 ? 'low' : 'in-stock';

        addMedicine({
            name: formData.name,
            generic: formData.generic,
            stock: parseInt(formData.stock),
            unit: formData.unit,
            expiry: formData.expiry,
            price: formData.price,
            category: formData.category,
            manufacturer: formData.manufacturer,
            storageConditions: formData.storageConditions,
            status: status,
        });

        setIsAddModalOpen(false);
        resetForm();
        toast.success(`${formData.name} added to inventory!`);
    };

    const handleEditMedicine = () => {
        if (!selectedMedicine || !formData.name || !formData.generic || !formData.stock || !formData.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        const status: 'in-stock' | 'low' | 'critical' | 'expiring' =
            parseInt(formData.stock) < 10 ? 'critical' :
                parseInt(formData.stock) < 30 ? 'low' : 'in-stock';

        updateMedicine(selectedMedicine.id, {
            name: formData.name,
            generic: formData.generic,
            stock: parseInt(formData.stock),
            unit: formData.unit,
            expiry: formData.expiry,
            price: formData.price,
            category: formData.category,
            manufacturer: formData.manufacturer,
            storageConditions: formData.storageConditions,
            status: status,
        });

        setIsEditModalOpen(false);
        setSelectedMedicine(null);
        resetForm();
        toast.success(`${formData.name} updated successfully!`);
    };

    const handleDeleteMedicine = (medicine: Medicine) => {
        if (confirm(`Are you sure you want to delete ${medicine.name}?`)) {
            deleteMedicine(medicine.id);
            toast.success(`${medicine.name} removed from inventory`);
        }
    };

    const openEditModal = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setFormData({
            name: medicine.name,
            generic: medicine.generic,
            stock: medicine.stock.toString(),
            unit: medicine.unit,
            expiry: medicine.expiry,
            price: medicine.price,
            category: medicine.category,
            manufacturer: (medicine as any).manufacturer || '',
            storageConditions: (medicine as any).storageConditions || 'Store in a cool, dry place',
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            generic: '',
            stock: '',
            unit: 'strips',
            expiry: '',
            price: '',
            category: '',
            manufacturer: '',
            storageConditions: 'Store in a cool, dry place',
        });
    };

    const handleExport = () => {
        const csv = [
            ['Name', 'Generic', 'Stock', 'Unit', 'Expiry', 'Price', 'Category', 'Status'],
            ...filteredInventory.map(item => [
                item.name,
                item.generic,
                item.stock,
                item.unit,
                item.expiry,
                item.price,
                item.category,
                item.status
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Inventory exported successfully!');
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            'in-stock': 'success',
            'low': 'warning',
            'critical': 'danger',
            'expiring': 'warning'
        };
        return variants[status] || 'secondary';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Medicine Inventory</h1>
                    <p className="text-secondary-600 mt-1">Manage your pharmacy's medicine stock</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Medicine
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card padding="lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search medicines by name, generic, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'in-stock' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('in-stock')}
                        >
                            In Stock
                        </Button>
                        <Button
                            variant={statusFilter === 'low' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('low')}
                        >
                            Low Stock
                        </Button>
                        <Button
                            variant={statusFilter === 'critical' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter('critical')}
                        >
                            Critical
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Inventory Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-secondary-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Medicine</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Category</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Stock</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Expiry</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Price</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-secondary-900">{item.name}</span>
                                                <span className="text-xs text-secondary-500">{item.generic}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-secondary-700">{item.category}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-secondary-900">{item.stock}</span>
                                                <span className="text-xs text-secondary-500">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-secondary-600">{item.expiry}</td>
                                        <td className="py-3 px-4 font-medium text-secondary-900">৳{item.price}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getStatusBadge(item.status)} size="sm">
                                                {item.status === 'critical' || item.status === 'low' ? (
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                ) : null}
                                                {item.status.replace('-', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMedicine(item)}
                                                    className="p-1 text-secondary-400 hover:text-error-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <Package className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                                        <p className="text-secondary-600">No medicines found</p>
                                        <p className="text-sm text-secondary-500 mt-1">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'Try adjusting your filters'
                                                : 'Add your first medicine to get started'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Medicine Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                }}
                title="Add New Medicine"
            >
                <div className="space-y-4">
                    <Input
                        label="Medicine Name"
                        placeholder="Enter medicine name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Generic Name"
                        placeholder="Enter generic name"
                        value={formData.generic}
                        onChange={(e) => setFormData({ ...formData, generic: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Stock Quantity"
                            type="number"
                            placeholder="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                            <select
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="strips">Strips</option>
                                <option value="boxes">Boxes</option>
                                <option value="bottles">Bottles</option>
                                <option value="units">Units</option>
                            </select>
                        </div>
                    </div>
                    <Input
                        label="Category"
                        placeholder="e.g., Antibiotic, Pain Relief"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Expiry Date"
                            placeholder="e.g., Dec 2024"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        />
                        <Input
                            label="Price"
                            placeholder="৳0.00"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => {
                            setIsAddModalOpen(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddMedicine}>
                            Add Medicine
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Medicine Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedMedicine(null);
                    resetForm();
                }}
                title="Edit Medicine"
            >
                <div className="space-y-4">
                    <Input
                        label="Medicine Name"
                        placeholder="Enter medicine name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Generic Name"
                        placeholder="Enter generic name"
                        value={formData.generic}
                        onChange={(e) => setFormData({ ...formData, generic: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Stock Quantity"
                            type="number"
                            placeholder="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                            <select
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="strips">Strips</option>
                                <option value="boxes">Boxes</option>
                                <option value="bottles">Bottles</option>
                                <option value="units">Units</option>
                            </select>
                        </div>
                    </div>
                    <Input
                        label="Category"
                        placeholder="e.g., Antibiotic, Pain Relief"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                    />
                    <Input
                        label="Manufacturer"
                        placeholder="Enter manufacturer name"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        required
                    />
                    <Input
                        label="Storage Conditions"
                        placeholder="e.g., Store below 25°C"
                        value={formData.storageConditions}
                        onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Expiry Date"
                            placeholder="e.g., Dec 2024"
                            value={formData.expiry}
                            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        />
                        <Input
                            label="Price"
                            placeholder="৳0.00"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => {
                            setIsEditModalOpen(false);
                            setSelectedMedicine(null);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditMedicine}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
