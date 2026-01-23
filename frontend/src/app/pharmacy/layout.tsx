import { Sidebar } from '@/components/pharmacy/Sidebar';
import { Header } from '@/components/pharmacy/Header';

export default function PharmacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-secondary-50 overflow-hidden">
            <div className="print:hidden">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
                <div className="print:hidden">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin print:overflow-visible print:h-auto">
                    <div className="container-custom max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
