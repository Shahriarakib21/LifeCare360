import { useState, useEffect } from 'react';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

export const usePatient = () => {
  const [profile, setProfile] = useState<any>(null);
  const [ehrRecords, setEhrRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/patients/profile');
      setProfile(response.data.data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchEHR = async (filters?: { type?: string; startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/patients/ehr?${params.toString()}`);
      setEhrRecords(response.data.data.records);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const uploadReport = async (file: File, metadata?: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        Object.keys(metadata).forEach((key) => {
          formData.append(key, metadata[key]);
        });
      }

      const response = await api.post('/api/patients/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Report uploaded successfully');
      return response.data.data;
    } catch (error) {
      toast.error(handleApiError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    ehrRecords,
    loading,
    fetchProfile,
    fetchEHR,
    uploadReport,
  };
};

