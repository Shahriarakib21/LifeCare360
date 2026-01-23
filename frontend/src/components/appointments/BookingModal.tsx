'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, X, Phone } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface Doctor {
  id: string;
  specialization: string;
  consultationFee: number;
  profileImage?: string;
  address?: { city?: string; state?: string };
  hospital?: string;
  clinic?: string;
  availability?: {
    days?: string[];
    hours?: { start?: string; end?: string };
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onSuccess?: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, doctor, onSuccess }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ date: '', time: '', type: 'in-person' as 'in-person' | 'video' });

  const isPatient = user?.role === 'patient';

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    const start = doctor?.availability?.hours?.start || '09:00';
    const end = doctor?.availability?.hours?.end || '17:00';
    let [h, m] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    while (h < eh || (h === eh && m < em)) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { h++; m = 0; }
    }
    return slots;
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please login first');
    if (!isPatient) return toast.error('Only patients can book');
    if (!formData.date || !formData.time) return toast.error('Selection required');

    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/api/patients/appointments', {
        doctorId: doctor?.id,
        date: formData.date,
        time: formData.time,
        type: formData.type,
      });
      toast.success('Booked!');
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center font-bold">
            {doctor.specialization.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold">{doctor.specialization}</h3>
            <p className="text-sm text-secondary-500">Fee: ৳{doctor.consultationFee}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <input type="date" className="w-full p-2 border rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Time</label>
          <select className="w-full p-2 border rounded" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required>
            <option value="">Choose slot</option>
            {timeSlots.map(s => <option key={s} value={s}>{formatTime12Hour(s)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setFormData({ ...formData, type: 'in-person' })} className={`p-2 border rounded ${formData.type === 'in-person' ? 'bg-primary-50 border-primary-500' : ''}`}>In-Person</button>
          <button type="button" onClick={() => setFormData({ ...formData, type: 'video' })} className={`p-2 border rounded ${formData.type === 'video' ? 'bg-primary-50 border-primary-500' : ''}`}>Video</button>
        </div>

        <Button type="submit" fullWidth isLoading={loading}>Confirm Booking</Button>
      </form>
    </Modal>
  );
};

export default BookingModal;
