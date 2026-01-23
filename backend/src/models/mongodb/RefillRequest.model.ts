import mongoose, { Schema, Document } from 'mongoose';

export interface IRefillRequest extends Document {
    patientId: mongoose.Types.ObjectId;
    prescriptionId: mongoose.Types.ObjectId; // Reference to EHR prescription
    medication: string;
    requestDate: Date;
    lastFillDate?: Date;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    quantity: number;
    refillsRemaining: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RefillRequestSchema: Schema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient', // Or User, depending on how patientId is handled
            required: true,
            index: true,
        },
        prescriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'EHR',
            required: true,
        },
        medication: {
            type: String,
            required: true,
        },
        requestDate: {
            type: Date,
            default: Date.now,
        },
        lastFillDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'completed', 'rejected'],
            default: 'pending',
            index: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        refillsRemaining: {
            type: Number,
            default: 0,
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IRefillRequest>('RefillRequest', RefillRequestSchema);
