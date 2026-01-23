'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Shield,
  Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Logo from '@/components/common/Logo';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user: propUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'doctors' | 'medicines' | 'labs'>('all');
  const [doctorResults, setDoctorResults] = useState<any[]>([]);
  const [medicineResults, setMedicineResults] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [doctorProfileImage, setDoctorProfileImage] = useState<string | null>(null);
  const hasFetchedProfile = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user: storeUser, isAuthenticated, clearAuth } = useAuthStore();

  // Fetch doctor profile image if user is a doctor (only once, memoized)
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (storeUser?.role === 'doctor' && storeUser?.id && !hasFetchedProfile.current) {
        hasFetchedProfile.current = true;
        try {
          const response = await api.get('/api/doctors/profile');
          const doctor = response.data?.data?.doctor;
          if (doctor?.profileImage) {
            setDoctorProfileImage(doctor.profileImage);
          }
        } catch (error) {
          // Silently fail - will use fallback avatar
          console.debug('Could not fetch doctor profile image:', error);
        }
      }
    };

    // Only fetch if we don't already have the image and haven't fetched before
    if (storeUser?.role === 'doctor' && !doctorProfileImage && !hasFetchedProfile.current) {
      fetchDoctorProfile();
    }

    // Reset fetch flag if user changes
    if (storeUser?.role !== 'doctor') {
      hasFetchedProfile.current = false;
    }
  }, [storeUser?.role, storeUser?.id]);

  // Memoize user object to prevent unnecessary re-renders
  const user = useMemo(() => {
    if (!storeUser) return propUser;
    // Priority: Profile name -> Top-level Name -> Top-level First/Last -> Email
    let displayName = storeUser.email;
    if (storeUser.profile?.firstName || storeUser.profile?.lastName) {
      displayName = `${storeUser.profile.firstName || ''} ${storeUser.profile.lastName || ''}`.trim();
    } else if (storeUser.name) {
      displayName = storeUser.name;
    } else if (storeUser.firstName || storeUser.lastName) {
      displayName = `${storeUser.firstName || ''} ${storeUser.lastName || ''}`.trim();
    }

    return {
      name: displayName,
      email: storeUser.email,
      role: storeUser.role,
      avatar: storeUser.role === 'doctor' && doctorProfileImage
        ? doctorProfileImage
        : storeUser.profile?.avatar,
    };
  }, [storeUser, doctorProfileImage, propUser]);

  const handleLogout = () => {
    clearAuth();
    if (onLogout) {
      onLogout();
    } else {
      router.push('/auth/login');
    }
  };

  const navigation = [
    { name: 'Home', href: '/', public: true, hideForRoles: ['doctor'] },
    { name: 'Find Doctors', href: '/doctors', public: true, hideForRoles: ['doctor'] },
    { name: 'Medicines', href: '/medicines', public: true, hideForRoles: ['doctor'] },
    { name: 'Labs', href: '/labs', public: true, hideForRoles: ['doctor'] },
    { name: 'Health Blog', href: '/blog', public: true, hideForRoles: ['doctor'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (user && item.hideForRoles && item.hideForRoles.includes(user.role)) {
      return false;
    }
    return true;
  });

  const userNavigation = user
    ? [
      { name: 'Dashboard', href: `/${user.role}/dashboard` },
      { name: user.role === 'doctor' ? 'Update Profile' : 'Profile', href: `/${user.role}/profile` },
      { name: 'Settings', href: `/${user.role}/settings` },
    ]
    : [];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  // Show user menu if authenticated (from store or prop)
  const showUserMenu = !!user;

  // Check if we're on the landing page
  const isLandingPage = pathname === '/';


  // Search functionality
  useEffect(() => {
    if (!isSearchOpen || !searchQuery.trim()) {
      setDoctorResults([]);
      setMedicineResults([]);
      setLabResults([]);
      setIsSearching(false); // Reset loading state when search is closed or empty
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchPromises: Promise<any>[] = [];

        // Search doctors if searchType is 'all' or 'doctors'
        if (searchType === 'all' || searchType === 'doctors') {
          const params = new URLSearchParams();
          // Backend now handles both specialization and name search
          params.append('specialization', searchQuery);
          searchPromises.push(
            api.get(`/api/public/doctors/search?${params.toString()}`)
              .then(res => ({ type: 'doctors', data: res.data?.data?.doctors || [] }))
              .catch(() => ({ type: 'doctors', data: [] }))
          );
        }

        // Search medicines if searchType is 'all' or 'medicines'
        if (searchType === 'all' || searchType === 'medicines') {
          const params = new URLSearchParams();
          params.append('q', searchQuery);
          searchPromises.push(
            api.get(`/api/public/medicines/search?${params.toString()}`)
              .then(res => ({ type: 'medicines', data: res.data.data.medicines || [] }))
              .catch(() => ({ type: 'medicines', data: [] }))
          );
        }

        // Search lab tests if searchType is 'all' or 'labs'
        if (searchType === 'all' || (searchType as string) === 'labs') {
          const params = new URLSearchParams();
          params.append('q', searchQuery);
          searchPromises.push(
            api.get(`/api/public/lab-tests/search?${params.toString()}`)
              .then(res => ({ type: 'labs', data: res.data.data.tests || [] }))
              .catch(() => ({ type: 'labs', data: [] }))
          );
        }

        const results = await Promise.all(searchPromises);
        results.forEach(result => {
          if (result.type === 'doctors') {
            setDoctorResults(result.data.slice(0, 5)); // Limit to 5 results
          } else if (result.type === 'medicines') {
            setMedicineResults(result.data.slice(0, 5)); // Limit to 5 results
          } else if (result.type === 'labs') {
            setLabResults(result.data.slice(0, 5)); // Limit to 5 results
          }
        });
      } catch (error) {
        console.error('Search error:', error);
        setDoctorResults([]);
        setMedicineResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search by 300ms

    return () => {
      clearTimeout(searchDebounce);
      setIsSearching(false); // Clear loading state on cleanup
    };
  }, [searchQuery, searchType, isSearchOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef) {
      searchInputRef.focus();
    }
  }, [isSearchOpen, searchInputRef]);

  // Define fetchNotifications function
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !storeUser) {
      return;
    }

    setNotificationsLoading(true);
    try {
      const response = await api.get('/api/notifications?limit=10');
      const { notifications: rawNotifications, unreadCount: count } = response.data?.data || {};

      const formattedNotifications = (rawNotifications || []).map((n: any) => {
        let link = '';
        // Determine link based on type and user role
        if (n.type === 'appointment_booked' || n.type === 'appointment_cancelled') {
          if (storeUser.role === 'patient') link = '/patient/appointments';
          else if (storeUser.role === 'doctor') link = '/doctor/appointments';
        } else if (n.type === 'lab_request') {
          if (storeUser.role === 'lab') link = '/lab/dashboard';
        } else if (n.type === 'lab_result' || n.type === 'result_uploaded') {
          if (storeUser.role === 'patient') link = '/patient/reports';
        } else if (n.type === 'prescription' || n.type === 'prescription_created') {
          if (storeUser.role === 'patient') link = '/patient/prescriptions';
        }

        return {
          id: n._id,
          title: n.title,
          message: n.message,
          date: new Date(n.createdAt),
          read: n.read,
          type: n.type,
          link,
          unread: !n.read
        };
      });

      setNotifications(formattedNotifications);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated, storeUser]);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (isAuthenticated && storeUser) {
      fetchNotifications();
      // Refresh notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);

      // Socket connection
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket connected (Header)');
      });

      socket.on('notification', (n: any) => {
        // Format the new notification
        let link = '';
        // Determine link based on type and user role
        if (n.type === 'appointment_booked' || n.type === 'appointment_cancelled') {
          if (storeUser.role === 'patient') link = '/patient/appointments';
          else if (storeUser.role === 'doctor') link = '/doctor/appointments';
        } else if (n.type === 'lab_request') {
          if (storeUser.role === 'lab') link = '/lab/dashboard';
        } else if (n.type === 'lab_result' || n.type === 'result_uploaded') {
          if (storeUser.role === 'patient') link = '/patient/reports';
        } else if (n.type === 'prescription' || n.type === 'prescription_created') {
          if (storeUser.role === 'patient') link = '/patient/prescriptions';
        }

        const formatted = {
          id: n._id,
          title: n.title,
          message: n.message,
          date: new Date(n.createdAt),
          read: false,
          type: n.type,
          link,
          unread: true
        };

        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(n.title);
      });

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [isAuthenticated, storeUser?.role, storeUser?.id, fetchNotifications]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (notification.unread) {
      try {
        await api.put(`/api/notifications/${notification.id}/read`);
        // Update local state
        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, unread: false, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.link) {
      router.push(notification.link);
      setIsNotificationsOpen(false);
    }
  };

  const handleNotificationsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotificationsOpen((prev) => {
      if (!prev) {
        fetchNotifications();
      }
      return !prev;
    });
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setDoctorResults([]);
    setMedicineResults([]);
    setLabResults([]);
  }, []);

  const handleNavigateToDoctors = () => {
    router.push(`/doctors?search=${encodeURIComponent(searchQuery)}`);
    handleSearchClose();
  };

  const handleNavigateToMedicines = () => {
    router.push(`/medicines?search=${encodeURIComponent(searchQuery)}`);
    handleSearchClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClose();
    } else if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchType === 'doctors' || (searchType === 'all' && doctorResults.length > 0)) {
        handleNavigateToDoctors();
      } else if (searchType === 'medicines' || (searchType === 'all' && medicineResults.length > 0)) {
        handleNavigateToMedicines();
      }
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    if (isSearchOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.search-container')) {
          handleSearchClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen, handleSearchClose]);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 overflow-visible ${isLandingPage ? 'bg-white/80 backdrop-blur-md border-b border-secondary-200/50 shadow-sm' : 'bg-white/95 backdrop-blur-sm border-b border-secondary-200 shadow-sm'}`}>
      <nav className={`container-custom ${isLandingPage ? 'py-4' : ''} overflow-visible`}>
        <div className="flex items-center justify-between h-16 gap-4 overflow-visible">
          {/* Logo - Minimizes when search is open */}
          <motion.div
            animate={{
              scale: isSearchOpen ? 0.8 : 1,
              opacity: isSearchOpen ? 0.6 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex items-center flex-shrink-0"
          >
            <Logo />
          </motion.div>

          {/* Desktop Navigation - Minimizes when search is open */}
          <motion.div
            animate={{
              scale: isSearchOpen ? 0.85 : 1,
              opacity: isSearchOpen ? 0.5 : 1,
              x: isSearchOpen ? -20 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`hidden md:flex items-center space-x-1 flex-1 justify-center ${isSearchOpen ? 'overflow-hidden pointer-events-none' : ''}`}
          >
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center h-9',
                  isActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </motion.div>

          {/* Inline Search Bar - Expands when active */}
          <div className="relative flex items-center search-container flex-shrink-0">
            {!isSearchOpen && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSearchClick}
                className="p-2 rounded-lg transition-all duration-200 text-secondary-600 hover:text-primary-600 hover:bg-secondary-100 flex-shrink-0"
                aria-label="Search"
                type="button"
              >
                <Search className="w-5 h-5" />
              </motion.button>
            )}
            <motion.div
              animate={{
                width: isSearchOpen ? 400 : 0,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative flex items-center flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              style={{
                overflow: isSearchOpen ? 'visible' : 'hidden',
                minWidth: isSearchOpen ? 400 : 0
              }}
            >
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full relative"
                  style={{ minWidth: 400, width: '100%' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative group">
                      <input
                        ref={(el) => setSearchInputRef(el)}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search doctors or medicines..."
                        className="w-full pl-3 pr-10 py-2 border-2 border-primary-300 rounded-lg bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 placeholder:text-secondary-400 text-xs font-medium shadow-md"
                        autoFocus
                      />
                      {searchQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                          type="button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSearchClose}
                      className="p-2.5 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl transition-all duration-200 flex-shrink-0"
                      aria-label="Close search"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Search Type Tabs */}
                  {searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center space-x-2 mt-2"
                    >
                      {(['all', 'doctors', 'medicines', 'labs'] as const).map((type, index) => (
                        <motion.button
                          key={type}
                          onClick={() => setSearchType(type)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden ${searchType === type
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                            : 'text-secondary-600 hover:bg-secondary-100/80 hover:text-secondary-900 bg-white/80'
                            }`}
                          type="button"
                        >
                          {searchType === type && (
                            <motion.div
                              layoutId="activeSearchTab"
                              className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 capitalize">{type === 'all' ? 'All' : type}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {searchQuery.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-secondary-200/50 max-h-96 overflow-y-auto z-[60]"
                      >
                        {isSearching ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="inline-block w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full mb-2"
                            />
                            <p className="text-secondary-600 text-sm font-medium">Searching...</p>
                          </motion.div>
                        ) : (
                          <>
                            {/* Doctor Results */}
                            {(searchType === 'all' || searchType === 'doctors') && doctorResults.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 border-b border-secondary-200/50"
                              >
                                <h3 className="text-xs font-bold text-secondary-800 mb-3 flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-primary-600" />
                                  Doctors ({doctorResults.length})
                                </h3>
                                <div className="space-y-1.5">
                                  {doctorResults.map((doctor, index) => (
                                    <motion.button
                                      key={doctor.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.15 + index * 0.03 }}
                                      whileHover={{ scale: 1.02, x: 4 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        router.push(`/doctors?id=${doctor.id}`);
                                        handleSearchClose();
                                      }}
                                      className="w-full text-left p-3 rounded-lg hover:bg-primary-50/50 hover:shadow-sm border border-transparent hover:border-primary-200/50 transition-all duration-200 group"
                                      type="button"
                                    >
                                      <p className="font-semibold text-sm text-secondary-900 group-hover:text-primary-700 transition-colors">
                                        {doctor.name || `Dr. ${doctor.specialization}`}
                                      </p>
                                      <p className="text-xs text-secondary-600 mt-0.5">{doctor.specialization}</p>
                                    </motion.button>
                                  ))}
                                  {doctorResults.length >= 5 && (
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 + doctorResults.length * 0.03 }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={handleNavigateToDoctors}
                                      className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100/50 hover:from-primary-100 hover:to-primary-200 text-primary-700 font-semibold text-xs transition-all duration-200 border border-primary-200/50 hover:border-primary-300 hover:shadow-sm"
                                      type="button"
                                    >
                                      View all doctors results →
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* Medicine Results */}
                            {(searchType === 'all' || searchType === 'medicines') && medicineResults.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4"
                              >
                                <h3 className="text-xs font-bold text-secondary-800 mb-3 flex items-center gap-2">
                                  <Pill className="w-3.5 h-3.5 text-green-600" />
                                  Medicines ({medicineResults.length})
                                </h3>
                                <div className="space-y-1.5">
                                  {medicineResults.map((medicine, index) => (
                                    <motion.button
                                      key={medicine.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.15 + index * 0.03 }}
                                      whileHover={{ scale: 1.02, x: 4 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        router.push(`/medicines?search=${encodeURIComponent(searchQuery)}`);
                                        handleSearchClose();
                                      }}
                                      className="w-full text-left p-3 rounded-lg hover:bg-green-50/50 hover:shadow-sm border border-transparent hover:border-green-200/50 transition-all duration-200 group"
                                      type="button"
                                    >
                                      <p className="font-semibold text-sm text-secondary-900 group-hover:text-green-700 transition-colors">
                                        {medicine.name}
                                      </p>
                                      {medicine.genericName && (
                                        <p className="text-xs text-secondary-600 mt-0.5">{medicine.genericName}</p>
                                      )}
                                    </motion.button>
                                  ))}
                                  {medicineResults.length >= 5 && (
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 + medicineResults.length * 0.03 }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={handleNavigateToMedicines}
                                      className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200 text-green-700 font-semibold text-xs transition-all duration-200 border border-green-200/50 hover:border-green-300 hover:shadow-sm"
                                      type="button"
                                    >
                                      View all medicine results →
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* Lab Results */}
                            {(searchType === 'all' || searchType === 'labs') && labResults.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 border-b border-secondary-200/50"
                              >
                                <h3 className="text-xs font-bold text-secondary-800 mb-3 flex items-center gap-2">
                                  <FlaskConical className="w-3.5 h-3.5 text-primary-600" />
                                  Lab Tests ({labResults.length})
                                </h3>
                                <div className="space-y-1.5">
                                  {labResults.map((test, index) => (
                                    <motion.button
                                      key={test._id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.15 + index * 0.03 }}
                                      whileHover={{ scale: 1.02, x: 4 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        router.push(`/labs/${test.labId}?test=${test._id}`);
                                        handleSearchClose();
                                      }}
                                      className="w-full text-left p-3 rounded-lg hover:bg-primary-50/50 hover:shadow-sm border border-transparent hover:border-primary-200/50 transition-all duration-200 group"
                                      type="button"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold text-sm text-secondary-900 group-hover:text-primary-700 transition-colors">
                                            {test.testName}
                                          </p>
                                          <p className="text-xs text-secondary-600 mt-0.5">{test.testCode}</p>
                                        </div>
                                        <p className="text-sm font-bold text-primary-600">৳{test.price}</p>
                                      </div>
                                    </motion.button>
                                  ))}
                                  {labResults.length >= 5 && (
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 + labResults.length * 0.03 }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        router.push(`/lab-tests/search?q=${encodeURIComponent(searchQuery)}`);
                                        handleSearchClose();
                                      }}
                                      className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100/50 hover:from-primary-100 hover:to-primary-200 text-primary-700 font-semibold text-xs transition-all duration-200 border border-primary-200/50 hover:border-primary-300 hover:shadow-sm"
                                      type="button"
                                    >
                                      View all lab results →
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* No Results */}
                            {!isSearching && searchQuery.trim() &&
                              ((searchType === 'all' && doctorResults.length === 0 && medicineResults.length === 0 && labResults.length === 0) ||
                                (searchType === 'doctors' && doctorResults.length === 0) ||
                                (searchType === 'medicines' && medicineResults.length === 0) ||
                                (searchType === 'labs' && labResults.length === 0)) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-8 text-center"
                                >
                                  <Search className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                                  <p className="text-secondary-700 font-medium text-sm mb-1">No results found</p>
                                  <p className="text-xs text-secondary-500">Try a different search term</p>
                                </motion.div>
                              )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right Side Actions - Minimizes when search is open */}
          <motion.div
            animate={{
              scale: isSearchOpen ? 0.8 : 1,
              opacity: isSearchOpen ? 0.5 : 1,
              x: isSearchOpen ? -20 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`flex items-center space-x-3 flex-shrink-0 ${isSearchOpen ? 'pointer-events-none' : ''}`}
          >

            {showUserMenu ? (
              <>
                {/* Notifications */}
                <div className="relative flex items-center overflow-visible" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNotificationsToggle(e);
                    }}
                    className="relative p-2 text-secondary-600 hover:text-primary-600 hover:bg-secondary-100 rounded-lg transition-colors flex items-center justify-center"
                    aria-label="Notifications"
                    type="button"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"
                      />
                    )}
                  </motion.button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-secondary-200 z-[60] max-h-96 overflow-hidden flex flex-col"
                        style={{
                          transformOrigin: 'top right',
                        }}
                      >
                        <div className="px-4 py-3 border-b border-secondary-200 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-secondary-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <Badge variant="error" size="sm">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {notificationsLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
                              <p className="text-sm text-secondary-500">Loading notifications...</p>
                            </div>
                          ) : notifications.length > 0 ? (
                            <div className="divide-y divide-secondary-200">
                              {notifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  onClick={() => handleNotificationClick(notification)}
                                  className="w-full text-left p-4 hover:bg-secondary-50 transition-colors"
                                  type="button"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-secondary-900 mb-1">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-secondary-600 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-secondary-500 mt-1">
                                        {new Date(notification.date).toLocaleDateString()} at {new Date(notification.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    {notification.unread && (
                                      <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                              <Bell className="w-12 h-12 mb-4 text-secondary-300" />
                              <p className="text-sm font-medium text-secondary-500">No notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                    aria-label="User menu"
                    type="button"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${user.avatar}`}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.avatar-fallback');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center avatar-fallback ${user?.avatar ? 'hidden' : ''}`}>
                      <span className="text-primary-700 text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-20"
                      >
                        <div className="px-4 py-3 border-b border-secondary-200">
                          <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                          <p className="text-xs text-secondary-500">{user?.email}</p>
                          <Badge variant="primary" size="sm" className="mt-2">
                            {user?.role}
                          </Badge>
                        </div>
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                          type="button"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" type="button">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" type="button">Get Started</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-2 rounded-lg transition-colors text-secondary-600 hover:text-primary-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              type="button"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </motion.div >
        </div >

        {/* Mobile Menu */}
        {
          isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-secondary-200"
            >
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )
        }
      </nav >

      {/* Search Modal */}
      {
        isSearchOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleSearchClose}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
            >
              <div className="bg-white rounded-xl shadow-2xl border border-secondary-200 overflow-hidden">
                {/* Search Input */}
                <div className="p-4 border-b border-secondary-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        ref={(el) => setSearchInputRef(el)}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search doctors or medicines..."
                        className="w-full pl-10 pr-4 py-3 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSearchClose}
                      className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
                      aria-label="Close search"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search Type Tabs */}
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={() => setSearchType('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchType === 'all'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100'
                        }`}
                      type="button"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSearchType('doctors')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchType === 'doctors'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100'
                        }`}
                      type="button"
                    >
                      Doctors
                    </button>
                    <button
                      onClick={() => setSearchType('medicines')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchType === 'medicines'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100'
                        }`}
                      type="button"
                    >
                      Medicines
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                  {isSearching && (
                    <div className="p-8 text-center text-secondary-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-2"></div>
                      <p>Searching...</p>
                    </div>
                  )}

                  {!isSearching && searchQuery.trim() && (
                    <>
                      {/* Doctor Results */}
                      {(searchType === 'all' || searchType === 'doctors') && doctorResults.length > 0 && (
                        <div className="p-4 border-b border-secondary-200">
                          <h3 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Doctors ({doctorResults.length})
                          </h3>
                          <div className="space-y-2">
                            {doctorResults.map((doctor) => (
                              <button
                                key={doctor.id}
                                onClick={() => {
                                  router.push(`/doctors?search=${encodeURIComponent(searchQuery)}`);
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                                type="button"
                              >
                                <p className="font-medium text-secondary-900">{doctor.name || `Dr. ${doctor.specialization}`}</p>
                                <p className="text-sm text-secondary-600">{doctor.specialization}</p>
                              </button>
                            ))}
                            {doctorResults.length >= 5 && (
                              <button
                                onClick={handleNavigateToDoctors}
                                className="w-full text-left p-3 rounded-lg hover:bg-primary-50 text-primary-600 font-medium transition-colors"
                                type="button"
                              >
                                View all doctors results →
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Medicine Results */}
                      {(searchType === 'all' || searchType === 'medicines') && medicineResults.length > 0 && (
                        <div className="p-4">
                          <h3 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center">
                            <Pill className="w-4 h-4 mr-2" />
                            Medicines ({medicineResults.length})
                          </h3>
                          <div className="space-y-2">
                            {medicineResults.map((medicine) => (
                              <button
                                key={medicine.id}
                                onClick={() => {
                                  router.push(`/medicines?search=${encodeURIComponent(searchQuery)}`);
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                                type="button"
                              >
                                <p className="font-medium text-secondary-900">{medicine.name}</p>
                                {medicine.genericName && (
                                  <p className="text-sm text-secondary-600">{medicine.genericName}</p>
                                )}
                              </button>
                            ))}
                            {medicineResults.length >= 5 && (
                              <button
                                onClick={handleNavigateToMedicines}
                                className="w-full text-left p-3 rounded-lg hover:bg-primary-50 text-primary-600 font-medium transition-colors"
                                type="button"
                              >
                                View all medicine results →
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* No Results */}
                      {!isSearching && searchQuery.trim() &&
                        ((searchType === 'all' && doctorResults.length === 0 && medicineResults.length === 0) ||
                          (searchType === 'doctors' && doctorResults.length === 0) ||
                          (searchType === 'medicines' && medicineResults.length === 0)) && (
                          <div className="p-8 text-center text-secondary-500">
                            <p>No results found for "{searchQuery}"</p>
                            <p className="text-sm mt-2">Try a different search term</p>
                          </div>
                        )}
                    </>
                  )}

                  {!isSearching && !searchQuery.trim() && (
                    <div className="p-8 text-center text-secondary-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                      <p>Start typing to search for doctors or medicines</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )
      }
    </header >
  );
};

export default Header;

