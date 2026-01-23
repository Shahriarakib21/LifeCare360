'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface Article {
    _id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    imageUrl?: string;
    linkedTests: string[];
}

const LabAwareness = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await api.get('/api/public/lab-articles');
                setArticles(response.data?.data || []);
            } catch (error) {
                console.error('Error fetching lab articles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    // Use dummy data if no articles are found in DB (for initial display)
    const displayArticles = articles.length > 0 ? articles : [
        {
            _id: '1',
            title: 'Preparing for Your Blood Test: What You Need to Know',
            slug: 'preparing-for-blood-test',
            content: 'Fasting for 8-12 hours is often required for accurate blood sugar and lipid profile results. Discover why preparation is key to medical precision...',
            category: 'Preparation',
            linkedTests: ['CBC', 'Blood Sugar'],
        },
        {
            _id: '2',
            title: 'Understanding Your Thyroid Profile Results',
            slug: 'understanding-thyroid-profile',
            content: 'TSH, T3, and T4 levels tell a complex story about your metabolism. Learn how to interpret these critical markers and when to consult a specialist...',
            category: 'Awareness',
            linkedTests: ['Thyroid Profile'],
        },
        {
            _id: '3',
            title: 'The Importance of Annual Health Checkups',
            slug: 'importance-of-annual-checkups',
            content: 'Early detection saves lives. A comprehensive annual lab screening can identify underlying health issues before they become chronic conditions...',
            category: 'Health Tips',
            linkedTests: ['Full Body Checkup'],
        }
    ];

    if (loading && articles.length === 0) return null;

    return (
        <section className="py-24 bg-secondary-900 text-white overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="container-custom relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Health Awareness & Insights</h2>
                        <p className="text-xl text-secondary-400 max-w-2xl">
                            Stay informed with bite-sized medical knowledge curated by our health experts.
                        </p>
                    </div>
                    <Link href="/articles">
                        <Button variant="secondary" className="border-secondary-700 text-white hover:bg-secondary-800">
                            View All Articles
                            <BookOpen className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {displayArticles.map((article, index) => (
                        <motion.div
                            key={article._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-secondary-800 rounded-3xl p-8 border border-secondary-700 hover:border-primary-500 hover:shadow-2xl transition-all group flex flex-col"
                        >
                            <div className="mb-6 flex justify-between items-start">
                                <span className="px-3 py-1 bg-primary-600/20 text-primary-400 text-xs font-bold rounded-full border border-primary-600/30">
                                    {article.category}
                                </span>
                                <Activity className="w-6 h-6 text-secondary-600 group-hover:text-primary-500 transition-colors" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-primary-400 transition-colors">
                                {article.title}
                            </h3>

                            <p className="text-secondary-400 mb-8 flex-grow">
                                {article.content}
                            </p>

                            <div className="pt-6 border-t border-secondary-700">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {article.linkedTests.map((test, idx) => (
                                        <span key={idx} className="text-[10px] text-secondary-500 bg-secondary-900 px-2 py-1 rounded">
                                            #{test}
                                        </span>
                                    ))}
                                </div>

                                <Link href={`/articles/${article.slug}`}>
                                    <button className="flex items-center gap-2 text-primary-400 font-bold group-hover:text-primary-300 transition-colors">
                                        Read Full Story
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Newsletter / Call to Action Overlay */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 p-12 rounded-[40px] bg-gradient-to-r from-primary-600 to-indigo-700 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl"
                >
                    <div className="relative z-10 text-center lg:text-left">
                        <h3 className="text-3xl font-bold mb-4">Subscribe to Health Alerts</h3>
                        <p className="text-primary-100 max-w-md">
                            Receive weekly updates on health tips, lab preparation guides, and exclusive diagnostic discounts.
                        </p>
                    </div>

                    <div className="relative z-10 w-full lg:w-auto flex flex-col sm:flex-row gap-4">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 w-full lg:w-80 backdrop-blur-md"
                        />
                        <Button className="bg-white text-primary-600 hover:bg-secondary-100 px-8 py-4 whitespace-nowrap">
                            Join Community
                            <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    {/* Background circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </motion.div>
            </div>
        </section>
    );
};

export default LabAwareness;
