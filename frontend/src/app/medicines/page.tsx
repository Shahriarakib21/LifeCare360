'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Pill, Coins, Package, ShoppingCart, Trash2, ShieldCheck, CreditCard, MapPin, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

function MedicinesContent() {
  const searchParams = useSearchParams();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh'
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cash'>('cash');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch profile for shipping address
  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const res = await api.get('/api/patients/profile');
          const profile = res.data?.data?.patient;
          if (profile && profile.profile?.location) {
            const loc = profile.profile.location;
            setShippingAddress(prev => ({
              ...prev,
              street: loc.address || prev.street,
              city: loc.city || prev.city,
              state: loc.state || prev.state,
              country: loc.country || prev.country
            }));
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated]);

  const addToCart = (medicine: any) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item =>
          item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
    toast.success(`${medicine.name} added to cart`);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Simple validation
    if (!shippingAddress.street || !shippingAddress.city) {
      toast.error('Please provide a shipping address');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const payload = {
        medicines: cart.map(item => ({
          medicineId: item.id,
          quantity: item.quantity
        })),
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod
      };

      await api.post('/api/pharmacy/orders', payload);
      toast.success('Order placed successfully!');
      setCart([]);
      setCheckoutStep('success');
      // Redirect after a short delay
      setTimeout(() => {
        setIsCartOpen(false);
        setCheckoutStep('cart');
        router.push('/patient/dashboard');
      }, 3000);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Read search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams?.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const categories = [
    'All Categories',
    'Antibiotic',
    'Pain Reliever',
    'Antihistamine',
    'Antacid',
    'Vitamin',
    'Other',
  ];

  useEffect(() => {
    fetchMedicines();
  }, [searchQuery, category]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (category && category !== 'All Categories') params.append('category', category);

      const response = await api.get(`/api/public/medicines/search?${params.toString()}`);
      setMedicines(response.data.data.medicines);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Your Medicines
              </h1>
              <p className="text-xl text-primary-100">
                Search by name, generic name, or category
              </p>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="container-custom -mt-8 mb-12">
          <Card padding="lg" className="shadow-medium">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                />
              </div>
              <div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchMedicines} isLoading={loading}>
                Search
              </Button>
            </div>
          </Card>
        </section>

        {/* Results */}
        <section className="container-custom pb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              {medicines.length} Medicines Found
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine) => (
              <Card key={medicine.id} hover padding="lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Pill className="w-6 h-6 text-primary-600" />
                  </div>
                  {medicine.isPrescriptionRequired && (
                    <Badge variant="warning" size="sm">Rx Required</Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  {medicine.name}
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  {medicine.genericName}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-secondary-600">
                    <Package className="w-4 h-4 mr-2" />
                    {medicine.dosageForm} - {medicine.strength}
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <Coins className="w-4 h-4 mr-2" />
                    ৳{medicine.price}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMedicine(medicine)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addToCart(medicine)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {medicines.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-secondary-600">No medicines found. Try a different search.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 overflow-visible"
        >
          <ShoppingCart className="w-8 h-8" />
          <span className="absolute -top-2 -right-2 bg-error-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </motion.button>
      )}

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          if (checkoutStep === 'success') setCheckoutStep('cart');
        }}
        title={checkoutStep === 'cart' ? "Your Shopping Cart" : checkoutStep === 'checkout' ? "Checkout Details" : "Order Success!"}
        size="lg"
      >
        <div className="space-y-6">
          {cart.length === 0 && checkoutStep !== 'success' ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">Your cart is empty</p>
            </div>
          ) : checkoutStep === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">Order Confirmed!</h3>
              <p className="text-secondary-600 mb-6 font-medium">Thank you for your purchase. Your order is being processed.</p>
              <p className="text-sm text-secondary-500">Redirecting to your dashboard...</p>
            </div>
          ) : checkoutStep === 'cart' ? (
            <>
              <div className="divide-y divide-secondary-100 max-h-[400px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-secondary-900 truncate">{item.name}</h4>
                      <p className="text-xs text-secondary-500">{item.genericName} • {item.dosageForm} {item.strength}</p>
                      <p className="text-sm font-bold text-primary-600 mt-1">৳{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-secondary-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 hover:bg-secondary-50 text-secondary-600"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-secondary-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 hover:bg-secondary-50 text-secondary-600"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-secondary-400 hover:text-error-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-secondary-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-secondary-600 font-medium">Order Total</span>
                  <span className="text-2xl font-bold text-secondary-900">৳{calculateTotal()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 transition-all hover:border-primary-300">
                    <div className="flex items-center gap-2 text-secondary-900 font-semibold mb-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      Safe Delivery
                    </div>
                    <p className="text-xs text-secondary-500">Verified by our pharmacists.</p>
                  </div>
                  <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 transition-all hover:border-primary-300">
                    <div className="flex items-center gap-2 text-secondary-900 font-semibold mb-2">
                      <CreditCard className="w-4 h-4 text-primary-600" />
                      Secure Payment
                    </div>
                    <p className="text-xs text-secondary-500">Bank-grade security encryption.</p>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 h-12 text-lg shadow-lg shadow-primary-500/20"
                  onClick={() => setCheckoutStep('checkout')}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-secondary-50 p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-secondary-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600" /> Shipping Address
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Street Address"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    />
                    <Input
                      placeholder="State/Province"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Zip Code"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                    />
                    <Input
                      placeholder="Country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-secondary-50 p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-secondary-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-600" /> Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['card', 'paypal', 'cash'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 capitalize ${paymentMethod === method
                        ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-md'
                        : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
                        }`}
                    >
                      <span className="text-xs font-bold uppercase">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-600 rounded-xl text-white shadow-lg">
                <span className="font-medium">Total to Pay</span>
                <span className="text-2xl font-bold">৳{calculateTotal()}</span>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  className="flex-1 h-12"
                  onClick={() => setCheckoutStep('cart')}
                >
                  Back to Cart
                </Button>
                <Button
                  className="flex-[2] h-12 shadow-lg shadow-primary-500/20"
                  onClick={handleCheckout}
                  isLoading={isCheckoutLoading}
                >
                  Confirm Order
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        title={selectedMedicine?.name || 'Medicine Details'}
      >
        {selectedMedicine && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-2xl border border-primary-100">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Pill className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">{selectedMedicine.name}</h3>
                <p className="text-primary-600 font-medium">{selectedMedicine.genericName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary-50 rounded-xl border border-secondary-100">
                <span className="text-xs text-secondary-500 block mb-1 uppercase tracking-wider font-bold">Category</span>
                <span className="text-secondary-900 font-medium">{selectedMedicine.category}</span>
              </div>
              <div className="p-3 bg-secondary-50 rounded-xl border border-secondary-100">
                <span className="text-xs text-secondary-500 block mb-1 uppercase tracking-wider font-bold">Price</span>
                <span className="text-secondary-900 font-medium">৳{selectedMedicine.price}</span>
              </div>
              <div className="p-3 bg-secondary-50 rounded-xl border border-secondary-100">
                <span className="text-xs text-secondary-500 block mb-1 uppercase tracking-wider font-bold">Strength</span>
                <span className="text-secondary-900 font-medium">{selectedMedicine.strength}</span>
              </div>
              <div className="p-3 bg-secondary-50 rounded-xl border border-secondary-100">
                <span className="text-xs text-secondary-500 block mb-1 uppercase tracking-wider font-bold">Form</span>
                <span className="text-secondary-900 font-medium">{selectedMedicine.dosageForm}</span>
              </div>
            </div>

            {selectedMedicine.description && (
              <div>
                <h4 className="text-sm font-bold text-secondary-900 mb-2 uppercase tracking-wider">Description</h4>
                <p className="text-secondary-600 leading-relaxed text-sm">{selectedMedicine.description}</p>
              </div>
            )}

            <Button className="w-full h-12 mt-4" onClick={() => {
              addToCart(selectedMedicine);
              setSelectedMedicine(null);
            }}>
              Add to Cart
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function MedicinesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MedicinesContent />
    </Suspense>
  );
}

