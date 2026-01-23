'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone } from 'lucide-react';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';

interface Patient {
  _id: string;
  userId: string;
  user?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  };
}

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId?: string;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onSelectPatient, selectedPatientId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    searchPatients();
  }, [searchQuery]);

  const searchPatients = async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/doctors/patients?search=${encodeURIComponent(searchQuery)}`
        : `/api/doctors/patients`;
      const response = await api.get(url);
      setPatients(response.data.data.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onSelectPatient(patient);
    setSearchQuery('');
    setPatients([]);
  };

  const getPatientName = (patient: Patient) => {
    if (patient.user?.profile) {
      return `${patient.user.profile.firstName} ${patient.user.profile.lastName}`.trim();
    }
    return patient.user?.email || 'Unknown Patient';
  };

  return (
    <div className="relative">
      <Input
        placeholder="Search patients by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {selectedPatient && (
        <Card className="mt-4 p-4 bg-primary-50 border-primary-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-secondary-900">{getPatientName(selectedPatient)}</p>
              <p className="text-sm text-secondary-600">{selectedPatient.user?.email}</p>
            </div>
            <button
              onClick={() => {
                setSelectedPatient(null);
                onSelectPatient(null as any);
              }}
              className="text-secondary-400 hover:text-secondary-600"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {!selectedPatient && isFocused && (searchQuery.length > 0 || patients.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-secondary-200 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : patients.length > 0 ? (
            <div className="py-2">
              {patients.map((patient) => (
                <button
                  key={patient._id}
                  onClick={() => handleSelect(patient)}
                  className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">
                        {getPatientName(patient)}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{patient.user?.email}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-secondary-600">
              No patients found
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isFocused && !selectedPatient && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsFocused(false)}
        />
      )}
    </div>
  );
};

export default PatientSearch;

