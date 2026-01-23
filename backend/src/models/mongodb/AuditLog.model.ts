import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    targetUserId?: mongoose.Types.ObjectId;
    details: Schema.Types.Mixed;
    ipAddress?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    targetUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    details: {
        type: Schema.Types.Mixed,
        required: true
    },
    ipAddress: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
