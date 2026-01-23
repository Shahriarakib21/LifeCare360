'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import api, { handleApiError } from '@/lib/api';

export default function TopHeader() {
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setNotificationsLoading(true);
    try {
      const response = await api.get('/api/labs/requests/pending');
      const requests = response.data || [];

      const formattedNotifications = requests.map((request: any) => ({
        id: request._id || request.id,
        title: 'New Test Request',
        message: `Test request for ${request.testCodes?.join(', ') || 'lab test'} from ${request.patientId?.userId?.profile?.firstName || 'Patient'} ${request.patientId?.userId?.profile?.lastName || ''}`.trim(),
        date: new Date(request.createdAt || Date.now()),
        unread: true,
        link: '/lab/requests'
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.length);
    } catch (error) {
      handleApiError(error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const getLabName = () => {
    if (user?.profile) {
      const firstName = user.profile.firstName?.trim() || '';
      const lastName = user.profile.lastName?.trim() || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Lab Technician';
  };

  const getInitials = () => {
    const name = getLabName();
    return name.charAt(0).toUpperCase();
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      router.push(notification.link);
      setShowNotifications(false);
    }
  };

  const handleNotificationsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications((prev) => {
      if (!prev) {
        fetchNotifications();
      }
      return !prev;
    });
  };

  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <Input
            type="text"
            placeholder="Search requests, patients, tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={handleNotificationsToggle}
            className="relative p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50 max-h-96 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-secondary-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-secondary-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-error-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto max-h-80">
                {notificationsLoading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-secondary-500">Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-secondary-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-secondary-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-secondary-400 mt-1">
                              {notification.date.toLocaleDateString()} at {notification.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {notification.unread && (
                            <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                    <p className="text-sm font-medium text-secondary-500">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 p-2 hover:bg-secondary-50 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary-900">{getLabName()}</p>
              <p className="text-xs text-secondary-500">{user?.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-secondary-200">
                <p className="text-sm font-medium text-secondary-900">{getLabName()}</p>
                <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  router.push('/lab/settings');
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  router.push('/lab/settings');
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-secondary-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
