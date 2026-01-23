'use client';

import { Mail, Phone, MapPin, MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';

const customers = [
    {
        id: 1,
        name: 'Alexandra Smith',
        email: 'alex.smith@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY',
        totalOrders: 12,
        lastVisit: '2 days ago',
        status: 'Active',
    },
    {
        id: 2,
        name: 'Michael Brown',
        email: 'm.brown@example.com',
        phone: '+1 (555) 987-6543',
        address: '456 Park Ave, Brooklyn, NY',
        totalOrders: 8,
        lastVisit: '1 week ago',
        status: 'Active',
    },
    {
        id: 3,
        name: 'Sarah Davis',
        email: 'sarah.d@example.com',
        phone: '+1 (555) 456-7890',
        address: '789 Oak Ln, Queens, NY',
        totalOrders: 3,
        lastVisit: '1 month ago',
        status: 'Inactive',
    },
    {
        id: 4,
        name: 'James Wilson',
        email: 'j.wilson@example.com',
        phone: '+1 (555) 234-5678',
        address: '321 Pine St, Bronx, NY',
        totalOrders: 24,
        lastVisit: 'Today',
        status: 'Active',
    },
];

export function CustomersList() {
    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-secondary-900">Registered Customers</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm">Export List</Button>
                    <Button variant="primary" size="sm">Add Customer</Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary-100 text-left">
                            <th className="pb-4 font-semibold text-secondary-900">Customer</th>
                            <th className="pb-4 font-semibold text-secondary-900">Contact</th>
                            <th className="pb-4 font-semibold text-secondary-900">Location</th>
                            <th className="pb-4 font-semibold text-secondary-900">Orders</th>
                            <th className="pb-4 font-semibold text-secondary-900">Last Visit</th>
                            <th className="pb-4 font-semibold text-secondary-900">Status</th>
                            <th className="pb-4 font-semibold text-secondary-900"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                        {customers.map((customer) => (
                            <tr key={customer.id} className="group hover:bg-secondary-50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-secondary-900">{customer.name}</p>
                                            <p className="text-xs text-secondary-500">ID: #{customer.id.toString().padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                                            <Mail className="w-3 h-3" />
                                            {customer.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                                            <Phone className="w-3 h-3" />
                                            {customer.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                                        <MapPin className="w-3 h-3" />
                                        {customer.address}
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-secondary-900 font-medium">
                                    {customer.totalOrders}
                                </td>
                                <td className="py-4 text-sm text-secondary-600">
                                    {customer.lastVisit}
                                </td>
                                <td className="py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'Active'
                                        ? 'bg-success-100 text-success-700'
                                        : 'bg-secondary-100 text-secondary-700'
                                        }`}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td className="py-4 text-right">
                                    <button className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-white transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
