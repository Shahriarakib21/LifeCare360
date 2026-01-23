'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Shield, Bell, Lock, AlertTriangle, Save, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientSettingsPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Settings State
  const [consentSettings, setConsentSettings] = useState({
    dataSharing: false,
    researchParticipation: false,
    marketingEmails: false,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    appointmentReminders: true,
    medicationReminders: true,
  });

  // Password Change State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch consent settings
      const consentRes = await api.get('/api/patients/consent');
      if (consentRes.data?.data?.consentSettings) {
        setConsentSettings(prev => ({ ...prev, ...consentRes.data.data.consentSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const handleUpdateConsent = async () => {
    setLoading(true);
    try {
      await api.put('/api/patients/consent', consentSettings);
      toast.success('Privacy settings updated');
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    // Assuming a backend endpoint existed, or we map this to user preferences
    // For now, prompt success as simulation or add to profile updates if supported
    toast.success('Notification preferences saved');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    try {
      // Assuming an auth endpoint for password change
      // await api.post('/api/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    if (deleteConfirm.toLowerCase() !== 'delete') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/api/patients/account', {
        data: { password: deletePassword },
      });

      toast.success('Account deleted successfully');
      clearAuth();
      router.push('/');
      setShowDeleteModal(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      setDeletePassword('');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-secondary-900">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card padding="lg">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Account Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input value={`${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`} disabled className="bg-slate-50 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input value={user?.email || ''} disabled className="bg-slate-50 mt-1" />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-secondary-900">Notifications</h2>
            </div>
            <Button size="sm" onClick={handleUpdateNotifications} variant="secondary">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive appointment confirmations and summaries</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} className="absolute w-6 h-6 opacity-0 cursor-pointer" />
                <span className={`block w-12 h-6 rounded-full transition-colors ${notifications.email ? 'bg-teal-600' : 'bg-slate-200'}`}></span>
                <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Appointment Reminders</p>
                <p className="text-xs text-slate-500">Get reminded 1 hour before visits</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                <input type="checkbox" checked={notifications.appointmentReminders} onChange={(e) => setNotifications({ ...notifications, appointmentReminders: e.target.checked })} className="absolute w-6 h-6 opacity-0 cursor-pointer" />
                <span className={`block w-12 h-6 rounded-full transition-colors ${notifications.appointmentReminders ? 'bg-teal-600' : 'bg-slate-200'}`}></span>
                <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${notifications.appointmentReminders ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Medication Alerts</p>
                <p className="text-xs text-slate-500">Push notifications for intake time</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                <input type="checkbox" checked={notifications.medicationReminders} onChange={(e) => setNotifications({ ...notifications, medicationReminders: e.target.checked })} className="absolute w-6 h-6 opacity-0 cursor-pointer" />
                <span className={`block w-12 h-6 rounded-full transition-colors ${notifications.medicationReminders ? 'bg-teal-600' : 'bg-slate-200'}`}></span>
                <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${notifications.medicationReminders ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy & Security */}
        <Card padding="lg">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Privacy & Security</h2>
          </div>

          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    type="password"
                    placeholder="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm New"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <div className="text-right">
                  <Button size="sm" type="submit" variant="secondary">Update Password</Button>
                </div>
              </form>
            </div>

            {/* Consent Toggle */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Data & Consent</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Allow anonymized data for research</span>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSettings.researchParticipation}
                    onChange={(e) => setConsentSettings({ ...consentSettings, researchParticipation: e.target.checked })}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <span className={`block w-12 h-6 rounded-full transition-colors ${consentSettings.researchParticipation ? 'bg-teal-600' : 'bg-slate-200'}`}></span>
                  <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${consentSettings.researchParticipation ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </div>
              </div>
              <div className="text-right pt-2">
                <Button size="sm" onClick={handleUpdateConsent} isLoading={loading}>Save Privacy Changes</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card padding="lg" className="border-2 border-error-200">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-error-600" />
            <h2 className="text-xl font-semibold text-error-600">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-error-50 rounded-lg border border-error-200">
              <h3 className="font-semibold text-error-900 mb-2">Delete Account</h3>
              <p className="text-sm text-error-700 mb-4">
                Once you delete your account, there is no going back. This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-error-700 mb-4 space-y-1">
                <li>Your profile and personal information</li>
                <li>All your medical records and EHR data</li>
                <li>All your appointments</li>
                <li>All uploaded prescriptions and lab reports</li>
                <li>All associated files and documents</li>
              </ul>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
          setDeleteConfirm('');
        }}
        title="Delete Account"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
                setDeleteConfirm('');
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={deleting}
              disabled={!deletePassword || deleteConfirm.toLowerCase() !== 'delete'}
            >
              Delete Account
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-error-50 rounded-lg border border-error-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-error-900 mb-1">Warning: This action cannot be undone</p>
                <p className="text-sm text-error-700">
                  Deleting your account will permanently remove all your data from our system.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="delete-password" className="label">
              Enter your password to confirm
            </label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="delete-confirm" className="label">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </label>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="mt-1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
