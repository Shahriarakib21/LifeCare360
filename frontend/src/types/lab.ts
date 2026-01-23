export interface LabRequest {
  id: string;
  requestId: string;
  patientName: string;
  patientId: string;
  tests: string[];
  requestedBy: string;
  doctorId?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'assigned' | 'requested';
  requestedAt: string;
  urgency: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
}

export interface LabTestPrice {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  active: boolean;
  lastUpdated: string;
}
