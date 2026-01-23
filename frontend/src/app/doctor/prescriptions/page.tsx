'use client';

import React, { useState } from 'react';
import { FileText, Plus, X, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import PatientSearch from '@/components/doctor/PatientSearch';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [generatePDF, setGeneratePDF] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    // Validate medications
    const validMedications = medications.filter(
      (m) => m.name && m.dosage && m.frequency && m.duration
    );

    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/doctors/prescriptions', {
        patientId: selectedPatient._id,
        medications: validMedications,
        diagnosis,
        notes,
        followUpDate,
        generatePDF,
      });

      toast.success('Prescription created successfully!');

      const pdfUrl = response.data.data.pdfUrl || response.data.data.prescription?.pdfUrl;

      if (pdfUrl) {
        toast.success('Opening PDF...');
        window.open(pdfUrl, '_blank');
      }

      // Reset form
      setSelectedPatient(null);
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setDiagnosis('');
      setNotes('');
      setFollowUpDate('');
      setShowModal(false);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Prescriptions</h1>
            <p className="text-secondary-600">Create and manage patient prescriptions</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Prescription
          </Button>
        </div>

        <Card padding="lg">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600 mb-4">No prescriptions created yet</p>
            <Button onClick={() => setShowModal(true)}>Create Your First Prescription</Button>
          </div>
        </Card>
      </div>

      {/* Create Prescription Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPatient(null);
          setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
          setDiagnosis('');
          setNotes('');
          setFollowUpDate('');
        }}
        title="Create Prescription"
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={submitting}>
              Create Prescription
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div>
            <label className="label">Select Patient *</label>
            <PatientSearch
              onSelectPatient={(patient) => setSelectedPatient(patient)}
              selectedPatientId={selectedPatient?._id}
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label htmlFor="diagnosis" className="label">Diagnosis</label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis"
            />
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="label">Medications *</label>
              <Button type="button" variant="ghost" size="sm" onClick={addMedication}>
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </Button>
            </div>
            <div className="space-y-4">
              {medications.map((med, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-secondary-900">Medication {index + 1}</h4>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-sm">Medication Name *</label>
                      <Input
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Dosage *</label>
                      <Input
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Frequency *</label>
                      <Input
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        required
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Duration *</label>
                      <Input
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label text-sm">Instructions</label>
                      <Textarea
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="Additional instructions for the patient"
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">Additional Notes</label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or instructions"
              rows={3}
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label htmlFor="followUpDate" className="label">Follow-up Date</label>
            <Input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          {/* Generate PDF Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generatePDF"
              checked={generatePDF}
              onChange={(e) => setGeneratePDF(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="generatePDF" className="text-sm text-secondary-700">
              Generate PDF prescription
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

