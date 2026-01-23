import mongoose, { Schema, Document } from 'mongoose';

export interface IEHR extends Document {
  patientId: mongoose.Types.ObjectId;
  type: 'vital' | 'lab' | 'diagnosis' | 'prescription' | 'procedure' | 'vaccination' | 'allergy' | 'note' | 'lab-test-request';
  date: Date;
  recordedBy?: mongoose.Types.ObjectId; // Doctor/Lab ID
  data: {
    // Vital signs
    vitals?: {
      bloodPressure?: { systolic: number; diastolic: number };
      heartRate?: number;
      temperature?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
    };
    // Lab results
    labResults?: {
      testName: string;
      value: number;
      unit: string;
      normalRange: { min: number; max: number };
      status: 'normal' | 'low' | 'high' | 'critical';
    }[];
    // Diagnosis
    diagnosis?: {
      condition: string;
      icd10Code?: string;
      severity: 'mild' | 'moderate' | 'severe';
      notes?: string;
    };
    // Prescription
    prescription?: {
      // Old format (single medication)
      medication?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      // New format (multiple medications)
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
      diagnosis?: string;
      notes?: string;
      followUpDate?: string;
      pdfUrl?: string;
    };
    // Lab test request
    labTestRequest?: {
      tests: Array<string | { name: string }>;
      notes?: string;
      urgency?: 'routine' | 'urgent' | 'stat' | 'emergency';
      status?: 'pending' | 'completed' | 'REQUESTED' | 'ASSIGNED' | 'PAID' | 'FAILED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'REPORT_UPLOADED';
      requestedAt?: Date;
      completedAt?: Date;
      resultId?: mongoose.Types.ObjectId;
      labId?: mongoose.Types.ObjectId;
      assignedAt?: Date;
      assignedBy?: mongoose.Types.ObjectId;
      paymentId?: mongoose.Types.ObjectId;
      paidAt?: Date;
    };
    // General notes
    notes?: string;
    // Attachments
    attachments?: Array<{
      type: 'image' | 'pdf' | 'document' | 'csv' | 'excel' | 'file';
      url: string;
      name: string;
      uploadedAt: Date;
    }>;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EHRSchema: Schema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['vital', 'lab', 'diagnosis', 'prescription', 'procedure', 'vaccination', 'allergy', 'note', 'lab-test-request'],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    data: {
      vitals: {
        bloodPressure: {
          systolic: Number,
          diastolic: Number,
        },
        heartRate: Number,
        temperature: Number,
        oxygenSaturation: Number,
        weight: Number,
        height: Number,
        bmi: Number,
      },
      labResults: [
        {
          testName: { type: String, required: true },
          value: { type: Number, required: true },
          unit: { type: String, required: true },
          normalRange: {
            min: { type: Number, required: true },
            max: { type: Number, required: true },
          },
          status: {
            type: String,
            enum: ['normal', 'low', 'high', 'critical'],
            default: 'normal',
          },
        },
      ],
      diagnosis: {
        condition: String,
        icd10Code: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        notes: String,
      },
      prescription: {
        // Support both old format (single medication) and new format (multiple medications)
        medication: String, // Old format
        dosage: String, // Old format
        frequency: String, // Old format
        duration: String, // Old format
        instructions: String, // Old format
        // New format - multiple medications
        medications: [{
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        }],
        diagnosis: String,
        notes: String,
        followUpDate: String,
        pdfUrl: String,
      },
      labTestRequest: {
        tests: [Schema.Types.Mixed], // Can be array of strings or objects
        notes: String,
        urgency: {
          type: String,
          enum: ['routine', 'urgent', 'stat', 'emergency'],
          default: 'routine',
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'REQUESTED', 'ASSIGNED', 'PAID', 'FAILED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'REPORT_UPLOADED'],
          default: 'pending',
        },
        requestedAt: { type: Date, default: Date.now },
        completedAt: Date,
        resultId: Schema.Types.ObjectId,
        labId: {
          type: Schema.Types.ObjectId,
          ref: 'User', // Lab user
        },
        assignedAt: Date,
        assignedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User', // Patient or Doctor who assigned
        },
        paymentId: {
          type: Schema.Types.ObjectId,
          ref: 'Payment',
        },
        paidAt: Date,
      },
      notes: String,
      attachments: [
        {
          type: {
            type: String,
            enum: ['image', 'pdf', 'document', 'csv', 'excel', 'file'],
          },
          url: { type: String, required: true },
          name: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EHRSchema.index({ patientId: 1, date: -1 });
EHRSchema.index({ patientId: 1, type: 1 });
EHRSchema.index({ 'data.labResults.testName': 1 });
EHRSchema.index({ 'data.labTestRequest.labId': 1, 'data.labTestRequest.status': 1 });
EHRSchema.index({ 'data.labTestRequest.status': 1 });

export default mongoose.model<IEHR>('EHR', EHRSchema);

