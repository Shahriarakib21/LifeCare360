'use client';

import { useState } from 'react';
import { Plus, Boxes, FileText, Truck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import MedicineSearch from '@/components/doctor/MedicineSearch';
import { usePharmacyStore } from '@/store/pharmacyStore';

const actions = [
    {
        name: 'Add Medicine',
        icon: Plus,
        color: 'bg-primary-600',
        desc: 'Register new stock',
        action: 'add-medicine',
    },
    {
        name: 'Update Stock',
        icon: Boxes,
        color: 'bg-success-600',
        desc: 'Adjust quantity',
        action: 'update-stock',
    },
    {
        name: 'Generate Invoice',
        icon: FileText,
        color: 'bg-purple-600',
        desc: 'For walk-in customers',
        action: 'generate-invoice',
    },
    {
        name: 'Track Order',
        icon: Truck,
        color: 'bg-orange-600',
        desc: 'Check delivery status',
        action: 'track-order',
    },
    {
        name: 'New Prescription',
        icon: FileText,
        color: 'bg-blue-600',
        desc: 'Record manual Rx',
        action: 'new-prescription',
    },
];

export function QuickActions() {
    const router = useRouter();
    const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
    const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

    const addPrescription = usePharmacyStore((state) => state.addPrescription);

    const [stockForm, setStockForm] = useState({
        medicineName: '',
        quantity: '',
        action: 'add'
    });

    const [invoiceForm, setInvoiceForm] = useState({
        customerName: '',
        items: [{ medicine: '', quantity: 1, price: '' }],
        paymentMethod: 'Cash'
    });

    const [trackOrderForm, setTrackOrderForm] = useState({
        orderId: ''
    });

    const [prescriptionForm, setPrescriptionForm] = useState({
        patientName: '',
        doctorName: '',
        medicines: [] as { name: string, dosage: string, quantity: number }[]
    });

    const [newMed, setNewMed] = useState({ name: '', dosage: '', quantity: 1 });

    const handleAction = (actionName: string) => {
        switch (actionName) {
            case 'add-medicine':
                router.push('/pharmacy/inventory');
                toast.success('Accessing inventory records...');
                break;
            case 'update-stock':
                setIsUpdateStockOpen(true);
                break;
            case 'generate-invoice':
                setIsInvoiceOpen(true);
                break;
            case 'track-order':
                setIsTrackOrderOpen(true);
                break;
            case 'new-prescription':
                setIsPrescriptionOpen(true);
                break;
        }
    };

    const handleUpdateStock = () => {
        if (!stockForm.medicineName || !stockForm.quantity) {
            toast.error('Please fill in all fields');
            return;
        }

        const action = stockForm.action === 'add' ? 'added to' : 'removed from';
        toast.success(`${stockForm.quantity} units ${action} ${stockForm.medicineName} stock`);
        setIsUpdateStockOpen(false);
        setStockForm({ medicineName: '', quantity: '', action: 'add' });
    };

    const handleGenerateInvoice = () => {
        if (!invoiceForm.customerName || invoiceForm.items.some(item => !item.medicine || !item.price)) {
            toast.error('Please fill in all required fields');
            return;
        }

        const total = invoiceForm.items.reduce((sum, item) => {
            const price = parseFloat(item.price.replace('৳', ''));
            return sum + (price * item.quantity);
        }, 0);

        toast.success(`Invoice generated for ${invoiceForm.customerName} - Total: ৳${total.toFixed(2)}`);
        setIsInvoiceOpen(false);
        setInvoiceForm({ customerName: '', items: [{ medicine: '', quantity: 1, price: '' }], paymentMethod: 'Cash' });
    };

    const handleTrackOrder = () => {
        if (!trackOrderForm.orderId) {
            toast.error('Please enter an order ID');
            return;
        }

        const statuses = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        toast.success(`Order ${trackOrderForm.orderId} status: ${randomStatus}`);
        setIsTrackOrderOpen(false);
        setTrackOrderForm({ orderId: '' });
    };

    const addInvoiceItem = () => {
        setInvoiceForm({
            ...invoiceForm,
            items: [...invoiceForm.items, { medicine: '', quantity: 1, price: '' }]
        });
    };

    const updateInvoiceItem = (index: number, field: string, value: any) => {
        const updatedItems = invoiceForm.items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setInvoiceForm({ ...invoiceForm, items: updatedItems });
    };

    const removeInvoiceItem = (index: number) => {
        if (invoiceForm.items.length > 1) {
            setInvoiceForm({
                ...invoiceForm,
                items: invoiceForm.items.filter((_, i) => i !== index)
            });
        }
    };

    const handleAddMedicine = () => {
        if (!newMed.name || !newMed.dosage) {
            toast.error('Medicine name and dosage are required');
            return;
        }
        setPrescriptionForm({
            ...prescriptionForm,
            medicines: [...prescriptionForm.medicines, { ...newMed }]
        });
        setNewMed({ name: '', dosage: '', quantity: 1 });
    };

    const handlePrescriptionSubmit = () => {
        if (!prescriptionForm.patientName || !prescriptionForm.doctorName || prescriptionForm.medicines.length === 0) {
            toast.error('Please fill in all required fields and add at least one medicine');
            return;
        }

        addPrescription({
            patientName: prescriptionForm.patientName,
            doctorName: prescriptionForm.doctorName,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            medicines: prescriptionForm.medicines
        });

        toast.success(`Prescription created for ${prescriptionForm.patientName}`);
        setIsPrescriptionOpen(false);
        setPrescriptionForm({ patientName: '', doctorName: '', medicines: [] });
    };

    return (
        <>
            <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
                <h2 className="text-xl font-black text-secondary-900 tracking-tight mb-8 uppercase text-xs tracking-widest text-primary-600">Quick Protocols</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.name}
                                onClick={() => handleAction(action.action)}
                                className="flex flex-col items-center justify-center p-6 rounded-3xl border border-secondary-100 hover:border-primary-100 hover:bg-secondary-50 transition-all duration-300 group text-center"
                            >
                                <div
                                    className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 text-white", action.color)}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-black text-secondary-900 uppercase tracking-tight group-hover:text-primary-600 transition-all">{action.name}</span>
                                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all">{action.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Update Stock Modal */}
            <Modal
                isOpen={isUpdateStockOpen}
                onClose={() => setIsUpdateStockOpen(false)}
                title="Update Stock"
            >
                <div className="space-y-4">
                    <Input
                        label="Medicine Name"
                        placeholder="Enter medicine name"
                        value={stockForm.medicineName}
                        onChange={(e) => setStockForm({ ...stockForm, medicineName: e.target.value })}
                        required
                    />
                    <Input
                        label="Quantity"
                        type="number"
                        placeholder="Enter quantity"
                        value={stockForm.quantity}
                        onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Action</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="stockAction"
                                    value="add"
                                    checked={stockForm.action === 'add'}
                                    onChange={(e) => setStockForm({ ...stockForm, action: e.target.value })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-secondary-700">Add Stock</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="stockAction"
                                    value="remove"
                                    checked={stockForm.action === 'remove'}
                                    onChange={(e) => setStockForm({ ...stockForm, action: e.target.value })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-secondary-700">Remove Stock</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsUpdateStockOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStock}>Update Stock</Button>
                    </div>
                </div>
            </Modal>

            {/* Generate Invoice Modal */}
            <Modal
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                title="Generate Invoice"
            >
                <div className="space-y-4">
                    <Input
                        label="Customer Name"
                        placeholder="Enter customer name"
                        value={invoiceForm.customerName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Items</label>
                        {invoiceForm.items.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <Input
                                    placeholder="Medicine"
                                    value={item.medicine}
                                    onChange={(e) => updateInvoiceItem(index, 'medicine', e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value))}
                                    className="w-20"
                                />
                                <Input
                                    placeholder="Price"
                                    value={item.price}
                                    onChange={(e) => updateInvoiceItem(index, 'price', e.target.value)}
                                    className="w-24"
                                />
                                {invoiceForm.items.length > 1 && (
                                    <button
                                        onClick={() => removeInvoiceItem(index)}
                                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={addInvoiceItem}>+ Add Item</Button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Method</label>
                        <select
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            value={invoiceForm.paymentMethod}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Insurance">Insurance</option>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsInvoiceOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>
                    </div>
                </div>
            </Modal>

            {/* Track Order Modal */}
            <Modal
                isOpen={isTrackOrderOpen}
                onClose={() => setIsTrackOrderOpen(false)}
                title="Track Order"
            >
                <div className="space-y-4">
                    <Input
                        label="Order ID"
                        placeholder="Enter order ID (e.g., ORD001)"
                        value={trackOrderForm.orderId}
                        onChange={(e) => setTrackOrderForm({ orderId: e.target.value })}
                        required
                    />
                    <div className="bg-secondary-50 p-4 rounded-lg">
                        <p className="text-sm text-secondary-600">
                            Enter an order ID to check its current delivery status and tracking information.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsTrackOrderOpen(false)}>Cancel</Button>
                        <Button onClick={handleTrackOrder}>Track Order</Button>
                    </div>
                </div>
            </Modal>

            {/* New Prescription Modal */}
            <Modal
                isOpen={isPrescriptionOpen}
                onClose={() => setIsPrescriptionOpen(false)}
                title="New Prescription"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="Patient Name"
                            placeholder="Full name"
                            value={prescriptionForm.patientName}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientName: e.target.value })}
                        />
                        <Input
                            label="Doctor Name"
                            placeholder="Dr. Name"
                            value={prescriptionForm.doctorName}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctorName: e.target.value })}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-3">Add Medications</label>
                        <div className="space-y-3">
                            <MedicineSearch
                                value={newMed.name}
                                onChange={(med) => setNewMed({ ...newMed, name: med.name, dosage: med.dosage || newMed.dosage })}
                                placeholder="Search medicine..."
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Dosage"
                                    value={newMed.dosage}
                                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={newMed.quantity}
                                    onChange={(e) => setNewMed({ ...newMed, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-20"
                                />
                                <Button variant="secondary" onClick={handleAddMedicine} className="h-[42px] px-3">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {prescriptionForm.medicines.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                                {prescriptionForm.medicines.map((med, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-secondary-50 p-3 rounded-2xl border border-secondary-100 group/med">
                                        <div>
                                            <p className="text-sm font-bold text-secondary-900">{med.name}</p>
                                            <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-tight">{med.dosage} • Qty: {med.quantity}</p>
                                        </div>
                                        <button
                                            onClick={() => setPrescriptionForm({
                                                ...prescriptionForm,
                                                medicines: prescriptionForm.medicines.filter((_, i) => i !== idx)
                                            })}
                                            className="p-1.5 text-secondary-400 hover:text-error-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsPrescriptionOpen(false)}>Cancel</Button>
                        <Button onClick={handlePrescriptionSubmit} className="px-8">Finalize RX</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
