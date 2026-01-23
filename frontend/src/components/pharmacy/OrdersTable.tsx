'use client';

import React, { useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    Printer,
    Truck,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Order {
    id: string;
    customer: {
        name: string;
        email: string;
    };
    date: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    items: number;
    paymentStatus: 'paid' | 'unpaid' | 'refunded';
}

const dummyOrders: Order[] = [
    {
        id: 'ORD-001',
        customer: { name: 'Sarah Johnson', email: 'sarah@example.com' },
        date: '2024-03-20',
        amount: 45.99,
        status: 'completed',
        items: 3,
        paymentStatus: 'paid',
    },
    {
        id: 'ORD-002',
        customer: { name: 'Michael Brown', email: 'michael@example.com' },
        date: '2024-03-21',
        amount: 120.50,
        status: 'processing',
        items: 5,
        paymentStatus: 'paid',
    },
    {
        id: 'ORD-003',
        customer: { name: 'Emily Davis', email: 'emily@example.com' },
        date: '2024-03-21',
        amount: 15.00,
        status: 'pending',
        items: 1,
        paymentStatus: 'unpaid',
    },
    {
        id: 'ORD-004',
        customer: { name: 'David Wilson', email: 'david@example.com' },
        date: '2024-03-19',
        amount: 89.99,
        status: 'cancelled',
        items: 2,
        paymentStatus: 'refunded',
    },
    {
        id: 'ORD-005',
        customer: { name: 'James Anderson', email: 'james@example.com' },
        date: '2024-03-22',
        amount: 210.00,
        status: 'processing',
        items: 8,
        paymentStatus: 'paid',
    },
];

export function OrdersTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredOrders = dummyOrders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || order.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'processing':
                return <Badge variant="primary"><Truck className="w-3 h-3 mr-1" /> Processing</Badge>;
            case 'pending':
                return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'cancelled':
                return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
            default:
                return null;
        }
    };

    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h2 className="text-lg font-semibold text-secondary-900">Recent Orders</h2>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-9 pr-4 py-2 w-full sm:w-64 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none pl-3 pr-8 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-secondary-50 border-b border-secondary-100">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-secondary-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-medium text-primary-600">{order.id}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-secondary-900">{order.customer.name}</span>
                                        <span className="text-xs text-secondary-500">{order.customer.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                    {order.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-secondary-900">${order.amount.toFixed(2)}</span>
                                        <span className={`text-xs capitalize ${order.paymentStatus === 'paid' ? 'text-success-600' : 'text-warning-600'
                                            }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(order.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />} />
                                        <Button variant="ghost" size="sm" leftIcon={<Printer className="w-4 h-4" />} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredOrders.length === 0 && (
                <div className="p-8 text-center text-secondary-500">
                    No orders found matching your criteria.
                </div>
            )}

            <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
                <span className="text-sm text-secondary-600">
                    Showing <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{dummyOrders.length}</span> orders
                </span>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled>Previous</Button>
                    <Button variant="secondary" size="sm">Next</Button>
                </div>
            </div>
        </Card>
    );
}
