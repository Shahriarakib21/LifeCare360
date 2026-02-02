'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Clock, AlertCircle, RefreshCcw, FileText, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Medication {
    id: string; // EHR ID
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    startDate: string;
    endDate?: string;
    instructions: string;
    prescribedBy?: {
        name: string;
        specialty?: string;
    };
    status: 'active' | 'completed' | 'discontinued';
}

import { ShoppingBag } from 'lucide-react';
import OrderModal from '@/components/patient/OrderModal';

export default function MedicationsPage() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const [orderMedications, setOrderMedications] = useState<any[]>([]);
    const [reminderData, setReminderData] = useState({
        medication: '',
        time: '',
        frequency: 'daily',
        duration: '',
    });

    useEffect(() => {
        fetchMedications();
    }, []);

    const fetchMedications = async () => {
        try {
            const res = await api.get('/api/patients/medications');
            const processed: Medication[] = res.data.data.medications.map((record: any, outerIdx: number) => {
                const data = record.data?.prescription || {};
                const medsList = Array.isArray(data.medications) ? data.medications :
                    data.medication ? [{
                        name: data.medication,
                        dosage: data.dosage,
                        frequency: data.frequency,
                        duration: data.duration,
                        instructions: data.instructions
                    }] : [];

                return medsList.map((m: any, idx: number) => ({
                    id: `med_${record._id}_${outerIdx}_${idx}`, // Unique ID for each medication item
                    name: m.name || m.medication || 'Unknown',
                    dosage: m.dosage,
                    frequency: m.frequency,
                    duration: m.duration,
                    startDate: record.date,
                    instructions: m.instructions,
                    prescribedBy: {
                        name: record.recordedBy?.profile ? `Dr. ${record.recordedBy.profile.firstName} ${record.recordedBy.profile.lastName}` : 'Unknown Doctor'
                    },
                    status: 'active',
                    originalRecord: record // Keep ref to original record for ordering entire prescription
                }));
            }).flat();

            setMedications(processed);
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeMeds = medications.filter(m => m.status === 'active');

    const handleOrderClick = (med: any) => {
        // Group medications from the same prescription if possible, 
        // but here we might just order the single one or find all from same ID.
        // For simplicity, we order the selected medication's "Prescription Context".

        // Find all meds from same original record (same prescription)
        const relatedMeds = medications.filter(m => (m as any).originalRecord?._id === (med as any).originalRecord?._id);

        setSelectedPrescription({ id: med.originalRecord?._id || med.id }); // Using EHR ID from original record
        setOrderMedications(relatedMeds);
        setShowOrderModal(true);
    };

    const handleRefillRequest = async (med: any) => {
        try {
            await api.post('/api/pharmacy/refills', {
                prescriptionId: med.originalRecord?._id || med.id, // Use original prescription ID
                medication: med.name,
                quantity: parseInt(med.dosage) || 1,
                notes: `Refill requested for ${med.name} (${med.dosage})`
            });
            toast.success(`Refill request sent for ${med.name}`);
        } catch (error: any) {
            toast.error(handleApiError(error));
        }
    };

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/patients/medications/reminders', reminderData);
            toast.success('Reminder set successfully');
            setShowAddModal(false);
        } catch (error: any) {
            toast.error(handleApiError(error));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Medications & Prescriptions</h1>
                    <p className="text-slate-500">Track your active treatments and refill history</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setShowAddModal(true)} variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Clock className="w-4 h-4 mr-2" /> Set Reminder
                    </Button>
                    <Button onClick={() => window.location.href = '/medicines'} className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Pill className="w-4 h-4 mr-2" /> Shop Medicines
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : (
                <>
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><Pill className="w-5 h-5" /></div>
                            <h2 className="text-xl font-bold text-slate-800">Active Medications</h2>
                        </div>

                        {activeMeds.length === 0 ? (
                            <Card className="p-8 text-center border-dashed bg-slate-50">
                                <p className="text-slate-500">No active medications found.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeMeds.map((med) => (
                                    <Card key={med.id} className="relative overflow-hidden group hover:shadow-lg transition-all border-l-4 border-l-teal-500">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-900">{med.name}</h3>
                                                <Badge variant="success" className="text-xs">Active</Badge>
                                            </div>
                                            <p className="text-sm font-medium text-teal-600 mb-4">{med.dosage} • {med.frequency}</p>

                                            <div className="space-y-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 mt-0.5 text-slate-400" />
                                                    <span>{med.instructions || 'No special instructions'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span>{med.duration}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs text-slate-400">Prescribed by {med.prescribedBy?.name}</span>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50 h-8" onClick={() => handleRefillRequest(med)}>
                                                        <RefreshCcw className="w-3 h-3 mr-1.5" /> Refill
                                                    </Button>
                                                    <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700 h-8 text-xs" onClick={() => handleOrderClick(med)}>
                                                        <ShoppingBag className="w-3 h-3 mr-1.5" /> Order
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Set Medication Reminder">
                <form onSubmit={handleAddReminder} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
                        <Input
                            value={reminderData.medication}
                            onChange={(e) => setReminderData({ ...reminderData, medication: e.target.value })}
                            placeholder="e.g. Metformin"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <Input
                                type="time"
                                value={reminderData.time}
                                onChange={(e) => setReminderData({ ...reminderData, time: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                value={reminderData.frequency}
                                onChange={(e) => setReminderData({ ...reminderData, frequency: e.target.value })}
                            >
                                <option value="daily">Daily</option>
                                <option value="twice_daily">Twice Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Set Reminder</Button>
                </form>
            </Modal>

            {/* Order Modal */}
            <OrderModal
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                prescription={selectedPrescription}
                medications={orderMedications}
            />
        </div>
    );
}
