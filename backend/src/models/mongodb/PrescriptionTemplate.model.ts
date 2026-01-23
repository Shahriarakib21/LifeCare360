import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescriptionTemplate extends Document {
    doctorId: string; // MongoDB User ID of the doctor
    name: string; // Template name (e.g., 'Common Cold', 'Hypertension Basic')
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;
    diagnosis?: string;
    notes?: string;
    isPublic: boolean; // Whether other doctors can see/use this template
    createdAt: Date;
    updatedAt: Date;
}

const PrescriptionTemplateSchema: Schema = new Schema(
    {
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        medications: [
            {
                name: { type: String, required: true },
                dosage: { type: String, required: true },
                frequency: { type: String, required: true },
                duration: { type: String, required: true },
                instructions: { type: String },
            },
        ],
        diagnosis: {
            type: String,
        },
        notes: {
            type: String,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster searching
PrescriptionTemplateSchema.index({ doctorId: 1, name: 1 });

export default mongoose.model<IPrescriptionTemplate>('PrescriptionTemplate', PrescriptionTemplateSchema);
