import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'hospital' | 'insurance';
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      address?: string;
    };
  };
  labDetails?: {
    accreditations?: string[];
    operatingHours?: string;
    services?: string[]; // e.g., "Home Collection", "Lab Visit"
    about?: string;
    rating?: number;
    totalReviews?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacy', 'lab', 'hospital', 'insurance', 'admin'],
      required: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    profile: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phone: String,
      avatar: String,
      dateOfBirth: Date,
      location: {
        city: String,
        state: String,
        country: String,
        address: String,
      },
    },
    labDetails: {
      accreditations: [String],
      operatingHours: String,
      services: [String],
      about: String,
      rating: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);

