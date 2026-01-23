import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/mongodb/User.model';
import TestPrice from '../src/models/mongodb/TestPrice.model';
import LabArticle from '../src/models/mongodb/LabArticle.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifecare360';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create Lab Users
        const labUsers = [
            {
                email: 'lab1@example.com',
                role: 'lab',
                profile: {
                    firstName: 'Precision',
                    lastName: 'Diagnostics',
                    phone: '+880 1711-223344',
                    location: {
                        address: '123 Health Ave',
                        city: 'Dhaka',
                        state: 'Dhaka',
                        country: 'Bangladesh'
                    }
                },
                labDetails: {
                    accreditations: ['ISO 15189', 'NABL'],
                    operatingHours: 'Mon-Sat: 07:00 AM - 10:00 PM',
                    services: ['Home Collection', 'Lab Visit', 'Express Report'],
                    about: 'Precision Diagnostics is a leading healthcare provider committed to clinical excellence and patient safety.',
                    rating: 4.8,
                    totalReviews: 1250
                },
                isActive: true,
                isEmailVerified: true,
                password: '$2a$12$LQv3c1yqBWVHxkd0Lp6m7.h5W7wV6Xv7Xv7Xv7Xv7Xv7Xv7Xv7Xv7' // password
            },
            {
                email: 'lab2@example.com',
                role: 'lab',
                profile: {
                    firstName: 'MediCare',
                    lastName: 'Central Lab',
                    phone: '+880 1811-334455',
                    location: {
                        address: '45 Care Road',
                        city: 'Chittagong',
                        state: 'Chittagong',
                        country: 'Bangladesh'
                    }
                },
                labDetails: {
                    accreditations: ['ISO 9001'],
                    operatingHours: '24/7 Service',
                    services: ['Lab Visit', 'Emergence Reports'],
                    about: 'MediCare Central Lab provides comprehensive diagnostic solutions with the latest automated technology.',
                    rating: 4.6,
                    totalReviews: 840
                },
                isActive: true,
                isEmailVerified: true,
                password: '$2a$12$LQv3c1yqBWVHxkd0Lp6m7.h5W7wV6Xv7Xv7Xv7Xv7Xv7Xv7Xv7Xv7' // password
            },
            {
                email: 'lab3@example.com',
                role: 'lab',
                profile: {
                    firstName: 'LifeLine',
                    lastName: 'Pathology',
                    phone: '+880 1911-445566',
                    location: {
                        address: '7 Hill Side',
                        city: 'Sylhet',
                        state: 'Sylhet',
                        country: 'Bangladesh'
                    }
                },
                labDetails: {
                    accreditations: ['ISO 15189'],
                    operatingHours: 'Mon-Fri: 08:00 AM - 09:00 PM',
                    services: ['Home Collection', 'Lab Visit'],
                    about: 'LifeLine Pathology is dedicated to providing high-quality, accessible diagnostic services to our community.',
                    rating: 4.5,
                    totalReviews: 520
                },
                isActive: true,
                isEmailVerified: true,
                password: '$2a$12$LQv3c1yqBWVHxkd0Lp6m7.h5W7wV6Xv7Xv7Xv7Xv7Xv7Xv7Xv7Xv7' // password
            }
        ];

        for (const labData of labUsers) {
            const existing = await User.findOne({ email: labData.email });
            if (!existing) {
                const user = new User(labData);
                await user.save();
                console.log(`Created lab: ${labData.email}`);

                // 2. Create Test Prices for each lab
                const tests = [
                    {
                        labId: user._id,
                        testCode: 'CBC001',
                        testName: 'Complete Blood Count (CBC)',
                        price: 450,
                        description: 'Comprehensive analysis of blood components including RBC, WBC, and Platelets.',
                        preparationInstructions: 'No fasting required. Avoid heavy meals before the test.',
                        estimatedDeliveryTime: '24 Hours',
                        sampleType: 'Whole Blood',
                        active: true
                    },
                    {
                        labId: user._id,
                        testCode: 'FBS001',
                        testName: 'Fasting Blood Sugar (FBS)',
                        price: 150,
                        description: 'Measures blood glucose levels after an 8-12 hour fast.',
                        preparationInstructions: 'Fasting for 8-12 hours is strictly required. Only water is allowed.',
                        estimatedDeliveryTime: '12 Hours',
                        sampleType: 'Plasma',
                        active: true
                    },
                    {
                        labId: user._id,
                        testCode: 'LIPID01',
                        testName: 'Lipid Profile',
                        price: 1200,
                        description: 'Check cholesterol levels including HDL, LDL, and Triglycerides.',
                        preparationInstructions: 'Fasting for 10-12 hours is required.',
                        estimatedDeliveryTime: '24 Hours',
                        sampleType: 'Serum',
                        active: true
                    }
                ];
                await TestPrice.insertMany(tests);
                console.log(`Added tests for ${labData.email}`);
            }
        }

        // 3. Create Lab Articles
        const articles = [
            {
                title: 'Preparing for Your Blood Test: What You Need to Know',
                slug: 'preparing-for-blood-test',
                content: 'Fasting for 8-12 hours is often required for accurate blood sugar and lipid profile results. Discover why preparation is key to medical precision and how it affects your clinical outcomes.',
                category: 'Preparation',
                linkedTests: ['CBC', 'Blood Sugar'],
                isActive: true
            },
            {
                title: 'Understanding Your Thyroid Profile Results',
                slug: 'understanding-thyroid-profile',
                content: 'TSH, T3, and T4 levels tell a complex story about your metabolism. Learn how to interpret these critical markers and when to consult a specialist for hormonal imbalances.',
                category: 'Awareness',
                linkedTests: ['Thyroid Profile'],
                isActive: true
            }
        ];

        for (const art of articles) {
            const existing = await LabArticle.findOne({ slug: art.slug });
            if (!existing) {
                await new LabArticle(art).save();
                console.log(`Created article: ${art.title}`);
            }
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
