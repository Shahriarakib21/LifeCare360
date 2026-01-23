'use client';

import React, { useState } from 'react';
import { FlaskConical, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import PatientSearch from '@/components/doctor/PatientSearch';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose (Fasting)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Function Test (TFT)',
  'Urine Analysis',
  'ECG',
  'Chest X-Ray',
  'Ultrasound',
  'CT Scan',
  'MRI',
  'HbA1c',
  'Vitamin D',
  'Vitamin B12',
  'PSA (Prostate Specific Antigen)',
  'Pap Smear',
  'Mammogram',
  'Bone Density Test',
  'Other',
];

export default function LabTestsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [tests, setTests] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const [submitting, setSubmitting] = useState(false);

  const addTest = () => {
    setTests([...tests, '']);
  };

  const removeTest = (index: number) => {
    if (tests.length > 1) {
      setTests(tests.filter((_, i) => i !== index));
    }
  };

  const updateTest = (index: number, value: string) => {
    const updated = [...tests];
    updated[index] = value;
    setTests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const validTests = tests.filter((t) => t.trim() !== '');
    if (validTests.length === 0) {
      toast.error('Please add at least one test');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/doctors/lab-tests/request', {
        patientId: selectedPatient._id,
        tests: validTests,
        notes,
        urgency,
      });

      toast.success('Lab test request created successfully!');
      
      // Reset form
      setSelectedPatient(null);
      setTests(['']);
      setNotes('');
      setUrgency('routine');
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
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Lab Test Requests</h1>
            <p className="text-secondary-600">Request laboratory tests for your patients</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Request Test
          </Button>
        </div>

        <Card padding="lg">
          <div className="text-center py-12">
            <FlaskConical className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600 mb-4">No lab test requests yet</p>
            <Button onClick={() => setShowModal(true)}>Request Your First Test</Button>
          </div>
        </Card>
      </div>

      {/* Request Lab Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPatient(null);
          setTests(['']);
          setNotes('');
          setUrgency('routine');
        }}
        title="Request Lab Test"
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
              Request Test
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

          {/* Urgency */}
          <div>
            <label htmlFor="urgency" className="label">Urgency</label>
            <Select
              id="urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              options={[
                { value: 'routine', label: 'Routine' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'stat', label: 'STAT (Immediate)' },
              ]}
            />
          </div>

          {/* Tests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="label">Tests *</label>
              <Button type="button" variant="ghost" size="sm" onClick={addTest}>
                <Plus className="w-4 h-4 mr-1" />
                Add Test
              </Button>
            </div>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Select
                    value={test}
                    onChange={(e) => updateTest(index, e.target.value)}
                    options={[
                      { value: '', label: 'Select a test...' },
                      ...COMMON_TESTS.map((t) => ({ value: t, label: t })),
                    ]}
                    className="flex-1"
                  />
                  {tests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTest(index)}
                      className="text-error-600 hover:text-error-700 p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">Notes</label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or instructions for the lab"
              rows={4}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

