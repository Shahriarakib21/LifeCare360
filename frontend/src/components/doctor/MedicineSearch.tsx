'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Pill, Info, ExternalLink, Package } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Medicine {
    id: number;
    name: string;
    genericName: string;
    dosageForm: string;
    strength: string;
    category: string;
    price: string | number;
    manufacturer: string;
    stock: number;
}

interface MedicineSearchProps {
    value: string;
    onChange: (medicine: any) => void;
    placeholder?: string;
    className?: string;
    showPrice?: boolean;
}

const MedicineSearch: React.FC<MedicineSearchProps> = ({
    value,
    onChange,
    placeholder = "Search medicine (brand, generic, or category)...",
    className,
    showPrice = true
}) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchMedicines = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/api/public/medicines/search', {
                params: { q: searchQuery, limit: 15 }
            });
            setResults(response.data.data.medicines || []);
            setShowDropdown(true);
            setHasSearched(true);
        } catch (error) {
            console.error('Failed to search medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (!val) {
            onChange({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
            setResults([]);
            setShowDropdown(false);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(() => {
            searchMedicines(val);
        }, 400); // 400ms debounce
        return () => clearTimeout(timer);
    };

    const handleSelect = (medicine: Medicine) => {
        setQuery(medicine.name);
        setShowDropdown(false);
        onChange({
            name: medicine.name,
            dosage: medicine.strength || '',
            dosageForm: medicine.dosageForm,
            genericName: medicine.genericName,
            price: medicine.price,
            id: medicine.id
        });
    };

    // Helper to highlight matching text
    const highlightMatch = (text: string, term: string) => {
        if (!term.trim()) return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === term.toLowerCase() ?
                        <span key={i} className="bg-primary-100 text-primary-900 font-bold">{part}</span> : part
                )}
            </span>
        );
    };

    return (
        <div className={cn("relative w-full", className)} ref={dropdownRef}>
            <div className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-secondary-300 bg-white px-4 py-3 pl-11 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm group-hover:border-secondary-400"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 transition-colors group-hover:text-primary-500">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </div>
            </div>

            {showDropdown && (
                <div className="absolute z-[100] mt-2 w-full rounded-2xl border border-secondary-200 bg-white shadow-2xl max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="overflow-y-auto custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((med) => (
                                <button
                                    key={med.id}
                                    onClick={() => handleSelect(med)}
                                    className="w-full px-5 py-4 text-left hover:bg-primary-50 border-b border-secondary-100 last:border-0 transition-colors group/item"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-secondary-900 text-base truncate lowercase first-letter:uppercase">
                                                    {med.name}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded bg-secondary-100 text-[10px] font-bold text-secondary-600 uppercase tracking-wider">
                                                    {med.dosageForm}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary-500 italic mb-2 truncate">
                                                {med.genericName}
                                            </p>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-[10px] font-medium text-secondary-500 bg-secondary-50 px-2 py-0.5 rounded-full border border-secondary-100 uppercase tracking-tight">
                                                    {med.category || 'General'}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                                                    {med.strength}
                                                </span>
                                            </div>
                                        </div>
                                        {showPrice && (
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-lg font-black text-primary-700">
                                                    ৳{med.price}
                                                </div>
                                                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 bg-green-50 text-green-700">
                                                    {med.stock} in stock
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : hasSearched && !loading ? (
                            <div className="p-8 text-center bg-secondary-50/50">
                                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <Package className="w-6 h-6 text-secondary-300" />
                                </div>
                                <p className="text-sm font-semibold text-secondary-600">No matching medicines found</p>
                                <p className="text-xs text-secondary-400 mt-1">Try searching with a generic name or category</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="bg-secondary-50 p-3 text-center border-t border-secondary-100">
                        <p className="text-[10px] text-secondary-400 font-medium">
                            Searching {results.length === 15 ? 'top 15' : results.length} matching medicines from database
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineSearch;
