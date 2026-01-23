import mongoose, { Schema, Document } from 'mongoose';

export interface IRevenueTransaction extends Document {
    type: 'doctor' | 'lab' | 'pharmacy';
    amount: number;
    currency: string;
    patientUserId: mongoose.Types.ObjectId;
    providerUserId: mongoose.Types.ObjectId;
    serviceId: string; // Appointment ID (Postgres), EHR ID (Mongo), or Order ID (Postgres)
    transactionId: string;
    paymentMethod: string;
    status: 'completed' | 'refunded';
    date: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const RevenueTransactionSchema = new Schema<IRevenueTransaction>(
    {
        type: {
            type: String,
            enum: ['doctor', 'lab', 'pharmacy'],
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'BDT',
            uppercase: true,
        },
        patientUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        providerUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        serviceId: {
            type: String,
            required: true,
            index: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['completed', 'refunded'],
            default: 'completed',
            index: true,
        },
        date: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient reporting
RevenueTransactionSchema.index({ date: -1, type: 1 });
RevenueTransactionSchema.index({ providerUserId: 1, date: -1 });

export default mongoose.models.RevenueTransaction || mongoose.model<IRevenueTransaction>('RevenueTransaction', RevenueTransactionSchema);
