'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Phone, CreditCard, Download, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InsurancePage() {
    const [loading, setLoading] = useState(true);
    const [insurance, setInsurance] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        provider: '',
        policyNumber: '',
        groupNumber: '',
        expiryDate: ''
    });

    const fetchInsurance = async () => {
        try {
            const res = await api.get('/api/patients/profile');
            setInsurance(res.data?.data?.patient?.insurance || null);
            // Pre-fill form if data exists
            if (res.data?.data?.patient?.insurance) {
                const ins = res.data.data.patient.insurance;
                setFormData({
                    provider: ins.provider || '',
                    policyNumber: ins.policyNumber || '',
                    groupNumber: ins.groupNumber || '',
                    expiryDate: ins.expiryDate ? new Date(ins.expiryDate).toISOString().split('T')[0] : ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch insurance profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsurance();
    }, []);

    const handleSave = async () => {
        if (!formData.provider || !formData.policyNumber) {
            toast.error('Provider and Policy Number are required');
            return;
        }

        setSubmitting(true);
        try {
            await api.put('/api/patients/profile', {
                insurance: formData
            });
            toast.success('Insurance details saved successfully');
            setShowModal(false);
            fetchInsurance(); // Refresh data
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-teal-600" />
                    Insurance & Coverage
                </h1>
                <p className="text-slate-500">Manage your health insurance policy and claims.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
            ) : !insurance || !insurance.provider ? (
                <Card className="p-12 text-center border-dashed">
                    <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-900">No Insurance Linked</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">You haven't added any insurance details to your profile yet. Add a policy to streamline billing.</p>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => setShowModal(true)}
                    >
                        Link Insurance Provider
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ID Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-64 flex flex-col justify-between">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="font-medium text-teal-100 uppercase tracking-wider text-xs mb-1">Provider</p>
                                    <h2 className="text-2xl font-bold">{insurance.provider}</h2>
                                </div>
                                <ShieldCheck className="w-8 h-8 text-teal-100" />
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                <div>
                                    <p className="font-medium text-teal-100 uppercase tracking-wider text-xs mb-1">Policy Number</p>
                                    <p className="font-mono text-xl">{insurance.policyNumber}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-teal-100 uppercase tracking-wider text-xs mb-1">Group Number</p>
                                    <p className="font-mono text-xl">{insurance.groupNumber || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end relative z-10">
                                <div>
                                    <p className="font-medium text-teal-100 uppercase tracking-wider text-xs mb-1">Coverage Valid Thru</p>
                                    <p className="font-bold">{insurance.expiryDate ? new Date(insurance.expiryDate).toLocaleDateString() : 'Active'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-teal-100 mb-1">Policy Type</p>
                                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">Comprehensive</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Coverage Details */}
                        <Card className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-500" /> Coverage Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm text-slate-500">Co-Pay (Primary Care)</span>
                                    <p className="text-lg font-bold text-slate-800">৳25.00</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm text-slate-500">Co-Pay (Specialist)</span>
                                    <p className="text-lg font-bold text-slate-800">৳45.00</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm text-slate-500">Deductible (Individual)</span>
                                    <p className="text-lg font-bold text-slate-800">৳1,500.00</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm text-slate-500">Out-of-pocket Max</span>
                                    <p className="text-lg font-bold text-slate-800">৳5,000.00</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Button variant="ghost" className="w-full justify-start text-slate-600">
                                    <Download className="w-4 h-4 mr-2" /> Download Digital ID
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-600">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Visit Provider Portal
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-slate-600">
                                    <Phone className="w-4 h-4 mr-2" /> Contact Support
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6 bg-blue-50 border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-2">Need to update info?</h3>
                            <p className="text-sm text-blue-700/80 mb-4">
                                If your insurance details have changed, please update them to ensure accurate billing.
                            </p>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowModal(true)}>Update Insurance</Button>
                        </Card>
                    </div>
                </div>
            )}

            {/* Insurance Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Edit Insurance Details"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} isLoading={submitting}>Save Changes</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="label">Insurance Provider</label>
                        <Input
                            placeholder="e.g. Blue Cross Blue Shield"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Policy Number</label>
                        <Input
                            placeholder="e.g. XYZ123456789"
                            value={formData.policyNumber}
                            onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Group Number (Optional)</label>
                            <Input
                                placeholder="e.g. GRP98765"
                                value={formData.groupNumber}
                                onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Expiry Date</label>
                            <Input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
