'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export interface Prescription {
    id: number;
    patientName: string;
    doctorName: string;
    date: string;
    medicines: (string | { name: string; dosage: string; quantity: number })[];
    status: 'pending' | 'approved' | 'rejected';
}

interface PrescriptionListProps {
    prescriptions: Prescription[];
    setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
}

export function PrescriptionList({ prescriptions, setPrescriptions }: PrescriptionListProps) {
    const router = useRouter();
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Simulate new prescriptions coming in
    useEffect(() => {
        const interval = setInterval(() => {
            // 20% chance to add a new prescription
            if (Math.random() > 0.8 && prescriptions.length < 10) {
                const newPatients = ['John Doe', 'Emma Wilson', 'David Lee', 'Lisa Anderson', 'Tom Harris'];
                const newDoctors = ['Dr. Sarah Johnson', 'Dr. Mark Davis', 'Dr. Anna White', 'Dr. Chris Brown'];
                const newMedicines = [
                    ['Aspirin 100mg', 'Vitamin D 1000IU'],
                    ['Omeprazole 20mg'],
                    ['Levothyroxine 50mcg', 'Calcium 500mg'],
                    ['Losartan 50mg'],
                ];

                const randomPatient = newPatients[Math.floor(Math.random() * newPatients.length)];
                const randomDoctor = newDoctors[Math.floor(Math.random() * newDoctors.length)];
                const randomMeds = newMedicines[Math.floor(Math.random() * newMedicines.length)];

                const newPrescription: Prescription = {
                    id: Math.max(...prescriptions.map(p => p.id)) + 1,
                    patientName: randomPatient,
                    doctorName: randomDoctor,
                    date: 'Just now',
                    medicines: randomMeds,
                    status: 'pending',
                };

                setPrescriptions(prev => [newPrescription, ...prev]);
                toast.success(`New prescription from ${randomPatient}`);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [prescriptions]);

    const handleApprove = (prescription: Prescription) => {
        setPrescriptions(prev => prev.map(p =>
            p.id === prescription.id ? { ...p, status: 'approved' as const } : p
        ));
        toast.success(`Prescription for ${prescription.patientName} approved`);

        // Remove from list after 2 seconds
        setTimeout(() => {
            setPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
        }, 2000);
    };

    const handleReject = (prescription: Prescription) => {
        if (confirm(`Are you sure you want to reject the prescription for ${prescription.patientName}?`)) {
            setPrescriptions(prev => prev.map(p =>
                p.id === prescription.id ? { ...p, status: 'rejected' as const } : p
            ));
            toast.error(`Prescription for ${prescription.patientName} rejected`);

            // Remove from list after 2 seconds
            setTimeout(() => {
                setPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
            }, 2000);
        }
    };

    const handleViewDetails = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setIsDetailsModalOpen(true);
    };

    const handleViewAll = () => {
        router.push('/pharmacy/prescriptions');
        toast.success('Redirecting to prescriptions page...');
    };

    // Only show pending prescriptions
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').slice(0, 3);

    return (
        <>
            <div className="card h-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-secondary-900">Recent Prescriptions</h2>
                    <button
                        onClick={handleViewAll}
                        className="text-primary-600 text-sm font-medium hover:text-primary-700 transition-colors"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-4">
                    {pendingPrescriptions.length > 0 ? (
                        pendingPrescriptions.map((script) => (
                            <div
                                key={script.id}
                                className="p-4 rounded-xl border border-secondary-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-secondary-900">{script.patientName}</h3>
                                        <p className="text-xs text-secondary-500 mt-1">Prescribed by {script.doctorName}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {script.medicines.map((med, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-100 text-xs font-medium text-secondary-700"
                                                >
                                                    {typeof med === 'string' ? med : `${med.name} ${med.dosage} (${med.quantity})`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 ml-4">
                                        <span className="inline-flex items-center gap-1 text-xs text-secondary-500 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {script.date}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => handleApprove(script)}
                                                className="p-1.5 rounded-lg bg-success-100 text-success-700 hover:bg-success-200 transition-colors"
                                                title="Approve"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(script)}
                                                className="p-1.5 rounded-lg bg-error-100 text-error-700 hover:bg-error-200 transition-colors"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(script)}
                                                className="p-1.5 rounded-lg bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-secondary-500">No pending prescriptions</p>
                            <p className="text-sm text-secondary-400 mt-1">New prescriptions will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Prescription Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedPrescription(null);
                }}
                title="Prescription Details"
            >
                {selectedPrescription && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Patient</label>
                            <p className="text-secondary-900 font-semibold">{selectedPrescription.patientName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Prescribed By</label>
                            <p className="text-secondary-900">{selectedPrescription.doctorName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Date & Time</label>
                            <p className="text-secondary-900">{selectedPrescription.date}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">Medications</label>
                            <div className="space-y-2">
                                {selectedPrescription.medicines.map((med, idx) => (
                                    <div key={idx} className="p-3 bg-secondary-50 rounded-lg">
                                        <p className="text-sm font-medium text-secondary-900">
                                            {typeof med === 'string' ? med : `${med.name} - ${med.dosage} (${med.quantity} qty)`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsDetailsModalOpen(false);
                                    setSelectedPrescription(null);
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    handleReject(selectedPrescription);
                                    setIsDetailsModalOpen(false);
                                }}
                            >
                                Reject
                            </Button>
                            <Button
                                onClick={() => {
                                    handleApprove(selectedPrescription);
                                    setIsDetailsModalOpen(false);
                                }}
                            >
                                Approve
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
