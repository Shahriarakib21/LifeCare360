'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Download, Eye, Upload, ChevronRight, File, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';

export default function ReportsSection({ reports = [] }: { reports?: any[] }) {
    const router = useRouter();

    const displayReports = React.useMemo(() => {
        const list: any[] = [];
        reports.forEach(report => {
            if (report.data?.attachments && Array.isArray(report.data.attachments)) {
                report.data.attachments.forEach((att: any) => {
                    list.push({
                        id: report._id,
                        name: att.name || 'Medical Report',
                        date: new Date(report.date).toLocaleDateString(),
                        type: att.type || 'Document',
                        url: att.url
                    });
                });
            } else if (report.data?.labResults) {
                list.push({
                    id: report._id,
                    name: report.data.testName || 'Lab Result',
                    date: new Date(report.date).toLocaleDateString(),
                    type: 'PDF',
                    url: report.data.pdfUrl
                });
            }
        });
        return list.slice(0, 3);
    }, [reports]);

    return (
        <Card className="h-full border-none shadow-soft flex flex-col bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-secondary-600" />
                    </div>
                    <h2 className="text-xl font-black text-secondary-900 tracking-tight">Recent Reports</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-secondary-600 font-bold hover:bg-secondary-50"
                    onClick={() => router.push('/patient/reports')}
                >
                    History
                </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {displayReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                        <ImagePlaceholder type="blog" className="w-20 h-20 rounded-2xl opacity-50" />
                        <div className="space-y-1">
                            <p className="text-secondary-900 font-black">No Reports Found</p>
                            <p className="text-sm text-secondary-500 font-medium tracking-tight">Your clinical results will appear here.</p>
                        </div>
                    </div>
                ) : (
                    displayReports.map((report, idx) => (
                        <div key={idx} className="group flex items-center p-4 rounded-3xl bg-secondary-50/30 border border-secondary-50 hover:border-secondary-200 hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-white shadow-sm flex items-center justify-center border border-secondary-100 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-secondary-600" />
                            </div>

                            <div className="flex-1 ml-4 min-w-0">
                                <h4 className="text-sm font-black text-secondary-900 truncate uppercase tracking-tight group-hover:text-secondary-600 transition-colors">
                                    {report.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{report.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-secondary-200" />
                                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{report.type}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {report.url && (
                                    <button
                                        onClick={() => window.open(report.url, '_blank')}
                                        className="w-10 h-10 rounded-xl bg-white border border-secondary-200 flex items-center justify-center text-secondary-500 hover:text-secondary-600 hover:border-secondary-300 hover:shadow-md transition-all"
                                        title="View Document"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-secondary-100 grid grid-cols-2 gap-4">
                <Button
                    className="rounded-2xl py-3 font-black text-xs uppercase tracking-widest shadow-lg"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={() => router.push('/patient/reports')}
                >
                    Upload Record
                </Button>
                <Button
                    variant="secondary"
                    className="rounded-2xl py-3 font-black text-xs uppercase tracking-widest bg-secondary-50"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => router.push('/patient/reports')}
                >
                    All Vaults
                </Button>
            </div>
        </Card>
    );
}
