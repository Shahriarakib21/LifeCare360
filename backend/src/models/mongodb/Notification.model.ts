import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'lab_order' | 'payment_received' | 'test_completed' | 'result_uploaded' | 'prescription_created' | 'test_assigned' | 'appointment_booked' | 'appointment_cancelled' | 'lab_request' | 'appointment' | 'refill_request' | 'new_order';
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['lab_order', 'payment_received', 'test_completed', 'result_uploaded', 'prescription_created', 'test_assigned', 'appointment_booked', 'appointment_cancelled', 'lab_request', 'appointment', 'refill_request', 'new_order'],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Method to mark as read
NotificationSchema.methods.markAsRead = async function () {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function (userId: mongoose.Types.ObjectId) {
    return await this.countDocuments({ userId, read: false });
};

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
