'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Download, Filter } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MedicineSalesReportsPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: ''
    });

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/api/reports/sales?${params.toString()}`);
            setSales(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchSales();
    };

    const handleExportCSV = () => {
        if (sales.length === 0) return;

        const headers = ['Medicine Name', 'Quantity Sold', 'Total Revenue', 'Pharmacy', 'Orders Count'];
        const rows = sales.map(item => [
            item.medicineName,
            item.quantitySold,
            item.totalRevenue.toFixed(2),
            item.pharmacyName,
            item.count
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medicine_sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const totalRevenue = sales.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalQuantity = sales.reduce((sum, item) => sum + item.quantitySold, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <Pill className="w-8 h-8 mr-3 text-primary-600" />
                        Medicine Sales Reports
                    </h1>
                    <p className="text-secondary-600 mt-2">View and analyze medicine sales data</p>
                </div>
                <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">${totalRevenue.toFixed(2)}</p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Quantity Sold</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{totalQuantity}</p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Unique Medicines</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{sales.length}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="lg">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <Input
                        type="date"
                        label="End Date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                    <Button onClick={handleApplyFilters} variant="primary" className="mt-6">
                        Apply Filters
                    </Button>
                </div>
            </Card>

            {/* Data Table */}
            <Card padding="lg">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-secondary-200">
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Medicine Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Quantity Sold</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Total Revenue</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Pharmacy</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-secondary-500">
                                            No sales data found
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((item, idx) => (
                                        <tr key={idx} className="border-b border-secondary-100 hover:bg-secondary-50">
                                            <td className="py-3 px-4 font-medium">{item.medicineName}</td>
                                            <td className="py-3 px-4">{item.quantitySold}</td>
                                            <td className="py-3 px-4 text-green-600 font-semibold">
                                                ${item.totalRevenue.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4">{item.pharmacyName}</td>
                                            <td className="py-3 px-4">{item.count}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-4 text-sm text-secondary-600">
                    Total: {sales.length} unique medicines
                </div>
            </Card>
        </div>
    );
}
