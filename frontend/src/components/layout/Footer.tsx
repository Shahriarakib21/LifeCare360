'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone } from 'lucide-react';
import Logo from '@/components/common/Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'For Patients', href: '/patients' },
      { name: 'For Doctors', href: '/doctors' },
      { name: 'For Pharmacies', href: '/pharmacies' },
      { name: 'For Labs', href: '/labs' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Partners', href: '/partners' },
    ],
    resources: [
      { name: 'Health Blog', href: '/blog' },
      { name: 'Help Center', href: '/help' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
    legal: [
      { name: 'HIPAA Compliance', href: '/hipaa' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Security', href: '/security' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo size="footer" theme="dark" showText textClassName="text-white" />
            </div>
            <p className="text-secondary-400 text-sm mb-6 max-w-xs">
              Your complete healthcare management platform. Secure, intelligent, and designed for your lifetime health journey.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 flex items-center justify-center bg-secondary-800 rounded-lg hover:bg-primary-600 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 pt-8 border-t border-secondary-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-secondary-400">
              <a href="mailto:support@healthlife.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>support@healthlife.com</span>
              </a>
              <a href="tel:+1234567890" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>+1 (234) 567-890</span>
              </a>
            </div>
            <p className="text-sm text-secondary-400">
              © {currentYear} beenovia. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

