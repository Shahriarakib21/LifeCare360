import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    contactEmail: string;
    systemAnnouncement: string;
    updatedBy: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema({
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    contactEmail: { type: String, default: 'admin@healthcare.com' },
    systemAnnouncement: { type: String, default: '' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
