'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Clock, Calendar, Save, Upload, User, X, Bell } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export default function DoctorSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [timezone, setTimezone] = useState('America/New_York');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consultationFee, setConsultationFee] = useState<number>(1000.00);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
    appointmentReminders: true,
    newPatientAlerts: true,
    labResultAlerts: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/doctors/profile');
      const doctor = response.data.data.doctor;

      if (doctor?.profileImage) setProfileImage(doctor.profileImage);
      if (doctor?.consultationFee) setConsultationFee(Number(doctor.consultationFee));

      if (doctor?.notificationSettings) {
        setNotificationSettings({
          email: doctor.notificationSettings.email ?? true,
          sms: doctor.notificationSettings.sms ?? false,
          push: doctor.notificationSettings.push ?? true,
          appointmentReminders: doctor.notificationSettings.appointmentReminders ?? true,
          newPatientAlerts: doctor.notificationSettings.newPatientAlerts ?? true,
          labResultAlerts: doctor.notificationSettings.labResultAlerts ?? true,
        });
      }

      if (doctor?.availability) {
        setTimezone(doctor.availability.timezone || 'America/New_York');
        const initialAvailability: Record<string, DayAvailability> = {};
        DAYS_OF_WEEK.forEach((day) => {
          const isEnabled = doctor.availability.days?.includes(day.value) || false;
          initialAvailability[day.value] = {
            enabled: isEnabled,
            slots: isEnabled && doctor.availability.hours
              ? [{ start: doctor.availability.hours.start, end: doctor.availability.hours.end }]
              : [{ start: '09:00', end: '17:00' }],
          };
        });
        setAvailability(initialAvailability);
      } else {
        const defaultAvailability: Record<string, DayAvailability> = {};
        DAYS_OF_WEEK.forEach((day) => {
          const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.value);
          defaultAvailability[day.value] = {
            enabled: isWeekday,
            slots: [{ start: '09:00', end: '17:00' }],
          };
        });
        setAvailability(defaultAvailability);
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateSlot = (day: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      const updatedSlots = [...prev[day].slots];
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value };
      return { ...prev, [day]: { ...prev[day], slots: updatedSlots } };
    });
  };

  const addSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { start: '09:00', end: '17:00' }] },
    }));
  };

  const removeSlot = (day: string, slotIndex: number) => {
    setAvailability(prev => {
      if (prev[day].slots.length <= 1) return prev;
      return {
        ...prev,
        [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== slotIndex) },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const enabledDays = Object.entries(availability)
        .filter(([_, dayAvail]) => dayAvail.enabled)
        .map(([day, _]) => day);

      const firstEnabledDay = enabledDays[0];
      const mainHours = firstEnabledDay && availability[firstEnabledDay]?.slots[0]
        ? availability[firstEnabledDay].slots[0]
        : { start: '09:00', end: '17:00' };

      await api.put('/api/doctors/profile', {
        availability: {
          days: enabledDays,
          hours: mainHours,
          timezone,
          slots: availability,
        },
        consultationFee,
        notificationSettings,
      });

      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-secondary-900">Settings</h1>
        </div>

        {/* Profile Image */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Profile Image</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {imagePreview || profileImage ? (
                <div className="relative">
                  <img
                    src={imagePreview || (profileImage?.startsWith('http') ? profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${profileImage}`)}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                  />
                  <button
                    onClick={() => { setImagePreview(null); setProfileImage(null); }}
                    className="absolute top-0 right-0 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-secondary-200 flex items-center justify-center border-4 border-secondary-300">
                  <User className="w-16 h-16 text-secondary-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) return toast.error('Max size 5MB');

                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);

                  setUploadingImage(true);
                  try {
                    const formData = new FormData();
                    formData.append('profileImage', file);
                    const res = await api.put('/api/doctors/profile', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (res.data.data?.doctor?.profileImage) {
                      setProfileImage(res.data.data.doctor.profileImage);
                      setImagePreview(null);
                      toast.success('Uploaded!');
                    }
                  } catch (err) {
                    toast.error(handleApiError(err));
                    setImagePreview(null);
                  } finally {
                    setUploadingImage(false);
                  }
                }}
                className="hidden"
                id="profile-image-upload"
              />
              <Button type="button" variant="secondary" onClick={() => document.getElementById('profile-image-upload')?.click()} disabled={uploadingImage}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Change Image'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Fee */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center"><Settings className="w-6 h-6 text-primary-600 mr-3" />Consultation Fee</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-600">৳</span>
            <Input
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value) || 0)}
              className="pl-8"
              placeholder="1000.00"
            />
          </div>
        </Card>

        {/* Availability */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center"><Clock className="w-6 h-6 text-primary-600 mr-3" />Availability</h2>
          <div className="space-y-6">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="Asia/Dhaka">Bangladesh Time (BST)</option>
              <option value="UTC">UTC</option>
            </select>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className={`p-4 rounded-xl border-2 ${availability[day.value]?.enabled ? 'border-primary-200 bg-primary-50' : 'border-secondary-200 bg-secondary-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" checked={availability[day.value]?.enabled} onChange={() => toggleDay(day.value)} className="w-5 h-5 text-primary-600" />
                      <span className="font-semibold">{day.label}</span>
                    </div>
                  </div>
                  {availability[day.value]?.enabled && (
                    <div className="space-y-3">
                      {availability[day.value].slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Input type="time" value={slot.start} onChange={(e) => updateSlot(day.value, idx, 'start', e.target.value)} />
                          <span>to</span>
                          <Input type="time" value={slot.end} onChange={(e) => updateSlot(day.value, idx, 'end', e.target.value)} />
                          {availability[day.value].slots.length > 1 && (
                            <button onClick={() => removeSlot(day.value, idx)} className="text-error-600">×</button>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addSlot(day.value)}>+ Add Slot</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} isLoading={saving} fullWidth className="mt-6"><Save className="w-5 h-5 mr-2" />Save Settings</Button>
        </Card>

        {/* Notifications */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center"><Bell className="w-6 h-6 text-primary-600 mr-3" />Notifications</h2>
          <div className="space-y-3">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg cursor-pointer">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input type="checkbox" checked={value} onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })} className="w-5 h-5 text-primary-600" />
              </label>
            ))}
          </div>
          <Button onClick={handleSave} isLoading={saving} fullWidth className="mt-6"><Save className="w-5 h-5 mr-2" />Save Notifications</Button>
        </Card>
      </div>
    </div>
  );
}
