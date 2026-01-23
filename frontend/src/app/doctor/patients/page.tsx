'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, User, Mail, Phone, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/doctors/patients?limit=100');
      setPatients(response.data.data.patients || []);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patient: Patient) => {
    if (patient.user?.profile) {
      return `${patient.user.profile.firstName} ${patient.user.profile.lastName}`.trim();
    }
    return patient.user?.email || 'Unknown Patient';
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const name = getPatientName(patient).toLowerCase();
    const email = (patient.user?.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">Patients</h1>
              <p className="text-secondary-600">View and manage your patients</p>
            </div>
          </div>

          {/* Search */}
          <Card padding="lg" className="mb-6">
            <Input
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </Card>

          {/* Patients List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading patients..." />
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <Card key={patient._id} hover padding="lg">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 truncate">
                        {getPatientName(patient)}
                      </h3>
                      <div className="flex items-center text-sm text-secondary-600 mt-1">
                        <Mail className="w-4 h-4 mr-1" />
                        <span className="truncate">{patient.user?.email}</span>
                      </div>
                      {patient.user?.profile?.phone && (
                        <div className="flex items-center text-sm text-secondary-600 mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>{patient.user.profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4 border-t border-secondary-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => router.push(`/doctor/patients/${patient._id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="text-center py-12">
              <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">
                {searchQuery ? 'No patients found matching your search' : 'No patients found'}
              </p>
            </Card>
          )}
        </div>
    </div>
  );
}

