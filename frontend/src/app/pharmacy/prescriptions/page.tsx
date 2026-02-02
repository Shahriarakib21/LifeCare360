'use client';

import React, { useState } from 'react';
import { Search, Eye, CheckCircle, Clock, FileText, User, Pill, Calendar, Printer, Upload, Plus, Trash2, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { usePharmacyStore } from '@/store/pharmacyStore';
import type { Prescription } from '@/store/pharmacyStore';
import MedicineSearch from '@/components/doctor/MedicineSearch';

export default function PrescriptionsPage() {
    // Pharmacy store
    const prescriptions = usePharmacyStore((state) => state.prescriptions);
    const medicines = usePharmacyStore((state) => state.medicines);
    const addPrescription = usePharmacyStore((state) => state.addPrescription);
    const updatePrescription = usePharmacyStore((state) => state.updatePrescription);
    const deletePrescription = usePharmacyStore((state) => state.deletePrescription);
    const addOrder = usePharmacyStore((state) => state.addOrder);
    const fetchPrescriptions = usePharmacyStore((state) => state.fetchPrescriptions);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Fetch on mount
    React.useEffect(() => {
        fetchPrescriptions();
        // Since prescriptions are linked to medicines (for pricing fallback), maybe ensure medicines are loaded?
        // But medicines page loads them. Let's assume user visits inventory or we load them lazily if needed.
    }, [fetchPrescriptions]);

    // Add Prescription Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        patientName: '',
        doctorName: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        medicines: [] as { name: string; dosage: string; quantity: number }[],
    });
    // Temporary state for adding a medicine to the list
    const [newMed, setNewMed] = useState({ name: '', dosage: '', quantity: 1 });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Filter and search
    const filteredPrescriptions = prescriptions.filter((item) => {
        const matchesSearch =
            item.id.toString().includes(searchQuery) ||
            item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Handlers
    const handleViewDetails = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setIsDetailsModalOpen(true);
    };

    const handleProcessPrescription = (id: string) => {
        updatePrescription(id, { status: 'processing' });
        toast.success('Prescription moved to processing');
    };

    const handleCompletePrescription = (id: string) => {
        const prescription = prescriptions.find(p => p.id === id);
        if (!prescription) return;

        // Calculate total amount from inventory prices
        let totalAmount = 0;
        prescription.medicines.forEach(med => {
            let medName = '';
            let quantity = 1;

            if (typeof med === 'string') {
                medName = med;
            } else {
                medName = med.name;
                quantity = med.quantity;
            }

            // Find medicine in inventory (simple name match)
            const inventoryItem = medicines.find(m => m.name.toLowerCase().includes(medName.toLowerCase()) || medName.toLowerCase().includes(m.name.toLowerCase()));

            if (inventoryItem) {
                // Parse price (remove currency symbol if present)
                const price = typeof inventoryItem.price === 'string' ? parseFloat((inventoryItem.price as string).replace(/[^0-9.]/g, '')) : Number(inventoryItem.price);
                if (!isNaN(price)) {
                    totalAmount += price * quantity;
                }
            } else {
                // Default fallback price if not found in inventory
                totalAmount += 10 * quantity;
            }
        });

        // Create the order
        // Note: We need medicine IDs for order. If inventory not found, we can't create valid order items linked to medicines.
        // For now, only add found items, or add dummy logic.
        // Or we need an Order type that accepts non-linked items? Backend Order expects items with structure.
        // The Backend Order just stores items JSONB? No, it's JSONB in Postgres. So structure is flexible.
        // But store Order interface expects medicineId.

        // Let's filter visible items
        const orderItems: any[] = [];
        prescription.medicines.forEach(med => {
            const medName = typeof med === 'string' ? med : med.name;
            const qty = typeof med === 'string' ? 1 : med.quantity;
            const invItem = medicines.find(m => m.name.toLowerCase().includes(medName.toLowerCase()));
            if (invItem) {
                orderItems.push({
                    medicineId: invItem.id,
                    name: invItem.name,
                    quantity: qty,
                    price: parseFloat((invItem.price as string).replace(/[^0-9.]/g, ''))
                });
            }
        });

        addOrder({
            patientName: prescription.patientName,
            items: orderItems,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            status: 'completed',
            createdAt: new Date().toISOString().split('T')[0]
        });

        // Update prescription status
        updatePrescription(id, { status: 'completed' });
        toast.success('Prescription completed and order created');
    };

    const handleDeletePrescription = (id: string) => {
        if (confirm('Are you sure you want to delete this prescription?')) {
            deletePrescription(id);
            toast.success('Prescription deleted');
            setIsDetailsModalOpen(false);
        }
    };

    const handlePrintPrescription = (prescription: Prescription) => {
        toast.success(`Printing prescription #${prescription.id}...`);
        // In a real app, this would trigger a print dialog
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast.loading(`Uploading ${file.name}...`, { duration: 2000 });
            setTimeout(() => {
                // Simulate parsing the file and adding a prescription
                addPrescription({
                    patientName: 'Imported Patient',
                    doctorName: 'Unknown Doctor',
                    date: new Date().toISOString().split('T')[0],
                    medicines: ['Parsed Medicine 1', 'Parsed Medicine 2'],
                    status: 'pending'
                });
                toast.success('Prescription uploaded and added successfully!');
            }, 2000);
        }
    };

    // Add Prescription Handlers
    const handleAddMedicine = () => {
        if (!newMed.name || !newMed.dosage) {
            toast.error('Medicine name and dosage are required');
            return;
        }
        setAddForm({
            ...addForm,
            medicines: [...addForm.medicines, { ...newMed }]
        });
        setNewMed({ name: '', dosage: '', quantity: 1 });
    };

    const handleMedicineSelection = (selectedMed: any) => {
        setNewMed({
            ...newMed,
            name: selectedMed.name,
            dosage: selectedMed.dosage || newMed.dosage
        });
    };

    const handleRemoveMedicine = (index: number) => {
        const updatedMeds = [...addForm.medicines];
        updatedMeds.splice(index, 1);
        setAddForm({ ...addForm, medicines: updatedMeds });
    };

    const handleSubmitPrescription = () => {
        if (!addForm.patientName || !addForm.doctorName || addForm.medicines.length === 0) {
            toast.error('Please fill in patient, doctor, and at least one medicine');
            return;
        }

        addPrescription({
            patientName: addForm.patientName,
            doctorName: addForm.doctorName,
            date: addForm.date,
            status: 'pending',
            medicines: addForm.medicines // Store now accepts complex object
        });

        setIsAddModalOpen(false);
        setAddForm({
            patientName: '',
            doctorName: '',
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            medicines: [],
        });
        toast.success('Prescription added successfully!');
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            'pending': 'warning',
            'processing': 'primary',
            'completed': 'success',
            'approved': 'primary', // mapping approved to primary/processing style
            'rejected': 'danger',
            'cancelled': 'secondary'
        };
        return variants[status] || 'secondary';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'processing': return <FileText className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'approved': return <FileText className="w-4 h-4" />;
            case 'rejected': return <X className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Prescriptions</h1>
                    <p className="text-secondary-600 mt-1">Manage and process prescription orders</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button variant="secondary" onClick={handleUploadClick}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Prescription
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card padding="lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by ID, patient, or doctor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'pending', 'processing', 'completed'].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Prescriptions Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-secondary-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">ID</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Patient</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Doctor</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Medicines</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredPrescriptions.length > 0 ? (
                                filteredPrescriptions.map((prescription) => (
                                    <tr key={prescription.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-secondary-900">RX-{prescription.id}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-900">{prescription.patientName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-secondary-700">{prescription.doctorName}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-600">
                                                    {new Date(prescription.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Pill className="w-4 h-4 text-secondary-400" />
                                                <span className="text-sm text-secondary-700">
                                                    {prescription.medicines.length} item{prescription.medicines.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getStatusBadge(prescription.status)} size="sm">
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(prescription.status)}
                                                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                                                </span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(prescription)}
                                                    className="p-1 text-secondary-400 hover:text-primary-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {prescription.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleProcessPrescription(prescription.id)}
                                                    >
                                                        Process
                                                    </Button>
                                                )}
                                                {prescription.status === 'processing' && (
                                                    <Button
                                                        size="sm"
                                                        variant="success"
                                                        onClick={() => handleCompletePrescription(prescription.id)}
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                                <button
                                                    onClick={() => handlePrintPrescription(prescription)}
                                                    className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
                                                    title="Print"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrescription(prescription.id)}
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
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                                        <p className="text-secondary-600">No prescriptions found</p>
                                        <p className="text-sm text-secondary-500 mt-1">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'Try adjusting your filters'
                                                : 'Add your first prescription'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Prescription Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="New Prescription"
            >
                <div className="space-y-4">
                    <Input
                        label="Patient Name"
                        placeholder="e.g. John Doe"
                        value={addForm.patientName}
                        onChange={(e) => setAddForm({ ...addForm, patientName: e.target.value })}
                    />
                    <Input
                        label="Doctor Name"
                        placeholder="e.g. Dr. Smith"
                        value={addForm.doctorName}
                        onChange={(e) => setAddForm({ ...addForm, doctorName: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Add Medicine</label>
                        <div className="space-y-4 mb-4">
                            <MedicineSearch
                                value={newMed.name}
                                onChange={handleMedicineSelection}
                                placeholder="Search for generic or brand name..."
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Dosage (e.g. 1-0-1)"
                                    value={newMed.dosage}
                                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                    containerClassName="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={newMed.quantity.toString()}
                                    onChange={(e) => setNewMed({ ...newMed, quantity: parseInt(e.target.value) || 1 })}
                                    containerClassName="w-24"
                                />
                                <Button onClick={handleAddMedicine} variant="secondary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* List of meds to add */}
                        <div className="space-y-2 mt-4 bg-secondary-50 p-2 rounded-lg">
                            {addForm.medicines.length > 0 ? (
                                addForm.medicines.map((med, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-secondary-200">
                                        <span className="text-sm">{med.name} - {med.dosage} ({med.quantity})</span>
                                        <button onClick={() => handleRemoveMedicine(idx)} className="text-error-500 hover:text-error-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-secondary-400 text-center">No medicines added</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitPrescription}>Create Prescription</Button>
                    </div>
                </div>
            </Modal>

            {/* Prescription Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedPrescription(null);
                }}
                title={`Prescription Details (RX-${selectedPrescription?.id})`}
            >
                {selectedPrescription && (
                    <div className="space-y-6">
                        {/* Details... similar to before but consistent with new structure */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Patient</label>
                                <p className="text-secondary-900 font-medium">{selectedPrescription.patientName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Doctor</label>
                                <p className="text-secondary-900 font-medium">{selectedPrescription.doctorName}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">Medicines</label>
                            <div className="space-y-2">
                                {selectedPrescription.medicines.map((med, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Pill className="w-5 h-5 text-primary-600" />
                                            <div>
                                                {typeof med === 'string' ? (
                                                    <p className="font-medium text-secondary-900">{med}</p>
                                                ) : (
                                                    <>
                                                        <p className="font-medium text-secondary-900">{med.name}</p>
                                                        <p className="text-sm text-secondary-600">Dosage: {med.dosage}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {typeof med !== 'string' && (
                                            <span className="text-sm font-medium text-secondary-700">Qty: {med.quantity}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                            {selectedPrescription.status === 'pending' && (
                                <Button onClick={() => {
                                    handleProcessPrescription(selectedPrescription.id);
                                    setIsDetailsModalOpen(false);
                                }}>
                                    Process
                                </Button>
                            )}
                            {selectedPrescription.status === 'processing' && (
                                <Button variant="success" onClick={() => {
                                    handleCompletePrescription(selectedPrescription.id);
                                    setIsDetailsModalOpen(false);
                                }}>
                                    Complete
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
