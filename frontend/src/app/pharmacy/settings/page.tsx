'use client';

import React, { useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, Clock, User, Lock, Bell, CreditCard, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function PharmacySettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'billing'>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // Form states
    const [generalInfo, setGeneralInfo] = useState({
        pharmacyName: 'HealthLife Pharmacy',
        licenseNumber: 'PH-2024-001',
        phone: '+1 (555) 123-4567',
        email: 'contact@healthlife.com',
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notifications, setNotifications] = useState({
        emailPrescriptions: true,
        emailLowStock: true,
        emailRefills: true,
        emailMessages: true,
        smsUrgent: false,
        smsCritical: false,
    });

    // Handlers
    const handleSaveGeneral = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('General settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Notification preferences saved!');
        } catch (error) {
            toast.error('Failed to save preferences. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Failed to update password. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle2FA = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIs2FAEnabled(!is2FAEnabled);
            toast.success(is2FAEnabled ? '2FA disabled successfully' : '2FA enabled successfully!');
        } catch (error) {
            toast.error('Failed to toggle 2FA. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevokeSession = async (device: string) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success(`Session revoked for ${device}`);
        } catch (error) {
            toast.error('Failed to revoke session. Please try again.');
        }
    };

    const handleUpgradePlan = () => {
        toast.success('Redirecting to upgrade page...');
        // In a real app, this would navigate to the upgrade page
    };

    const handleUpdatePayment = () => {
        toast.success('Opening payment update modal...');
        // In a real app, this would open a payment modal
    };

    const handleAddPayment = () => {
        toast.success('Opening add payment method modal...');
        // In a real app, this would open a payment modal
    };

    const handleDownloadInvoice = (date: string) => {
        toast.success(`Downloading invoice for ${date}...`);
        // In a real app, this would trigger a file download
    };

    const handleNotificationToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const tabs = [
        { id: 'general' as const, label: 'General', icon: Building2 },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'security' as const, label: 'Security', icon: Lock },
        { id: 'billing' as const, label: 'Billing', icon: CreditCard },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-secondary-900">Pharmacy Settings</h1>
                <p className="text-secondary-600 mt-1">Manage your pharmacy profile and preferences</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-secondary-200">
                <div className="flex gap-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pharmacy Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Pharmacy Name"
                                placeholder="Enter pharmacy name"
                                defaultValue="HealthLife Pharmacy"
                                leftIcon={<Building2 className="w-5 h-5" />}
                            />
                            <Input
                                label="License Number"
                                placeholder="Enter license number"
                                defaultValue="PH-2024-001"
                                leftIcon={<User className="w-5 h-5" />}
                            />
                            <Input
                                label="Phone Number"
                                placeholder="Enter phone number"
                                defaultValue="+1 (555) 123-4567"
                                leftIcon={<Phone className="w-5 h-5" />}
                            />
                            <Input
                                label="Email Address"
                                placeholder="Enter email address"
                                defaultValue="contact@healthlife.com"
                                leftIcon={<Mail className="w-5 h-5" />}
                            />
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Address</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                label="Street Address"
                                placeholder="Enter street address"
                                defaultValue="123 Main Street"
                                leftIcon={<MapPin className="w-5 h-5" />}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input label="City" placeholder="Enter city" defaultValue="New York" />
                                <Input label="State" placeholder="Enter state" defaultValue="NY" />
                                <Input label="ZIP Code" placeholder="Enter ZIP code" defaultValue="10001" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Operating Hours</h2>
                        <div className="space-y-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <div key={day} className="flex items-center gap-4">
                                    <div className="w-32">
                                        <span className="text-sm font-medium text-secondary-700">{day}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            placeholder="09:00"
                                            defaultValue={day === 'Sunday' ? 'Closed' : '09:00'}
                                            className="flex-1"
                                        />
                                        <span className="text-secondary-600">to</span>
                                        <Input
                                            placeholder="18:00"
                                            defaultValue={day === 'Sunday' ? 'Closed' : '18:00'}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button variant="primary" onClick={handleSaveGeneral} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Email Notifications</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'New prescription orders', description: 'Get notified when new prescriptions are submitted' },
                                { label: 'Low stock alerts', description: 'Receive alerts when inventory is running low' },
                                { label: 'Refill requests', description: 'Get notified about prescription refill requests' },
                                { label: 'Customer messages', description: 'Receive notifications for customer inquiries' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start justify-between py-3 border-b border-secondary-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-secondary-900">{item.label}</p>
                                        <p className="text-sm text-secondary-600 mt-1">{item.description}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={item.label === 'New prescription orders' ? notifications.emailPrescriptions : item.label === 'Low stock alerts' ? notifications.emailLowStock : item.label === 'Refill requests' ? notifications.emailRefills : notifications.emailMessages} onChange={() => handleNotificationToggle(item.label === 'New prescription orders' ? 'emailPrescriptions' : item.label === 'Low stock alerts' ? 'emailLowStock' : item.label === 'Refill requests' ? 'emailRefills' : 'emailMessages')} />
                                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">SMS Notifications</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Urgent orders', description: 'Get SMS alerts for urgent prescription orders' },
                                { label: 'Critical stock levels', description: 'Receive SMS when stock reaches critical levels' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start justify-between py-3 border-b border-secondary-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-secondary-900">{item.label}</p>
                                        <p className="text-sm text-secondary-600 mt-1">{item.description}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={item.label === 'Urgent orders' ? notifications.smsUrgent : notifications.smsCritical} onChange={() => handleNotificationToggle(item.label === 'Urgent orders' ? 'smsUrgent' : 'smsCritical')} />
                                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button variant="primary" onClick={handleSaveNotifications} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Preferences'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Change Password</h2>
                        <div className="space-y-4 max-w-md">
                            <Input
                                label="Current Password"
                                type="password"
                                placeholder="Enter current password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                leftIcon={<Lock className="w-5 h-5" />}
                            />
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                leftIcon={<Lock className="w-5 h-5" />}
                            />
                            <Input
                                label="Confirm New Password"
                                type="password"
                                placeholder="Confirm new password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                leftIcon={<Lock className="w-5 h-5" />}
                            />
                            <Button variant="primary" onClick={handleUpdatePassword} disabled={isSaving}>
                                {isSaving ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Two-Factor Authentication</h2>
                        <p className="text-secondary-600 mb-4">
                            Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <Button variant={is2FAEnabled ? 'danger' : 'secondary'} onClick={handleToggle2FA} disabled={isSaving}>
                            {isSaving ? 'Processing...' : (is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA')}
                        </Button>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Active Sessions</h2>
                        <div className="space-y-3">
                            {[
                                { device: 'Windows PC - Chrome', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
                                { device: 'iPhone 14 - Safari', location: 'New York, USA', lastActive: '2 hours ago', current: false },
                            ].map((session, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-secondary-900">
                                            {session.device}
                                            {session.current && (
                                                <span className="ml-2 text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-secondary-600 mt-1">
                                            {session.location} • Last active {session.lastActive}
                                        </p>
                                    </div>
                                    {!session.current && (
                                        <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.device)}>
                                            Revoke
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && (
                <div className="space-y-6">
                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Subscription Plan</h2>
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-primary-900">Professional Plan</h3>
                                    <p className="text-primary-700 mt-1">৳99/month • Billed annually</p>
                                </div>
                                <Button variant="primary" onClick={handleUpgradePlan}>Upgrade Plan</Button>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Payment Method</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
                                        VISA
                                    </div>
                                    <div>
                                        <p className="font-medium text-secondary-900">•••• •••• •••• 4242</p>
                                        <p className="text-sm text-secondary-600">Expires 12/2025</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleUpdatePayment}>
                                    Update
                                </Button>
                            </div>
                            <Button variant="secondary" onClick={handleAddPayment}>Add Payment Method</Button>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Billing History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-secondary-200">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">
                                            Date
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">
                                            Description
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">
                                            Amount
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-600 uppercase">
                                            Invoice
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {[
                                        { date: 'Jan 1, 2024', description: 'Professional Plan', amount: '৳99.00', status: 'Paid' },
                                        { date: 'Dec 1, 2023', description: 'Professional Plan', amount: '৳99.00', status: 'Paid' },
                                        { date: 'Nov 1, 2023', description: 'Professional Plan', amount: '৳99.00', status: 'Paid' },
                                    ].map((invoice, index) => (
                                        <tr key={index} className="hover:bg-secondary-50">
                                            <td className="py-3 px-4 text-sm text-secondary-900">{invoice.date}</td>
                                            <td className="py-3 px-4 text-sm text-secondary-900">{invoice.description}</td>
                                            <td className="py-3 px-4 text-sm text-secondary-900">{invoice.amount}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice.date)}>
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
