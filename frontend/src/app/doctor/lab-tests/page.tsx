'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, X, Search, Database, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import PatientSearch from '@/components/doctor/PatientSearch';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LabTest {
  id: string;
  name: string;
  category: string;
  priceBDT: number;
}

export default function LabTestsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [masterTests, setMasterTests] = useState<LabTest[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    fetchMasterTests();
  }, []);

  const fetchMasterTests = async () => {
    try {
      setLoadingTests(true);
      const res = await api.get('/api/doctors/lab-tests/master');
      setMasterTests(res.data.data.tests);
    } catch (err) {
      console.error('Error fetching master tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const addTestRow = () => {
    setSelectedTestIds([...selectedTestIds, '']);
  };

  const removeTestRow = (index: number) => {
    if (selectedTestIds.length > 1) {
      setSelectedTestIds(selectedTestIds.filter((_, i) => i !== index));
    }
  };

  const updateTestSelection = (index: number, value: string) => {
    const updated = [...selectedTestIds];
    updated[index] = value;
    setSelectedTestIds(updated);
  };

  const calculateTotal = () => {
    return selectedTestIds.reduce((sum, id) => {
      const test = masterTests.find(t => t.id === id);
      return sum + (test ? Number(test.priceBDT) : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const validTestIds = selectedTestIds.filter((id) => id !== '');
    if (validTestIds.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/doctors/lab-tests/postgres-request', {
        patientId: selectedPatient.userId || selectedPatient._id, // Use userId for Postgres model consistency
        testIds: validTestIds,
        notes,
      });

      toast.success('Laboratory analysis request broadcast successfully!');

      // Reset form
      setSelectedPatient(null);
      setSelectedTestIds(['']);
      setNotes('');
      setShowModal(false);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <FlaskConical className="w-10 h-10 text-cyan-400" />
              Lab <span className="text-cyan-400">Requests</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-wide">
              INITIATE DIAGNOSTIC PROTOCOLS FOR YOUR PATIENTS
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest px-8">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Button>
        </div>

        <GlassCard padding="lg">
          <div className="text-center py-20">
            <Database className="w-20 h-20 text-white/5 mx-auto mb-6" />
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] mb-6">No recent lab test transactions</p>
            <Button variant="ghost" onClick={() => setShowModal(true)} className="border-white/10 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400">
              OPEN REQUEST TERMINAL
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Request Lab Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPatient(null);
          setSelectedTestIds(['']);
          setNotes('');
        }}
        title="DIAGNOSTIC REQUEST TERMINAL"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          {/* Patient Search */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Search className="w-3 h-3" /> Target Subject
            </label>
            <PatientSearch
              onSelectPatient={(patient) => setSelectedPatient(patient)}
              selectedPatientId={selectedPatient?._id}
            />
          </div>

          {/* Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FlaskConical className="w-3 h-3" /> Protocol Selection
              </label>
              <button type="button" onClick={addTestRow} className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Test
              </button>
            </div>

            <div className="space-y-3">
              {selectedTestIds.map((selectedId, index) => {
                const currentTest = masterTests.find(t => t.id === selectedId);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <select
                        value={selectedId}
                        onChange={(e) => updateTestSelection(index, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors uppercase text-sm font-bold appearance-none"
                      >
                        <option value="" className="bg-gray-900">-- SELECT DIAGNOSTIC PROTOCOL --</option>
                        {masterTests.map((t) => (
                          <option key={t.id} value={t.id} className="bg-gray-900">
                            {t.name} ({t.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentTest && (
                      <div className="hidden md:block w-32 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-right">
                        <span className="text-cyan-400 font-black font-mono">
                          ৳{Number(currentTest.priceBDT).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedTestIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestRow(index)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Summary */}
          {selectedTestIds.some(id => id !== '') && (
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estimated Valuation</p>
                  <p className="text-xs text-gray-400 uppercase font-medium">Post-Analysis Billing Estimate</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-mono tracking-tighter">
                  ৳{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Clinical Observations / Special Instructions</label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ENTER SPECIFIC PARAMETERS OR REQUIREMENTS..."
              rows={3}
              className="bg-white/5 border-white/10 focus:border-cyan-500/50 text-white placeholder:text-gray-700 font-bold uppercase text-xs tracking-wider"
            />
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="border-white/10 text-gray-500 uppercase tracking-widest font-black"
            >
              Abort
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest px-12"
            >
              Broadcast Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

