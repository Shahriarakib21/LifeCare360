'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Shield, Bell } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { usePatient } from '@/hooks/usePatient';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function PatientProfilePage() {
  const { profile, loading, fetchProfile } = usePatient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  React.useEffect(() => {
    if (profile?.user?.profile) {
      setFormData({
        firstName: profile.user.profile.firstName || '',
        lastName: profile.user.profile.lastName || '',
        email: profile.user.email || '',
        phone: profile.user.profile.phone || '',
        dateOfBirth: profile.user.profile.dateOfBirth || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await api.put('/api/patients/profile', {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
        },
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">Personal Information</h2>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  disabled
                  leftIcon={<Mail className="w-5 h-5" />}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  leftIcon={<Calendar className="w-5 h-5" />}
                />
                <div className="flex space-x-4">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-secondary-900">
                      {profile?.user?.profile?.firstName} {profile?.user?.profile?.lastName}
                    </h3>
                    <p className="text-secondary-600">{profile?.user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-secondary-600 mb-1">Phone</p>
                    <p className="font-medium">{profile?.user?.profile?.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 mb-1">Date of Birth</p>
                    <p className="font-medium">
                      {profile?.user?.profile?.dateOfBirth
                        ? new Date(profile.user.profile.dateOfBirth).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Emergency Contacts */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Emergency Contacts</h2>
            <div className="space-y-4">
              {profile?.patient?.emergencyContacts?.length > 0 ? (
                profile.patient.emergencyContacts.map((contact: any, index: number) => (
                  <div key={index} className="p-4 bg-secondary-50 rounded-xl">
                    <p className="font-medium text-secondary-900">{contact.name}</p>
                    <p className="text-sm text-secondary-600">{contact.relationship}</p>
                    <p className="text-sm text-secondary-600">{contact.phone}</p>
                  </div>
                ))
              ) : (
                <p className="text-secondary-600">No emergency contacts added</p>
              )}
              <Button variant="ghost" size="sm">Add Emergency Contact</Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Consent Settings */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Data Sharing
            </h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-secondary-700">Share with Doctors</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-secondary-700">Share with Labs</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-secondary-700">Share with Pharmacies</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-secondary-700">Share with Insurance</span>
              </label>
            </div>
          </Card>

          {/* Notifications */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-secondary-700">Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-secondary-700">SMS Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-secondary-700">Push Notifications</span>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

