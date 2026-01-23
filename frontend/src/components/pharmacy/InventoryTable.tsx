'use client';

import { useState, useEffect } from 'react';
import { MoreVertical, AlertCircle, Filter, Download, X, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface InventoryItem {
    id: number;
    name: string;
    generic: string;
    stock: number;
    unit: string;
    expiry: string;
    price: string;
    status: 'in-stock' | 'low' | 'critical' | 'expiring';
}

interface InventoryTableProps {
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export function InventoryTable({ inventory, setInventory }: InventoryTableProps) {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        generic: '',
        stock: '',
        unit: 'strips',
        expiry: '',
        price: '',
    });

    // Filter inventory based on status
    const filteredInventory = inventory.filter((item) => {
        if (statusFilter === 'all') return true;
        return item.status === statusFilter;
    });

    // Handle export to CSV
    const handleExport = () => {
        const csv = [
            ['Medicine Name', 'Generic', 'Stock', 'Unit', 'Expiry', 'Price', 'Status'],
            ...filteredInventory.map(item => [
                item.name,
                item.generic,
                item.stock,
                item.unit,
                item.expiry,
                item.price,
                item.status
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Inventory exported successfully!');
    };

    // Handle filter selection
    const handleFilterChange = (filter: string) => {
        setStatusFilter(filter);
        setShowFilterDropdown(false);
        toast.success(`Filter applied: ${filter === 'all' ? 'All Items' : filter.replace('-', ' ')}`);
    };

    // Handle edit action - Open modal with pre-filled data
    const handleEdit = (item: InventoryItem) => {
        setOpenActionMenu(null);
        setSelectedItem(item);
        setEditForm({
            name: item.name,
            generic: item.generic,
            stock: item.stock.toString(),
            unit: item.unit,
            expiry: item.expiry,
            price: item.price,
        });
        setIsEditModalOpen(true);
    };

    // Save edited item
    const handleSaveEdit = () => {
        if (!selectedItem || !editForm.name || !editForm.generic || !editForm.stock || !editForm.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        const stock = parseInt(editForm.stock);
        const newStatus: InventoryItem['status'] =
            stock < 10 ? 'critical' :
                stock < 30 ? 'low' :
                    'in-stock';

        const updatedInventory = inventory.map(item =>
            item.id === selectedItem.id
                ? {
                    ...item,
                    name: editForm.name,
                    generic: editForm.generic,
                    stock: stock,
                    unit: editForm.unit,
                    expiry: editForm.expiry,
                    price: editForm.price,
                    status: newStatus,
                }
                : item
        );

        setInventory(updatedInventory);
        setIsEditModalOpen(false);
        setSelectedItem(null);
        toast.success(`${editForm.name} updated successfully!`);
    };

    // Handle delete action - Actually remove from state
    const handleDelete = (item: InventoryItem) => {
        setOpenActionMenu(null);
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            setInventory(inventory.filter(i => i.id !== item.id));
            toast.success(`${item.name} deleted successfully!`);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionMenu !== null) {
                setOpenActionMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionMenu]);

    return (
        <>
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-secondary-900">Medicine Inventory</h2>
                    <div className="flex gap-2 relative">
                        {/* Filters Button with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className="btn btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {statusFilter !== 'all' && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                                        1
                                    </span>
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {showFilterDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-10">
                                    <div className="p-2">
                                        <div className="flex items-center justify-between px-3 py-2 mb-1">
                                            <span className="text-sm font-semibold text-secondary-900">Filter by Status</span>
                                            <button
                                                onClick={() => setShowFilterDropdown(false)}
                                                className="text-secondary-400 hover:text-secondary-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleFilterChange('all')}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                statusFilter === 'all'
                                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                                    : 'text-secondary-700 hover:bg-secondary-50'
                                            )}
                                        >
                                            All Items
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('in-stock')}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                statusFilter === 'in-stock'
                                                    ? 'bg-success-50 text-success-700 font-medium'
                                                    : 'text-secondary-700 hover:bg-secondary-50'
                                            )}
                                        >
                                            In Stock
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('low')}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                statusFilter === 'low'
                                                    ? 'bg-warning-50 text-warning-700 font-medium'
                                                    : 'text-secondary-700 hover:bg-secondary-50'
                                            )}
                                        >
                                            Low Stock
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('critical')}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                statusFilter === 'critical'
                                                    ? 'bg-error-50 text-error-700 font-medium'
                                                    : 'text-secondary-700 hover:bg-secondary-50'
                                            )}
                                        >
                                            Critical
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('expiring')}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                statusFilter === 'expiring'
                                                    ? 'bg-orange-50 text-orange-700 font-medium'
                                                    : 'text-secondary-700 hover:bg-secondary-50'
                                            )}
                                        >
                                            Expiring Soon
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="btn btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-secondary-50 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                                <th className="px-6 py-4 rounded-l-lg">Medicine Name</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Expiry</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 rounded-r-lg text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-secondary-50/50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-secondary-900">{item.name}</span>
                                                <span className="text-xs text-secondary-500">{item.generic}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-secondary-700">{item.stock}</span>
                                                <span className="text-xs text-secondary-400">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {item.expiry}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-secondary-900">
                                            ৳{item.price}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={clsx(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                    item.status === 'in-stock' && 'bg-success-100 text-success-700',
                                                    item.status === 'low' && 'bg-warning-100 text-warning-700',
                                                    item.status === 'critical' && 'bg-error-100 text-error-700',
                                                    item.status === 'expiring' && 'bg-orange-100 text-orange-700'
                                                )}
                                            >
                                                {item.status === 'low' && <AlertCircle className="w-3 h-3" />}
                                                {item.status === 'critical' && <AlertCircle className="w-3 h-3" />}
                                                {item.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenActionMenu(openActionMenu === item.id ? null : item.id);
                                                    }}
                                                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {/* Action Dropdown Menu */}
                                                {openActionMenu === item.id && (
                                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(item);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(item);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-secondary-500">
                                        No items found with the selected filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Medicine Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                }}
                title="Edit Medicine"
            >
                <div className="space-y-4">
                    <Input
                        label="Medicine Name"
                        placeholder="Enter medicine name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Generic Name"
                        placeholder="Enter generic name"
                        value={editForm.generic}
                        onChange={(e) => setEditForm({ ...editForm, generic: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Stock Quantity"
                            type="number"
                            placeholder="0"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                            <select
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={editForm.unit}
                                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            >
                                <option value="strips">Strips</option>
                                <option value="boxes">Boxes</option>
                                <option value="bottles">Bottles</option>
                                <option value="units">Units</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Expiry Date"
                            placeholder="e.g., Dec 2024"
                            value={editForm.expiry}
                            onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })}
                        />
                        <Input
                            label="Price"
                            placeholder="৳0.00"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => {
                            setIsEditModalOpen(false);
                            setSelectedItem(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
