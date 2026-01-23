'use client';

import React, { useState, useMemo } from 'react';
import { Download, Calendar, TrendingUp, Coins, Package, Users, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AnalyticsCharts } from '@/components/pharmacy/AnalyticsCharts';
import toast from 'react-hot-toast';
import { usePharmacyStore } from '@/store/pharmacyStore';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState('30');

    const orders = usePharmacyStore((state) => state.orders);
    const customers = usePharmacyStore((state) => state.customers);
    const prescriptions = usePharmacyStore((state) => state.prescriptions);
    const medicines = usePharmacyStore((state) => state.medicines);

    const fetchOrders = usePharmacyStore((state) => state.fetchOrders);
    const fetchCustomers = usePharmacyStore((state) => state.fetchCustomers);
    const fetchPrescriptions = usePharmacyStore((state) => state.fetchPrescriptions);
    const fetchMedicines = usePharmacyStore((state) => state.fetchMedicines);

    React.useEffect(() => {
        fetchOrders();
        fetchCustomers();
        fetchPrescriptions();
        fetchMedicines();
    }, [fetchOrders, fetchCustomers, fetchPrescriptions, fetchMedicines]);

    // Calculate stats based on date range
    const stats = useMemo(() => {
        const days = parseInt(dateRange);
        const now = new Date();
        const startCurrent = new Date(now);
        startCurrent.setDate(now.getDate() - days);

        const startPrevious = new Date(startCurrent);
        startPrevious.setDate(startCurrent.getDate() - days);

        // Helper to check if date is in range [start, end)
        const isInRange = (dateStr: string, start: Date, end: Date) => {
            const d = new Date(dateStr);
            return d >= start && d < end;
        };

        // Filter Current Period
        const currentOrders = orders.filter(o => isInRange(o.createdAt, startCurrent, now));
        const currentCustomers = customers.filter(c => isInRange(c.createdAt, startCurrent, now));

        // Filter Previous Period
        const previousOrders = orders.filter(o => isInRange(o.createdAt, startPrevious, startCurrent));
        const previousCustomers = customers.filter(c => isInRange(c.createdAt, startPrevious, startCurrent));

        // Calculate Values
        const currentRevenue = currentOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const previousRevenue = previousOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const currentOrdersCount = currentOrders.length;
        const previousOrdersCount = previousOrders.length;

        const currentCustomersCount = currentCustomers.length;
        const previousCustomersCount = previousCustomers.length;

        // Calculate Changes
        const calculateChange = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? '+100%' : '0%';
            const change = ((curr - prev) / prev) * 100;
            return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        const revenueChange = calculateChange(currentRevenue, previousRevenue);
        const ordersChange = calculateChange(currentOrdersCount, previousOrdersCount);
        const customersChange = calculateChange(currentCustomersCount, previousCustomersCount);

        // Growth Rate (using Revenue Growth)
        const growthRateVal = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) + '%'
            : (currentRevenue > 0 ? '+100%' : '0%');

        return [
            { label: 'Total Revenue', value: `৳${currentRevenue.toFixed(2)}`, change: revenueChange, icon: Coins, color: 'text-success-600', bgColor: 'bg-success-100' },
            { label: 'Total Orders', value: currentOrdersCount.toString(), change: ordersChange, icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-100' },
            { label: 'New Customers', value: currentCustomersCount.toString(), change: customersChange, icon: Users, color: 'text-warning-600', bgColor: 'bg-warning-100' },
            { label: 'Growth Rate', value: growthRateVal, change: revenueChange, icon: TrendingUp, color: 'text-error-600', bgColor: 'bg-error-100' },
        ];
    }, [orders, customers, dateRange]);

    // Sales Data for Charts
    const salesData = useMemo(() => {
        const data: { name: string; sales: number; profit: number }[] = [];
        const daysToLookBack = parseInt(dateRange);

        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

            // Find orders for this day
            const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));
            const sales = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

            // Mock profit as 40% of sales
            const profit = sales * 0.4;

            data.push({
                name: daysToLookBack <= 7 ? dayName : dateStr.split('-').slice(1).join('/'),
                sales: parseFloat(sales.toFixed(2)),
                profit: parseFloat(profit.toFixed(2))
            });
        }
        return data;
    }, [orders, dateRange]);

    // Category Data for Charts
    const categoryData = useMemo(() => {
        const catMap = new Map<string, number>();

        orders.forEach(order => {
            // Filter by date range as well? YES.
            const orderDate = new Date(order.createdAt);
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - parseInt(dateRange));

            if (orderDate >= pastDate) {
                order.items.forEach((item: any) => {
                    let name = '';
                    let qty = 1;
                    if (typeof item === 'string') {
                        name = item;
                    } else {
                        name = item.name;
                        qty = item.quantity || 1;
                    }

                    // Find category 
                    // Note: This relies on medicine name matching. 
                    const med = medicines.find(m => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase()));
                    const category = med?.category || 'Uncategorized';

                    catMap.set(category, (catMap.get(category) || 0) + qty);
                });
            }
        });

        const result = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
        // If empty, provide placeholder to avoid empty chart
        if (result.length === 0) return [{ name: 'No Data', value: 1 }];
        return result;
    }, [orders, medicines, dateRange]);

    // Top Selling Medicines Aggregation
    const topSelling = useMemo(() => {
        const itemMap = new Map<string, { name: string; sales: number; revenue: number }>();

        orders.forEach(order => {
            order.items.forEach((item: any) => {
                let name = '';
                let qty = 1;
                // Price is approximate since we don't store it per item in order history directly in this simple version
                // We'll estimate revenue portion by split or just count units

                if (typeof item === 'string') {
                    name = item;
                } else {
                    name = item.name;
                    qty = item.quantity || 1;
                }

                if (!itemMap.has(name)) {
                    itemMap.set(name, { name, sales: 0, revenue: 0 });
                }

                const entry = itemMap.get(name)!;
                entry.sales += qty;
            });
        });

        return Array.from(itemMap.values())
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [orders]);

    // Recent Activity Aggregation
    const recentActivity = useMemo(() => {
        const activities: any[] = [];

        // Add Orders
        orders.forEach(order => {
            activities.push({
                type: 'order',
                action: `Order #${order.id} - ৳${order.totalAmount}`,
                time: new Date(order.createdAt).toLocaleDateString(),
                timestamp: new Date(order.createdAt).getTime()
            });
        });

        // Add Prescriptions
        prescriptions.forEach(p => {
            activities.push({
                type: 'prescription',
                action: `Prescription for ${p.patientName} (${p.status})`,
                time: new Date(p.date).toLocaleDateString(),
                timestamp: new Date(p.date).getTime()
            });
        });

        // Add Customers
        customers.forEach(c => {
            activities.push({
                type: 'customer',
                action: `New Customer: ${c.name}`,
                time: new Date(c.createdAt).toLocaleDateString(),
                timestamp: new Date(c.createdAt).getTime()
            });
        });

        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    }, [orders, prescriptions, customers]);

    const handleExportPDF = () => {
        toast.success('Opening print dialog...');
        window.print();
    };

    const handleExportCSV = () => {
        const csv = [
            ['Metric', 'Value', 'Change'],
            ...stats.map(stat => [stat.label, stat.value, stat.change])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmacy_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('CSV report exported successfully!');
    };

    const handleDownloadCharts = () => {
        const svg = document.querySelector('.recharts-surface') as SVGSVGElement;

        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const svgSize = svg.getBoundingClientRect();
            canvas.width = svgSize.width;
            canvas.height = svgSize.height;
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `chart_${new Date().toISOString().split('T')[0]}.png`;
                    a.click();
                    toast.success('Sales Chart downloaded successfully!');
                }
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } else {
            toast.error('No charts found to download.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Analytics & Reports</h1>
                    <p className="text-secondary-600 mt-1">Overview of pharmacy performance and sales</p>
                </div>
                <div className="flex gap-3 print:hidden">
                    <div className="relative">
                        <select
                            className="appearance-none px-4 py-2 pr-10 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm font-medium text-secondary-700"
                            value={dateRange}
                            onChange={(e) => {
                                setDateRange(e.target.value);
                                toast.success(`Date range updated to last ${e.target.value} days`);
                            }}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="365">Last Year</option>
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                    </div>
                    <Button variant="ghost" onClick={handleDownloadCharts}>
                        <Download className="w-4 h-4 mr-2" />
                        Charts
                    </Button>
                    <Button variant="ghost" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button onClick={handleExportPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF Report
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} padding="lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-secondary-600 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                                    <p className="text-sm text-success-600 mt-1">{stat.change}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <AnalyticsCharts salesData={salesData} categoryData={categoryData} />

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card padding="lg">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Selling Medicines</h3>
                    <div className="space-y-3">
                        {topSelling.length > 0 ? (
                            topSelling.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">{item.name}</p>
                                        <p className="text-sm text-secondary-600">{item.sales} units sold</p>
                                    </div>
                                    {/* <p className="font-semibold text-primary-600">${item.revenue}</p> */}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-secondary-500">No sales data available yet</p>
                                <p className="text-sm text-secondary-400 mt-1">Data will appear when medicines are sold</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card padding="lg">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full ${activity.type === 'order' ? 'bg-primary-600' :
                                        activity.type === 'prescription' ? 'bg-success-600' :
                                            activity.type === 'customer' ? 'bg-warning-600' :
                                                'bg-secondary-600'
                                        }`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-secondary-900">{activity.action}</p>
                                        <p className="text-xs text-secondary-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-secondary-500">No recent activity</p>
                                <p className="text-sm text-secondary-400 mt-1">Activity will appear here as you use the system</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Print Button */}
            <div className="flex justify-center pt-6">
                <Button variant="ghost" onClick={handlePrint}>
                    <Download className="w-4 h-4 mr-2" />
                    Print Report
                </Button>
            </div>
        </div>
    );
}
