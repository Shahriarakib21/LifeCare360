import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    expiryDate?: Date;
  };
  preferences: {
    diet: {
      type: 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'none';
      restrictions?: string[];
    };
    language: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
      },
    ],
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      expiryDate: Date,
    },
    preferences: {
      diet: {
        type: {
          type: String,
          enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'none'],
          default: 'none',
        },
        restrictions: [String],
      },
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    consentSettings: {
      shareWithDoctors: { type: Boolean, default: true },
      shareWithLabs: { type: Boolean, default: true },
      shareWithPharmacies: { type: Boolean, default: false },
      shareWithInsurance: { type: Boolean, default: false },
      shareWithHospitals: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

PatientSchema.index({ userId: 1 });

export default mongoose.model<IPatient>('Patient', PatientSchema);

