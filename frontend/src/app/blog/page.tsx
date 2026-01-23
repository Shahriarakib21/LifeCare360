'use client';

import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: '10 Tips for Maintaining a Healthy Heart',
      excerpt: 'Learn simple lifestyle changes that can significantly improve your heart health...',
      author: 'Dr. Sarah Johnson',
      date: new Date('2024-01-15'),
      category: 'Cardiology',
      image: null,
    },
    {
      id: 2,
      title: 'Understanding Diabetes: A Complete Guide',
      excerpt: 'Everything you need to know about diabetes, its types, symptoms, and management...',
      author: 'Dr. Michael Chen',
      date: new Date('2024-01-10'),
      category: 'Endocrinology',
      image: null,
    },
    {
      id: 3,
      title: 'Mental Health and Wellness in 2024',
      excerpt: 'Strategies for maintaining good mental health in our fast-paced world...',
      author: 'Dr. Emily Rodriguez',
      date: new Date('2024-01-05'),
      category: 'Mental Health',
      image: null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Health & Wellness Blog
              </h1>
              <p className="text-xl text-primary-100">
                Expert insights and tips for a healthier life
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="container-custom py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} hover padding="lg" className="flex flex-col">
                <div className="w-full h-48 bg-secondary-200 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-secondary-500">Image</span>
                </div>
                <div className="flex-1">
                  <Badge variant="primary" size="sm" className="mb-3">
                    {post.category}
                  </Badge>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-secondary-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-secondary-500 mb-4">
                    <User className="w-4 h-4 mr-2" />
                    <span className="mr-4">{post.author}</span>
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(post.date, 'short')}</span>
                  </div>
                  <Button variant="ghost" size="sm" fullWidth>
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

