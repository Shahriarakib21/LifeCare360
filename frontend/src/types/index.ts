// Frontend type definitions

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'hospital' | 'insurance';
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
  };
}

export interface Patient {
  id: string;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  insurance?: {
    provider: string;
    policyNumber: string;
  };
  preferences: {
    diet: {
      type: 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'none';
      restrictions?: string[];
    };
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  consentSettings: {
    shareWithDoctors: boolean;
    shareWithLabs: boolean;
    shareWithPharmacies: boolean;
    shareWithInsurance: boolean;
    shareWithHospitals: boolean;
  };
}

export interface EHRRecord {
  id: string;
  type: 'vital' | 'lab' | 'diagnosis' | 'prescription' | 'procedure' | 'vaccination' | 'allergy' | 'note';
  date: string;
  data: any;
  recordedBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  location: string;
  fee: number;
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  price: number;
  category: string;
  isPrescriptionRequired: boolean;
}

export interface Appointment {
  id: number;
  patientId: string;
  doctorId: number;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
}

