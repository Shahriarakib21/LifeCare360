'use client';

import React, { useState, useEffect } from 'react';
import { Save, Shield, Settings, Bell, Mail, Lock, Info } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>({
        maintenanceMode: false,
        allowRegistration: true,
        contactEmail: '',
        systemAnnouncement: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/admin/settings');
                if (response.data.data) {
                    setSettings(response.data.data);
                }
            } catch (error) {
                toast.error(handleApiError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/api/admin/settings', settings);
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">System Settings</h1>
                    <p className="text-secondary-500">Configure global application parameters and maintenance mode</p>
                </div>
                <Button
                    onClick={handleSave}
                    isLoading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                >
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Navigation (Internal Page Anchors) */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'general'
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-secondary-50 text-secondary-600'
                            }`}
                    >
                        <Settings className="w-4 h-4" /> General
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'security'
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-secondary-50 text-secondary-600'
                            }`}
                    >
                        <Shield className="w-4 h-4" /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'notifications'
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-secondary-50 text-secondary-600'
                            }`}
                    >
                        <Bell className="w-4 h-4" /> Notifications
                    </button>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <>
                            <Card title="General Configuration">
                                <form className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                                        <div>
                                            <p className="font-semibold text-secondary-900">Maintenance Mode</p>
                                            <p className="text-sm text-secondary-500">Disable customer access while performing updates</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                                        <div>
                                            <p className="font-semibold text-secondary-900">User Registration</p>
                                            <p className="text-sm text-secondary-500">Allow new patients and doctors to sign up</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.allowRegistration}
                                                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-secondary-700">Support Contact Email</label>
                                        <Input
                                            type="email"
                                            value={settings.contactEmail}
                                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                            placeholder="admin@healthcare.com"
                                        />
                                        <p className="text-xs text-secondary-500">Email shown to users during maintenance or errors</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-secondary-700">System Announcement</label>
                                        <textarea
                                            className="w-full px-4 py-2 bg-white border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none min-h-[100px]"
                                            value={settings.systemAnnouncement}
                                            onChange={(e) => setSettings({ ...settings, systemAnnouncement: e.target.value })}
                                            placeholder="Enter a message to display at the top of all user dashboards..."
                                        />
                                        <p className="text-xs text-secondary-500">Leave blank to disable announcement banner</p>
                                    </div>
                                </form>
                            </Card>

                            <Card title="Administrative Information">
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between py-2 border-b border-secondary-50">
                                        <span className="text-secondary-500 font-medium flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Admin Access
                                        </span>
                                        <span className="text-green-600 font-bold uppercase">Restricted</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-secondary-50">
                                        <span className="text-secondary-500 font-medium">Last Updated</span>
                                        <span className="text-secondary-900">{settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-secondary-500 font-medium">Environment</span>
                                        <span className="text-secondary-900 font-mono">Production</span>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <Card title="Security Configuration">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                                    <div>
                                        <p className="font-semibold text-secondary-900">Two-Factor Authentication (2FA)</p>
                                        <p className="text-sm text-secondary-500">Enforce 2FA for all admin accounts</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" disabled />
                                        <div className="w-11 h-6 bg-secondary-200 rounded-full peer"></div>
                                    </label>
                                </div>
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 text-sm">
                                    Global security policies are currently managed via environment variables.
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <Card title="Notification Preferences">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                                    <div>
                                        <p className="font-semibold text-secondary-900">Email Alerts</p>
                                        <p className="text-sm text-secondary-500">Receive emails for system errors</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked readOnly />
                                        <div className="w-11 h-6 bg-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
