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

// Static method to process refund (Negative revenue entry)
LabRevenueSchema.statics.processRefund = async function (
    labId: mongoose.Types.ObjectId,
    amount: number, // Should be positive, will be subtracted
    testBreakdown: Array<{ testName: string; price: number }>
) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueDoc = await this.findOne({ labId, date: today });
    if (revenueDoc) {
        testBreakdown.forEach((test) => {
            const currentValue = revenueDoc.revenueByTest.get(test.testName) || 0;
            revenueDoc.revenueByTest.set(test.testName, currentValue - test.price);
        });
        revenueDoc.totalRevenue -= amount;
        // testCount and paymentCount logic for refunds: 
        // Usually we don't decrement count of tests done, but maybe decrement successful paymentCount?
        // Let's decrement paymentCount but keep testCount as the work was technically initiated/done.
        revenueDoc.paymentCount -= 1;
        await revenueDoc.save();
        return revenueDoc;
    } else {
        const revenueByTest = new Map<string, number>();
        testBreakdown.forEach((test) => {
            revenueByTest.set(test.testName, -test.price);
        });
        return await this.create({
            labId,
            date: today,
            totalRevenue: -amount,
            testCount: 0, // No new tests, just refunding
            paymentCount: -1,
            revenueByTest,
        });
    }
};

export default mongoose.models.LabRevenue || mongoose.model<ILabRevenue>('LabRevenue', LabRevenueSchema);
