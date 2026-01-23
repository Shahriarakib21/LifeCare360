import mongoose, { Schema, Document } from 'mongoose';

export interface IUnifiedPayment extends Document {
    invoiceId: string; // Unique invoice ID (e.g., INV-DOC-20260124-001)
    serviceType: 'doctor' | 'lab' | 'pharmacy';
    serviceId: any; // Reference to Appointment (number) / LabRequest (ObjectId) / PharmacyOrder (number)
    patientId: mongoose.Types.ObjectId;
    providerId?: mongoose.Types.ObjectId; // Doctor/Lab/Pharmacy user ID

    // Amount breakdown
    baseAmount: number;
    vatAmount: number;
    serviceCharge: number;
    totalAmount: number;

    // Payment details
    paymentMethod: 'bkash' | 'nagad' | null;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
    transactionId?: string;
    gatewayResponse?: Record<string, any>;

    // Timestamps
    paidAt?: Date;
    expiresAt: Date;

    // Item breakdown for display
    itemBreakdown: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;

    // Service-specific metadata
    metadata?: {
        doctorName?: string;
        appointmentDate?: Date;
        labName?: string;
        testNames?: string[];
        pharmacyName?: string;
        orderItems?: any[];
    };

    createdAt: Date;
    updatedAt: Date;
}

const UnifiedPaymentSchema = new Schema<IUnifiedPayment>(
    {
        invoiceId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        serviceType: {
            type: String,
            enum: ['doctor', 'lab', 'pharmacy'],
            required: true,
            index: true,
        },
        serviceId: {
            type: Schema.Types.Mixed,
            required: true,
            index: true,
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        baseAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        vatAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        serviceCharge: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['bkash', 'nagad', null],
            default: null,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'expired'],
            default: 'pending',
            index: true,
        },
        transactionId: {
            type: String,
            sparse: true,
            index: true,
        },
        gatewayResponse: {
            type: Schema.Types.Mixed,
        },
        paidAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        itemBreakdown: [
            {
                name: { type: String, required: true },
                description: { type: String },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                total: { type: Number, required: true, min: 0 },
            },
        ],
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
UnifiedPaymentSchema.index({ patientId: 1, paymentStatus: 1, createdAt: -1 });
UnifiedPaymentSchema.index({ serviceType: 1, serviceId: 1 });
UnifiedPaymentSchema.index({ providerId: 1, paymentStatus: 1, createdAt: -1 });
UnifiedPaymentSchema.index({ expiresAt: 1, paymentStatus: 1 }); // For expiry cleanup

// Generate invoice ID before saving
UnifiedPaymentSchema.pre('save', async function (next) {
    if (!this.invoiceId) {
        const prefix = {
            doctor: 'DOC',
            lab: 'LAB',
            pharmacy: 'PHR',
        }[this.serviceType];

        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        this.invoiceId = `INV-${prefix}-${date}-${random}`;
    }
    next();
});

export default mongoose.models.UnifiedPayment || mongoose.model<IUnifiedPayment>('UnifiedPayment', UnifiedPaymentSchema);
