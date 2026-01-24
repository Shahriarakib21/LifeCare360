import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    getDashboardStats,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getAnalytics,
    resetUserPassword,
    getPatients,
    getDoctors,
    getLabUsers,
    getPharmacyUsers,
    getUserActivityHistory,
    getSettings,
    updateSettings,
    getRevenueSummary,
    getRevenueAnalytics,
    getRevenueBreakdown,
    exportRevenueReport,
    getAdminLabRevenue,
    getAdminLabStats,
    getGlobalLabRevenue,
} from '../controllers/admin.controller';
import {
    getAppointmentReport,
    getSalesReport,
    getLabTestsReport,
    getUsersReport,
    getConsolidatedReport
} from '../controllers/reports.controller';
import {
    getAppointmentTrends,
    getMedicineSalesTrends,
    getUserActivityReport,
    getRoleBasedStats,
    getLabTestTrends,
    getActivityScatterData
} from '../controllers/analytics.controller';

const router = Router();

// Protect all routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard & Analytics
router.get('/analytics/global-lab-revenue', getGlobalLabRevenue);
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', toggleUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);
router.get('/users/:id/activity', getUserActivityHistory);

// Role-Based User Endpoints
router.get('/patients', getPatients);
router.get('/doctors', getDoctors);
router.get('/labs', getLabUsers);
router.get('/pharmacies', getPharmacyUsers);

// Reports Routes
router.get('/reports/appointments', getAppointmentReport);
router.get('/reports/sales', getSalesReport);
router.get('/reports/lab-tests', getLabTestsReport);
router.get('/reports/users', getUsersReport);
router.get('/reports/consolidated', getConsolidatedReport);

// Analytics Routes
router.get('/analytics/appointment-trends', getAppointmentTrends);
router.get('/analytics/sales-trends', getMedicineSalesTrends);
router.get('/analytics/user-activity', getUserActivityReport);
router.get('/analytics/role-stats', getRoleBasedStats);
router.get('/analytics/lab-trends', getLabTestTrends);
router.get('/analytics/activity-scatter', getActivityScatterData);
// Settings Routes
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// Revenue Routes
router.get('/revenue/summary', getRevenueSummary);
router.get('/revenue/analytics', getRevenueAnalytics);
router.get('/revenue/breakdown', getRevenueBreakdown);
router.get('/revenue/export', exportRevenueReport);
router.get('/labs/revenue', getAdminLabRevenue);
router.get('/labs/stats', getAdminLabStats);

export default router;
