'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Download, Eye, Upload, ChevronRight, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsSection({ reports = [] }: { reports?: any[] }) {
    const router = useRouter();

    // Flatten attachments from report EHRs
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
                // Lab result entries from doctor/lab
                list.push({
                    id: report._id,
                    name: report.data.testName || 'Lab Result',
                    date: new Date(report.date).toLocaleDateString(),
                    type: 'PDF',
                    url: report.data.pdfUrl // Assuming pdfUrl is here for lab results
                });
            }
        });
        return list.slice(0, 3);
    }, [reports]);

    return (
        <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Reports & Records</h2>
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={() => router.push('/patient/reports')}>
                    History
                </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
                {displayReports.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <File className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent reports.</p>
                    </div>
                ) : (
                    displayReports.map((report, idx) => (
                        <div key={idx} className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-white transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 ml-3 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800 truncate">{report.name}</h4>
                                <p className="text-xs text-slate-500">{report.date} • {report.type.toUpperCase()}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {report.url && (
                                    <>
                                        <button
                                            onClick={() => window.open(report.url, '_blank')}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = report.url;
                                                a.download = report.name;
                                                a.click();
                                            }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                <Button
                    className="flex-1 bg-slate-900 text-white hover:bg-slate-800 rounded-xl"
                    size="sm"
                    onClick={() => router.push('/patient/reports')} // Just redirect for now
                >
                    <Upload className="w-4 h-4 mr-2" /> Upload New
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-200 rounded-xl"
                    size="sm"
                    onClick={() => router.push('/patient/reports')}
                >
                    View All
                </Button>
            </div>
        </Card>
    );
}
