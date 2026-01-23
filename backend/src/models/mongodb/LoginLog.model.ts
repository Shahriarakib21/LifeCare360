import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginLog extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const LoginLogSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        required: true,
        index: true
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

export default mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
