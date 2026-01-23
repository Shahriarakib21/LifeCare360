import mongoose, { Schema, Document } from 'mongoose';

export interface ITestPrice extends Document {
  labId: mongoose.Types.ObjectId;
  testCode: string;
  testName: string;
  price: number;
  description?: string;
  preparationInstructions?: string;
  estimatedDeliveryTime?: string;
  sampleType?: string;
  active: boolean;
  lastUpdated: Date;
}

const TestPriceSchema = new Schema<ITestPrice>(
  {
    labId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    preparationInstructions: {
      type: String,
      trim: true,
    },
    estimatedDeliveryTime: {
      type: String,
      trim: true,
    },
    sampleType: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique test code per lab
TestPriceSchema.index({ labId: 1, testCode: 1 }, { unique: true });

export default mongoose.models.TestPrice || mongoose.model<ITestPrice>('TestPrice', TestPriceSchema);
