'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Save, X, DollarSign, CheckCircle, Database, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/lab/Toast';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { LabTestPrice } from '@/types/lab';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import FuturisticBadge from '@/components/ui/FuturisticBadge';

interface EditingState {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  active: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Add new test form
  const [newTest, setNewTest] = useState({
    testCode: '',
    testName: '',
    price: '',
    description: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auth check
  useEffect(() => {
    initialize();
    if (isAuthenticated && user?.role === 'lab') {
      setAuthChecked(true);
    } else {
      const timer = setTimeout(() => {
        if (!isAuthenticated || user?.role !== 'lab') router.push('/auth/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, initialize, router]);

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    if (!authChecked) return;

    setLoading(true);
    try {
      const response = await api.get('/api/labs/prices');
      setPrices(response.data.data?.prices || []);
    } catch (error: any) {
      console.error('Error fetching prices:', error);
      setToastMessage({ message: handleApiError(error), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [authChecked]);

  useEffect(() => {
    if (authChecked) {
      fetchPrices();
    }
  }, [authChecked, fetchPrices]);

  // Filter prices
  const filteredPrices = prices.filter((price) => {
    const matchesSearch =
      price.testCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      price.testName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && price.active) ||
      (statusFilter === 'inactive' && !price.active);

    return matchesSearch && matchesStatus;
  });

  // Edit logic
  const handleStartEdit = (price: any) => {
    const priceId = price._id || price.id;
    setEditingId(priceId);
    setEditingState({
      id: priceId,
      testCode: price.testCode || '',
      testName: price.testName || '',
      price: price.price || 0,
      active: price.active !== undefined ? price.active : true,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingState) return;
    try {
      await api.put(`/api/labs/prices/${editingState.id}`, editingState);
      setToastMessage({ message: 'Payload updated successfully', type: 'success' });
      setEditingId(null);
      fetchPrices();
    } catch (error: any) {
      setToastMessage({ message: handleApiError(error), type: 'error' });
    }
  };

  const handleAddTest = async () => {
    try {
      await api.post('/api/labs/prices', {
        ...newTest,
        price: parseFloat(newTest.price)
      });
      setToastMessage({ message: 'New diagnostic protocol registered', type: 'success' });
      setNewTest({ testCode: '', testName: '', price: '', active: true });
      fetchPrices();
    } catch (error: any) {
      setToastMessage({ message: handleApiError(error), type: 'error' });
    }
  };

  if (!authChecked || loading) {
    return <LoadingSpinner fullScreen text="Accessing Pricing Database..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">
            Pricing <span className="text-cyan-400">Engine</span>
          </h1>
          <p className="text-gray-400 flex items-center text-sm tracking-wide font-medium">
            <Zap className="w-4 h-4 mr-2 text-cyan-500" />
            MARKET DYNAMICS: REAL-TIME CALIBRATION OF LABORATORY VALUATION
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
            <Shield className="w-3 h-3 text-cyan-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Encrypted Hash Ready</span>
          </div>
        </div>
      </div>

      {/* Add New Test Form */}
      <GlassCard padding="lg" glow glowColor="cyan">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Plus className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-lg font-black text-white tracking-widest uppercase italic">Register Protocol</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Input
            label="PROTOCOL CODE"
            value={newTest.testCode}
            onChange={(e) => setNewTest({ ...newTest, testCode: e.target.value.toUpperCase() })}
            placeholder="e.g., CBC-01"
          />
          <Input
            label="DIAGNOSTIC NAME"
            value={newTest.testName}
            onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
            placeholder="e.g., Blood Analysis"
          />
          <Input
            label="UNIT VALUE (BDT)"
            type="number"
            value={newTest.price}
            onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="DESCRIPTION"
            value={newTest.description}
            onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
            placeholder="e.g., Blood Analysis details..."
          />
          <div className="flex items-end">
            <GlowButton onClick={handleAddTest} variant="cyan" className="w-full font-black tracking-[0.2em]">
              BROADCAST PROTOCOL
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Filter */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY PROTOCOL OR NAME"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all tracking-widest placeholder:text-gray-600 uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${statusFilter === status
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Pricing Table */}
      <GlassCard padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Protocol ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Manifest</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Valuation</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPrices.length > 0 ? (
                filteredPrices.map((price) => {
                  const isEditing = editingId === (price._id || price.id);
                  return (
                    <tr key={price._id || price.id} className="group hover:bg-white/[0.015] transition-colors">
                      <td className="px-8 py-6">
                        {isEditing ? (
                          <input
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500 w-24"
                            value={editingState?.testCode}
                            onChange={(e) => setEditingState({ ...editingState!, testCode: e.target.value.toUpperCase() })}
                          />
                        ) : (
                          <span className="text-xs font-black text-white font-mono tracking-tighter uppercase">{price.testCode}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {isEditing ? (
                          <input
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 w-full max-w-xs"
                            value={editingState?.testName}
                            onChange={(e) => setEditingState({ ...editingState!, testName: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-wide">{price.testName}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {isEditing ? (
                          <input
                            type="number"
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500 w-24"
                            value={editingState?.price}
                            onChange={(e) => setEditingState({ ...editingState!, price: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <div className="flex items-center text-cyan-400 font-black">
                            <span className="text-xs mr-0.5 opacity-50 font-sans">৳</span>
                            <span className="text-sm tracking-tighter font-mono">{(price.price || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <button
                          onClick={() => isEditing && setEditingState({ ...editingState!, active: !editingState!.active })}
                          className={`cursor-pointer transition-all ${!isEditing && 'pointer-events-none'}`}
                        >
                          <FuturisticBadge variant={(isEditing ? editingState!.active : price.active) ? 'cyan' : 'gray'}>
                            {((isEditing ? editingState!.active : price.active) ? 'Operational' : 'Decommissioned').toUpperCase()}
                          </FuturisticBadge>
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={handleSaveEdit} className="p-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(price)}
                            className="p-2 bg-white/5 text-gray-500 rounded-lg border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Database className="w-16 h-16 text-white/5 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">No diagnostic valuation records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
