'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar, FileText, FlaskConical, CheckCircle, Plus, Download, Eye, DollarSign, Edit, Trash2, Save, Copy } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Header from '@/components/layout/Header';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'prescriptions' | 'labs'>('overview');

  // Prescription Modal
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submittingPrescription, setSubmittingPrescription] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Lab Test Modal
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [tests, setTests] = useState<string[]>(['']);
  const [labNotes, setLabNotes] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const [submittingLabTest, setSubmittingLabTest] = useState(false);

  // Fee Recording Modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [visitFee, setVisitFee] = useState('');
  const [feeStatus, setFeeStatus] = useState('paid');
  const [submittingFee, setSubmittingFee] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchTemplates();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [historyRes, appointmentsRes, patientsRes] = await Promise.all([
        api.get(`/api/doctors/patients/${patientId}/history`),
        api.get('/api/doctors/appointments'),
        api.get('/api/doctors/patients'),
      ]);

      const patientData = historyRes.data.data.patient;
      const historyData = historyRes.data.data.history || [];
      const allAppointments = appointmentsRes.data.data.appointments || [];
      const allPatients = patientsRes.data.data.patients || [];

      const patientInfo = allPatients.find((p: any) => p._id === patientId);
      const patientAppointments = allAppointments.filter((apt: any) => apt.patientId === patientId);

      setPatient({ ...patientData, ...patientInfo });
      setHistory(historyData);
      setAppointments(patientAppointments);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/doctors/prescription-templates');
      setTemplates(res.data.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleApplyTemplate = (template: any) => {
    setMedications(template.medications.map((m: any) => ({ ...m, instructions: m.instructions || '' })));
    setDiagnosis(template.diagnosis || '');
    setPrescriptionNotes(template.notes || '');
    toast.success(`Template "${template.name}" applied`);
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName) {
      toast.error('Please enter a name for the template');
      return;
    }
    try {
      await api.post('/api/doctors/prescription-templates', {
        name: newTemplateName,
        medications,
        diagnosis,
        notes: prescriptionNotes,
      });
      toast.success('Template saved successfully');
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
      fetchTemplates();
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  const handleRecordFee = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowFeeModal(true);
  };

  const handleSubmitFee = async () => {
    if (!visitFee || Number(visitFee) <= 0) {
      toast.error('Please enter a valid fee amount');
      return;
    }
    setSubmittingFee(true);
    try {
      await api.post(`/api/doctors/appointments/${selectedAppointmentId}/fee`, {
        visitFee: Number(visitFee),
        feeStatus,
        feeCurrency: 'BDT',
      });
      toast.success('Visit fee recorded successfully');
      setShowFeeModal(false);
      setVisitFee('');
      fetchPatientData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSubmittingFee(false);
    }
  };

  const handleOpenPrescriptionModal = (prescriptionId?: string) => {
    if (prescriptionId) {
      const prescription = history.find(h => h._id === prescriptionId);
      if (prescription?.data?.prescription) {
        setEditingPrescriptionId(prescriptionId);
        setMedications(prescription.data.prescription.medications || [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setDiagnosis(prescription.data.prescription.diagnosis || '');
        setPrescriptionNotes(prescription.data.prescription.notes || '');
        setFollowUpDate(prescription.data.prescription.followUpDate || '');
      }
    } else {
      setEditingPrescriptionId(null);
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setDiagnosis('');
      setPrescriptionNotes('');
      setFollowUpDate('');
    }
    setShowPrescriptionModal(true);
  };

  const handleSubmitPrescription = async () => {
    if (medications.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error('Please fill all medication fields');
      return;
    }
    setSubmittingPrescription(true);
    try {
      if (editingPrescriptionId) {
        await api.put(`/api/doctors/prescriptions/${editingPrescriptionId}`, {
          medications,
          diagnosis,
          notes: prescriptionNotes,
          followUpDate,
          regeneratePDF: true,
        });
        toast.success('Prescription updated successfully');
      } else {
        await api.post('/api/doctors/prescriptions', {
          patientId,
          medications,
          diagnosis,
          notes: prescriptionNotes,
          followUpDate,
          generatePDF: true,
        });
        toast.success('Prescription created successfully');
      }
      setShowPrescriptionModal(false);
      fetchPatientData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const handleSubmitLabTest = async () => {
    const validTests = tests.filter(t => t.trim());
    if (validTests.length === 0) {
      toast.error('Please add at least one test');
      return;
    }
    setSubmittingLabTest(true);
    try {
      await api.post('/api/doctors/lab-tests/request', {
        patientId,
        tests: validTests,
        notes: labNotes,
        urgency,
      });
      toast.success('Lab test requested successfully');
      setShowLabTestModal(false);
      setTests(['']);
      setLabNotes('');
      fetchPatientData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSubmittingLabTest(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading patient data..." />;

  const prescriptions = history.filter((h: any) => h.type === 'prescription');
  const labReports = history.filter((h: any) => h.type === 'lab' || h.type === 'lab-test-request');
  const vitals = history.filter((h: any) => h.type === 'vitals');

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="text-3xl font-bold">
                {patient?.user?.profile?.firstName} {patient?.user?.profile?.lastName}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenPrescriptionModal()}>
                <Plus className="w-4 h-4 mr-2" /> New Prescription
              </Button>
              <Button variant="secondary" onClick={() => setShowLabTestModal(true)}>
                <FlaskConical className="w-4 h-4 mr-2" /> Request Lab Test
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border rounded-xl p-1 gap-1">
            {['overview', 'history', 'prescriptions', 'labs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card padding="lg" title="Patient Information">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-primary-500" />
                    <span>{patient?.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-primary-500" />
                    <span>{patient?.user?.profile?.phone || 'N/A'}</span>
                  </div>
                  {patient?.insurance && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-secondary-700">Insurance</p>
                      <p className="text-sm">{patient.insurance.provider}</p>
                      <p className="text-xs text-secondary-500">{patient.insurance.policyNumber}</p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="lg:col-span-2 flex flex-col gap-6">
                <Card padding="lg" title="Upcoming Appointments">
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
                      .map((a) => (
                        <div key={a.id} className="p-4 bg-white border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {new Date(a.date).toLocaleDateString()} at {a.time}
                            </p>
                            <p className="text-sm text-secondary-500">{a.type}</p>
                          </div>
                          <div className="flex gap-2">
                            {!a.visitFee && (
                              <Button size="sm" variant="secondary" onClick={() => handleRecordFee(a.id)}>
                                <DollarSign className="w-4 h-4 mr-1" /> Record Fee
                              </Button>
                            )}
                            {a.visitFee && (
                              <Badge variant="success">
                                ৳{a.visitFee} ({a.feeStatus})
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    {appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length === 0 && (
                      <p className="text-secondary-500 text-center py-4">No upcoming appointments</p>
                    )}
                  </div>
                </Card>

                {vitals.length > 0 && vitals[0]?.data?.vitals && (
                  <Card padding="lg" title="Latest Vitals">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(vitals[0].data.vitals).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-center p-3 bg-secondary-50 rounded-lg">
                          <p className="text-xs text-secondary-500 uppercase">{key}</p>
                          <p className="text-lg font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <Card padding="lg" title="Complete Medical History">
              <div className="space-y-4">
                {history
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={record._id} className="p-4 border rounded-lg bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant={record.type === 'prescription' ? 'primary' : record.type === 'lab' ? 'success' : 'secondary'}>
                            {record.type}
                          </Badge>
                          <p className="text-sm text-secondary-500 mt-1">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        {record.type === 'prescription' && record.data?.prescription?.pdfUrl && (
                          <a href={record.data.prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                      {record.type === 'prescription' && record.data?.prescription && (
                        <div className="mt-2">
                          <p className="font-semibold">Diagnosis: {record.data.prescription.diagnosis}</p>
                          <p className="text-sm">
                            Medications: {record.data.prescription.medications?.map((m: any) => m.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {activeTab === 'prescriptions' && (
            <Card padding="lg" title="Prescriptions">
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p._id} className="p-4 border rounded-lg bg-white flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{new Date(p.date).toLocaleDateString()}</p>
                      {p.data?.prescription && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Diagnosis: {p.data.prescription.diagnosis}</p>
                          <p className="text-sm text-secondary-600">Medications: {p.data.prescription.medications?.length || 0}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenPrescriptionModal(p._id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {p.data?.prescription?.pdfUrl && (
                        <a href={p.data.prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && <p className="text-secondary-500 text-center py-8">No prescriptions yet</p>}
              </div>
            </Card>
          )}

          {activeTab === 'labs' && (
            <Card padding="lg" title="Lab Tests">
              <div className="space-y-3">
                {labReports.map((r) => (
                  <div key={r._id} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{new Date(r.date).toLocaleDateString()}</p>
                        <Badge
                          variant={(r.data?.labTestRequest?.status || '').toLowerCase() === 'completed' ? 'success' : 'warning'}
                          className="mt-2"
                        >
                          {r.data?.labTestRequest?.status || r.type}
                        </Badge>
                        {r.data?.labTestRequest?.tests && <p className="text-sm mt-2">Tests: {r.data.labTestRequest.tests.join(', ')}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {labReports.length === 0 && <p className="text-secondary-500 text-center py-8">No lab tests requested</p>}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Prescription Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        title={editingPrescriptionId ? 'Edit Prescription' : 'New Prescription'}
      >
        <div className="space-y-4">
          {templates.length > 0 && (
            <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 mb-4">
              <label className="block text-xs font-bold text-primary-700 uppercase mb-2">Apply Template</label>
              <div className="flex flex-wrap gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl._id}
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-3 py-1 bg-white border border-primary-200 text-primary-700 text-xs font-medium rounded-full hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Input label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis..." />

          <div>
            <label className="block text-sm font-medium mb-2">Medications</label>
            {medications.map((med, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 mb-2 p-3 border rounded-lg">
                <Input
                  placeholder="Medicine name"
                  value={med.name}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[idx].name = e.target.value;
                    setMedications(updated);
                  }}
                />
                <Input
                  placeholder="Dosage"
                  value={med.dosage}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[idx].dosage = e.target.value;
                    setMedications(updated);
                  }}
                />
                <Input
                  placeholder="Frequency"
                  value={med.frequency}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[idx].frequency = e.target.value;
                    setMedications(updated);
                  }}
                />
                <Input
                  placeholder="Duration"
                  value={med.duration}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[idx].duration = e.target.value;
                    setMedications(updated);
                  }}
                />
                <Input
                  placeholder="Instructions"
                  value={med.instructions}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[idx].instructions = e.target.value;
                    setMedications(updated);
                  }}
                  className="col-span-2"
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
              }
            >
              <Plus className="w-4 h-4 mr-2" /> Add Medication
            </Button>
          </div>

          <Textarea
            label="Notes"
            value={prescriptionNotes}
            onChange={(e) => setPrescriptionNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
          <Input label="Follow-up Date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />

          <div className="flex gap-2 justify-between pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveTemplateModal(true)}
              disabled={medications.every((m) => !m.name)}
            >
              <Save className="w-4 h-4 mr-2" /> Save as Template
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowPrescriptionModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPrescription} isLoading={submittingPrescription}>
                {editingPrescriptionId ? 'Update' : 'Create'} Prescription
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lab Test Modal */}
      <Modal isOpen={showLabTestModal} onClose={() => setShowLabTestModal(false)} title="Request Lab Test">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tests</label>
            {tests.map((test, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  placeholder="Test name"
                  value={test}
                  onChange={(e) => {
                    const updated = [...tests];
                    updated[idx] = e.target.value;
                    setTests(updated);
                  }}
                  className="flex-1"
                />
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setTests([...tests, ''])}>
              <Plus className="w-4 h-4 mr-2" /> Add Test
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white text-secondary-900"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>

          <Textarea
            label="Notes"
            value={labNotes}
            onChange={(e) => setLabNotes(e.target.value)}
            placeholder="Special instructions..."
            rows={3}
          />

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowLabTestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitLabTest} isLoading={submittingLabTest}>
              Request Tests
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fee Recording Modal */}
      <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Record Visit Fee">
        <div className="space-y-4">
          <Input
            label="Visit Fee (৳ Taka)"
            type="number"
            value={visitFee}
            onChange={(e) => setVisitFee(e.target.value)}
            placeholder="Enter fee amount..."
          />

          <div>
            <label className="block text-sm font-medium mb-2">Payment Status</label>
            <select
              value={feeStatus}
              onChange={(e) => setFeeStatus(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white text-secondary-900"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="waived">Waived</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowFeeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFee} isLoading={submittingFee}>
              Record Fee
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Template Modal */}
      <Modal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)} title="Save as Template">
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g., Common Cold Treatment"
          />
          <p className="text-xs text-secondary-500">
            This will save the current medications, diagnosis, and notes as a reusable template.
          </p>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowSaveTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate}>Save Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
