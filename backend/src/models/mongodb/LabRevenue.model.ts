import mongoose, { Schema, Document } from 'mongoose';

export interface ILabRevenue extends Document {
    labId: mongoose.Types.ObjectId;
    date: Date;
    totalRevenue: number;
    testCount: number;
    paymentCount: number;
    revenueByTest: Map<string, number>;
    updatedAt: Date;
    createdAt: Date;
}

const LabRevenueSchema = new Schema<ILabRevenue>(
    {
        labId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        totalRevenue: {
            type: Number,
            default: 0,
            min: 0,
        },
        testCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        revenueByTest: {
            type: Map,
            of: Number,
            default: new Map(),
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique revenue record per lab per day
LabRevenueSchema.index({ labId: 1, date: 1 }, { unique: true });

// Static method to update revenue
LabRevenueSchema.statics.updateRevenue = async function (
    labId: mongoose.Types.ObjectId,
    amount: number,
    testBreakdown: Array<{ testName: string; price: number }>
) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueByTest = new Map<string, number>();
    testBreakdown.forEach((test) => {
        revenueByTest.set(test.testName, (revenueByTest.get(test.testName) || 0) + test.price);
    });

    const update = {
        $inc: {
            totalRevenue: amount,
            testCount: testBreakdown.length,
            paymentCount: 1,
        },
        $set: {
            labId,
            date: today,
        },
    };

    // Update revenueByTest map
    const revenueDoc = await this.findOne({ labId, date: today });
    if (revenueDoc) {
        testBreakdown.forEach((test) => {
            const currentValue = revenueDoc.revenueByTest.get(test.testName) || 0;
            revenueDoc.revenueByTest.set(test.testName, currentValue + test.price);
        });
        revenueDoc.totalRevenue += amount;
        revenueDoc.testCount += testBreakdown.length;
        revenueDoc.paymentCount += 1;
        await revenueDoc.save();
        return revenueDoc;
    } else {
        return await this.create({
            labId,
            date: today,
            totalRevenue: amount,
            testCount: testBreakdown.length,
            paymentCount: 1,
            revenueByTest,
        });
    }
};

export default mongoose.models.LabRevenue || mongoose.model<ILabRevenue>('LabRevenue', LabRevenueSchema);
