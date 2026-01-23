'use client';

import React, { useState } from 'react';
import { RefreshCcw, Search, Calendar, User, Pill, Clock, CheckCircle, AlertCircle, Eye, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { usePharmacyStore } from '@/store/pharmacyStore';

interface Refill {
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

export default function RefillsPage() {
    // Get data and actions from pharmacy store
    const refills = usePharmacyStore((state) => state.refills);
    const updateRefill = usePharmacyStore((state) => state.updateRefill);
    const fetchRefills = usePharmacyStore((state) => state.fetchRefills);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');
    const [selectedRefill, setSelectedRefill] = useState<Refill | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    React.useEffect(() => {
        fetchRefills();
    }, [fetchRefills]);

    const filteredRefills = (refills || []).filter((refill) => {
        const matchesSearch =
            refill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refill.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refill.prescriptionId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || refill.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleApprove = (id: string) => {
        updateRefill(id, { status: 'approved' });
        toast.success('Refill request approved');
    };

    const handleReject = (id: string) => {
        if (confirm('Are you sure you want to reject this refill request?')) {
            updateRefill(id, { status: 'rejected' });
            toast.error('Refill request rejected');
        }
    };

    const handleProcess = (id: string) => {
        updateRefill(id, { status: 'completed' });
        toast.success('Refill processed and completed');
    };

    const handleViewDetails = (refill: Refill) => {
        setSelectedRefill(refill);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'primary';
            case 'completed':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <X className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Prescription Refills</h1>
                    <p className="text-secondary-600 mt-1">Manage and process prescription refill requests</p>
                </div>
                <Button onClick={() => toast.success('Refreshing data...')}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card padding="lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600 mb-1">Pending Refills</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {refills.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-warning-600" />
                        </div>
                    </div>
                </Card>

                <Card padding="lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600 mb-1">Approved</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {refills.filter(r => r.status === 'approved').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </Card>

                <Card padding="lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600 mb-1">Completed Today</p>
                            <p className="text-2xl font-bold text-secondary-900">
                                {refills.filter(r => r.status === 'completed').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-success-600" />
                        </div>
                    </div>
                </Card>

                <Card padding="lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600 mb-1">Total Requests</p>
                            <p className="text-2xl font-bold text-secondary-900">{refills.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                            <RefreshCcw className="w-6 h-6 text-secondary-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by patient name, medication, or prescription ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((filter) => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter(filter)}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Refills Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-secondary-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                                    Refill ID
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                                    Patient
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                                    Medication
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                                    Request Date
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide text-center">
                                    Quantity
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide text-center">
                                    Refills Left
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide text-center">
                                    Status
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredRefills.length > 0 ? (
                                filteredRefills.map((refill) => (
                                    <tr key={refill.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-medium text-secondary-900">{refill.id}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-900">{refill.patientName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Pill className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-900">{refill.medication}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-600">
                                                    {new Date(refill.requestDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-sm text-secondary-900">{refill.quantity}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant="secondary" size="sm">
                                                {refill.refillsRemaining}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge variant={getStatusColor(refill.status) as any} size="sm">
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(refill.status)}
                                                    {refill.status.charAt(0).toUpperCase() + refill.status.slice(1)}
                                                </span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {refill.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button variant="primary" size="sm" onClick={() => handleApprove(refill.id)}>
                                                            Approve
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleReject(refill.id)}>
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {refill.status === 'approved' && (
                                                    <Button variant="primary" size="sm" onClick={() => handleProcess(refill.id)}>
                                                        Process
                                                    </Button>
                                                )}
                                                {(refill.status === 'completed' || refill.status === 'rejected') && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(refill)}>
                                                        View Details
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center">
                                        <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                                        <p className="text-secondary-600">No refill requests found</p>
                                        <p className="text-sm text-secondary-500 mt-1">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'Try adjusting your filters'
                                                : 'Refill requests will appear here'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Refill Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Refill Details - ${selectedRefill?.id}`}
            >
                {selectedRefill && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-secondary-500 uppercase">Patient</label>
                                <p className="text-sm font-semibold text-secondary-900 mt-1">{selectedRefill.patientName}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-secondary-500 uppercase">Prescription ID</label>
                                <p className="text-sm text-secondary-900 mt-1">{selectedRefill.prescriptionId}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary-500 uppercase">Medication</label>
                            <p className="text-sm text-secondary-900 mt-1">{selectedRefill.medication}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-secondary-500 uppercase">Quantity</label>
                                <p className="text-sm text-secondary-900 mt-1">{selectedRefill.quantity} units</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-secondary-500 uppercase">Refills Left</label>
                                <p className="text-sm text-secondary-900 mt-1">{selectedRefill.refillsRemaining}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-secondary-100 flex justify-end">
                            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
