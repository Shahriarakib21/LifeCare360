'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Plus, Search, Filter, X, CreditCard, Coins, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface Appointment {
    id: string;
    doctorId: string;
    doctorName?: string;
    doctorSpecialty?: string;
    date: string;
    time: string;
    type: 'video' | 'in-person';
    status: 'scheduled' | 'completed' | 'cancelled';
    reason?: string;
    meetingLink?: string;
    location?: string;
    visitFee?: number;
    vatAmount?: number;
    serviceCharge?: number;
    feeStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'waived';
    feeCurrency?: string;
    paymentDeadline?: string;
    isRated?: boolean;
}



export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBookModal, setShowBookModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        doctorId: '',
        date: '',
        time: '',
        type: 'video',
        reason: '',
    });
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const [ratingLoading, setRatingLoading] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();

        // Check for payment query param
        const urlParams = new URLSearchParams(window.location.search);
        const payId = urlParams.get('pay');
        if (payId) {
            handlePayFee(payId);
            // Clear param
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/api/patients/appointments');
            setAppointments(res.data.data.appointments || []);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            // toast.error('Failed to load appointments'); 
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            // Use the public search endpoint to get list of doctors
            const res = await api.get('/api/public/doctors/search?limit=50');
            const apiDoctors = res.data.data.doctors || [];

            setDoctors(apiDoctors);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            setDoctors([]);
            toast.error('Failed to load doctors list');
        }
    };



    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingLoading(true);
        try {
            await api.post('/api/patients/appointments', bookingData);
            toast.success('Appointment booked successfully!');
            setShowBookModal(false);
            setBookingData({ doctorId: '', date: '', time: '', type: 'video', reason: '' });
            fetchAppointments();
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancelAppointment = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await api.put(`/api/patients/appointments/${id}/cancel`);
            toast.success('Appointment cancelled');
            fetchAppointments();
        } catch (error: any) {
            toast.error(handleApiError(error));
        }
    };

    const handlePayFee = async (id: string) => {
        setPaymentLoading(true);
        try {
            // First initiate to get breakdown
            const res = await api.post(`/api/patients/appointments/${id}/initiate-payment`);
            setPaymentDetails(res.data.data);
            setSelectedAppointment(appointments.find(a => a.id === id) || null);
            setShowPaymentModal(true);
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedAppointment) return;
        setPaymentLoading(true);
        try {
            await api.post(`/api/patients/appointments/${selectedAppointment.id}/pay`, {
                paymentMethod: selectedPaymentMethod
            });
            toast.success('Payment successful and appointment confirmed!');
            setShowPaymentModal(false);
            fetchAppointments();
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleRateDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppointment) return;

        setRatingLoading(true);
        try {
            await api.post(`/api/patients/appointments/${selectedAppointment.id}/rate`, {
                rating,
                comment: ratingComment
            });
            toast.success('Rating submitted successfully!');
            setShowRatingModal(false);
            setRating(5);
            setRatingComment('');
            fetchAppointments();
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setRatingLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const isPast = new Date(`${apt.date}T${apt.time}`) < new Date();
        const tabMatch = activeTab === 'upcoming' ? !isPast && apt.status !== 'cancelled' : isPast || apt.status === 'cancelled';
        const searchMatch = apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.doctorSpecialty?.toLowerCase().includes(searchQuery.toLowerCase());
        return tabMatch && searchMatch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
                    <p className="text-slate-500">Manage your scheduled visits and consultations</p>
                </div>
                <Button onClick={() => setShowBookModal(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" /> Book New
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'past' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Past & Cancelled
                    </button>
                </div>

                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search doctor or specialty..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </Card>

            {/* Appointments List */}
            {loading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">No appointments found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-1">You don't have any {activeTab} appointments. Book a new consultation with our specialists.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAppointments.map((apt) => (
                        <Card key={apt.id} className="p-5 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                            {/* Date Box */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-full md:w-24 bg-teal-50 rounded-2xl p-4 border border-teal-100/50">
                                <span className="text-xs font-bold text-teal-600 uppercase">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-2xl font-bold text-teal-800 my-1">{new Date(apt.date).getDate()}</span>
                                <span className="text-xs text-teal-600">{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{apt.doctorName || 'Unknown Doctor'}</h3>
                                        <p className="text-slate-500 font-medium">{apt.doctorSpecialty || 'General Physician'}</p>
                                    </div>
                                    <Badge variant={apt.status === 'scheduled' ? 'success' : apt.status === 'cancelled' ? 'error' : 'secondary'}>
                                        {apt.status}
                                    </Badge>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-teal-500" />
                                        {apt.time}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {apt.type === 'video' ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-rose-500" />}
                                        {apt.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                                    </div>
                                    {apt.visitFee && (
                                        <div className="flex items-center gap-1.5">
                                            <Coins className="w-4 h-4 text-emerald-500" />
                                            <span className="font-bold text-slate-900">৳{apt.visitFee} {apt.feeCurrency}</span>
                                            <Badge variant={apt.feeStatus === 'paid' ? 'success' : 'warning'} size="sm">
                                                {apt.feeStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                {apt.status === 'scheduled' && (
                                    <>
                                        {apt.type === 'video' && apt.meetingLink && (
                                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                Join Call
                                            </Button>
                                        )}
                                        {apt.visitFee && apt.feeStatus !== 'paid' && (
                                            <Button
                                                size="sm"
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handlePayFee(apt.id)}
                                                isLoading={bookingLoading}
                                            >
                                                <CreditCard className="w-4 h-4 mr-2" />
                                                Pay ৳{apt.visitFee} {apt.feeCurrency}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200"
                                            onClick={() => handleCancelAppointment(apt.id)}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                                {apt.status === 'completed' && (
                                    <div className="flex flex-col gap-2">
                                        <Button variant="secondary" size="sm" className="w-full bg-white border border-slate-200">View Summary</Button>
                                        {!apt.isRated ? (
                                            <Button
                                                size="sm"
                                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                                onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setShowRatingModal(true);
                                                }}
                                            >
                                                <Star className="w-4 h-4 mr-2" />
                                                Rate Doctor
                                            </Button>
                                        ) : (
                                            <Badge variant="success" className="w-full py-2 justify-center">
                                                <Star className="w-3 h-3 mr-1 fill-current" />
                                                Rated
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Book Appointment Modal */}
            <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Book New Appointment">
                <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Specialty</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 mb-4"
                            value={selectedSpecialty}
                            onChange={(e) => {
                                setSelectedSpecialty(e.target.value);
                                setBookingData(prev => ({ ...prev, doctorId: '' })); // Reset doctor selection
                            }}
                        >
                            <option value="">All Specialties</option>
                            {Array.from(new Set(doctors.map(d => d.specialization))).sort().map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </select>

                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={bookingData.doctorId}
                            onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                            required
                        >
                            <option value="">
                                {selectedSpecialty ? `Choose a ${selectedSpecialty}...` : 'Choose a doctor...'}
                            </option>
                            {doctors
                                .filter(doc => !selectedSpecialty || doc.specialization === selectedSpecialty)
                                .map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.name || `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`} - {doc.specialization}
                                        {doc.diseases ? ` (${doc.diseases})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <Input
                                type="date"
                                value={bookingData.date}
                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <Input
                                type="time"
                                value={bookingData.time}
                                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-slate-50 flex-1">
                                <input
                                    type="radio"
                                    name="type"
                                    value="video"
                                    checked={bookingData.type === 'video'}
                                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value as 'video' | 'in-person' })}
                                    className="text-teal-600 focus:ring-teal-500"
                                />
                                <span className="flex items-center gap-2 text-sm font-medium"><Video className="w-4 h-4 text-blue-500" /> Video</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-slate-50 flex-1">
                                <input
                                    type="radio"
                                    name="type"
                                    value="in-person"
                                    checked={bookingData.type === 'in-person'}
                                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value as 'video' | 'in-person' })}
                                    className="text-teal-600 focus:ring-teal-500"
                                />
                                <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4 text-rose-500" /> In-Person</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[100px]"
                            placeholder="Describe your symptoms..."
                            value={bookingData.reason}
                            onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" isLoading={bookingLoading}>
                            Confirm Booking
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Rating Modal */}
            <Modal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                title="Rate Your Consultation"
            >
                <form onSubmit={handleRateDoctor} className="space-y-6 pt-2">
                    <div className="text-center">
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setRating(s)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-10 h-10 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-slate-600 font-medium">
                            {rating === 5 && "Excellent! 🌟"}
                            {rating === 4 && "Very Good! ✨"}
                            {rating === 3 && "Good 👍"}
                            {rating === 2 && "Could be better 😕"}
                            {rating === 1 && "Poor 😞"}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Share your experience (optional)</label>
                        <textarea
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[120px] transition-all"
                            placeholder="How was your consultation experience?"
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => setShowRatingModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                            isLoading={ratingLoading}
                        >
                            Submit Rating
                        </Button>
                    </div>
                </form>
            </Modal>
            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Complete Appointment Payment"
            >
                {paymentDetails && (
                    <div className="space-y-6 pt-2">
                        {/* Summary Card */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Payment Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Consultation Fee</span>
                                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                                        <Coins className="w-4 h-4 text-slate-400" />
                                        ৳{paymentDetails.fee}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>VAT (5%)</span>
                                    <span className="font-semibold text-slate-900">৳{paymentDetails.vat}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Service Charge (2%)</span>
                                    <span className="font-semibold text-slate-900">৳{paymentDetails.serviceCharge}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Total Amount</span>
                                    <span className="text-xl font-bold text-teal-600">৳{paymentDetails.total} {paymentDetails.currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Deadline */}
                        {paymentDetails.paymentDeadline && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 text-orange-700 rounded-xl text-sm border border-orange-100">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <span>Please complete the payment by <strong>{new Date(paymentDetails.paymentDeadline).toLocaleTimeString()}</strong> to confirm your slot.</span>
                            </div>
                        )}

                        {/* Payment Options */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Select Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedPaymentMethod('bkash')}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${selectedPaymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-sm mb-1">
                                        <img src="https://logos-world.net/wp-content/uploads/2022/07/BKash-Logo.png" alt="bKash" className="w-full h-auto" />
                                    </div>
                                    <span className={`text-sm font-bold ${selectedPaymentMethod === 'bkash' ? 'text-pink-600' : 'text-slate-600'}`}>bKash</span>
                                    {selectedPaymentMethod === 'bkash' && (
                                        <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full p-0.5 shadow-md">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setSelectedPaymentMethod('nagad')}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${selectedPaymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-sm mb-1">
                                        <img src="https://freepnglogo.com/images/all_img/1701523491nagad-logo-png.png" alt="Nagad" className="w-full h-auto p-2" />
                                    </div>
                                    <span className={`text-sm font-bold ${selectedPaymentMethod === 'nagad' ? 'text-orange-600' : 'text-slate-600'}`}>Nagad</span>
                                    {selectedPaymentMethod === 'nagad' && (
                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-0.5 shadow-md">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 text-slate-500 border border-slate-200 rounded-xl"
                                onClick={() => setShowPaymentModal(false)}
                                disabled={paymentLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 shadow-lg hover:shadow-teal-500/20"
                                onClick={handleConfirmPayment}
                                isLoading={paymentLoading}
                            >
                                Pay Now ৳{paymentDetails.total}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
