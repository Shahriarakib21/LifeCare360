import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    patientId: mongoose.Types.ObjectId;
    labId: mongoose.Types.ObjectId;
    labTestRequestId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: 'cash' | 'card' | 'mobile_banking' | 'online';
    transactionId: string;
    testBreakdown: Array<{
        testName: string;
        testCode?: string;
        price: number;
    }>;
    paymentDate: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        labId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        labTestRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'EHR',
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
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'mobile_banking', 'online'],
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        testBreakdown: [
            {
                testName: { type: String, required: true },
                testCode: { type: String },
                price: { type: Number, required: true, min: 0 },
            },
        ],
        paymentDate: {
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

// Indexes for efficient queries
PaymentSchema.index({ labId: 1, paymentDate: -1 });
PaymentSchema.index({ patientId: 1, paymentDate: -1 });
PaymentSchema.index({ status: 1, paymentDate: -1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
