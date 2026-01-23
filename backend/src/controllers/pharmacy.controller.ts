import { Request, Response, NextFunction } from 'express';
import Medicine from '../models/postgres/Medicine.model';
import Order from '../models/postgres/Order.model';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth.middleware';
import EHR from '../models/mongodb/EHR.model';
import User from '../models/mongodb/User.model';
import RefillRequest from '../models/mongodb/RefillRequest.model';
import { sequelize } from '../config/database';
import { getIO } from '../utils/socket';
import { notifyRefillUpdate, notifyOrderStatusUpdate } from '../utils/notifications';
import RevenueTransaction from '../models/mongodb/RevenueTransaction.model';
import UnifiedPayment from '../models/mongodb/UnifiedPayment.model';
import { logger } from '../utils/logger';

// Search medicines (public)
export const searchMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    const query: any = {
      isActive: true,
    };

    if (q) {
      query[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { genericName: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Medicine.findAndCountAll({
      where: query,
      limit: Number(limit),
      offset,
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        medicines: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get medicine details
export const getMedicineDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByPk(id);

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    res.json({
      success: true,
      data: { medicine },
    });
  } catch (error) {
    next(error);
  }
};

// Get alternative medicines
export const getAlternatives = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByPk(id);
    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    // Find alternatives by generic name or same category
    const alternatives = await Medicine.findAll({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          { genericName: medicine.genericName },
          { category: medicine.category },
        ],
        isActive: true,
      },
      limit: 10,
    });

    res.json({
      success: true,
      data: { alternatives },
    });
  } catch (error) {
    next(error);
  }
};

// Create order
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user!.id;
    const { medicines, shippingAddress, paymentMethod } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      throw new AppError('Medicines array is required', 400);
    }

    if (!shippingAddress) {
      throw new AppError('Shipping address is required', 400);
    }

    // Validate and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of medicines) {
      const medicine = await Medicine.findByPk(item.medicineId, { transaction });
      if (!medicine) {
        throw new AppError(`Medicine with ID ${item.medicineId} not found`, 404);
      }

      if (medicine.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${medicine.name}`, 400);
      }

      const itemTotal = Number(medicine.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        price: Number(medicine.price),
        name: medicine.name,
      });

      // Deduction: Update medicine stock
      await medicine.update(
        { stock: medicine.stock - item.quantity },
        { transaction }
      );
    }

    // Assign to a pharmacy user for revenue attribution
    const pharmacyUser = await User.findOne({ role: 'pharmacy', isActive: true });

    // Create order
    const order = await Order.create(
      {
        patientId: userId,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod: paymentMethod || 'card',
        status: 'pending',
        paymentStatus: 'pending',
        pharmacyUserId: pharmacyUser?._id.toString(),
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    // Unified Payment Integration
    try {
      const vatAmount = Math.round(totalAmount * 0.05);
      const serviceCharge = Math.round(totalAmount * 0.02);

      await UnifiedPayment.create({
        serviceType: 'pharmacy',
        serviceId: order.id.toString(),
        patientId: userId,
        providerId: pharmacyUser?._id,
        baseAmount: totalAmount,
        vatAmount,
        serviceCharge,
        totalAmount: totalAmount + vatAmount + serviceCharge,
        itemBreakdown: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        })),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          pharmacyName: 'Central Pharmacy',
          orderItems: orderItems
        }
      });
    } catch (payError) {
      console.error('Unified Payment Creation Error (pharmacyOrder):', payError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please proceed to payment.',
      data: { order },
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    next(error);
  }
};

// Get orders
export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};

    // If patient, only show their orders
    if (user.role === 'patient') {
      query.patientId = user.id;
    }
    // If pharmacy/admin, show all (or filter by patientId if provided in query?)
    // For now, show all.

    if (status) {
      query.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Order.findAndCountAll({
      where: query,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get refill notifications
export const getRefillNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const query: any = {};
    // If patient, only see own refills
    if (userRole === 'patient') {
      query.patientId = userId;
    }

    // Fetch refill requests from RefillRequest model
    // Sort by createdAt desc
    const refills = await RefillRequest.find(query)
      .populate('patientId', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Map to frontend interface
    const formattedRefills = refills.map((refill: any) => ({
      id: refill._id,
      patientName: refill.patientId ? `${refill.patientId.profile?.firstName} ${refill.patientId.profile?.lastName}` : 'Unknown',
      medication: refill.medication,
      prescriptionId: refill.prescriptionId,
      requestDate: refill.createdAt, // Using createdAt as request date
      lastFillDate: refill.lastFillDate || refill.createdAt,
      status: refill.status,
      quantity: refill.quantity,
      refillsRemaining: refill.refillsRemaining
    }));

    res.json({
      success: true,
      data: formattedRefills,
    });
  } catch (error) {
    next(error);
  }
};

// Update Refill Status
export const updateRefillStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'completed', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const refill = await RefillRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('patientId'); // Populate to get userId

    if (!refill) {
      res.status(404).json({ success: false, message: 'Refill request not found' });
      return;
    }

    // Notify patient
    if (getIO() && refill.patientId) {
      // patientId in Mongo is an object usually (from populate) or if not populated, an ID.
      // The schema says patientId ref 'User' ? No wait, Patient model ref 'User'.
      // RefillRequest.model probably refs 'Patient' or 'User'.
      // Note: Refill schema is likely patientId -> Patient model.

      // Let's assume patientId is populated. 
      // We need the USER ID for notification. 
      // If RefillRequest.patientId refers to User directly, we are good.
      // If it refers to Patient model, we need Patient.userId.

      // Checking getRefillNotifications (line 273): .populate('patientId', 'profile...') matches.
      // But wait line 280: refill.patientId.profile...
      // This implies patientId is a reference to a USER or a PATIENT with profile.

      // I'll assume patientId is a User for now given line 267 query.patientId = userId if role=patient.
      // Wait, if RefillRequest stored PATIENT ID (mongo ID), then line 267 `query.patientId = userId` would fail unless userId == patientId (which is not true usually).
      // So RefillRequest.patientId is likely a User ID.

      const targetUserId = (refill.patientId as any)._id || refill.patientId;
      if (getIO()) {
        await notifyRefillUpdate(getIO(), targetUserId, refill.medication, status);
      }
    }

    res.json({
      success: true,
      data: refill,
      message: 'Refill status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// -- Pharmacy Management Endpoints --

// Add new medicine
export const addMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Adding Medicine - Request Body:', req.body);

    // Clean price string (remove $ or other non-numeric chars except .)
    const cleanPrice = typeof req.body.price === 'string'
      ? req.body.price.replace(/[^0-9.]/g, '')
      : req.body.price;

    const medicineData = {
      ...req.body,
      genericName: req.body.genericName || req.body.generic || 'N/A',
      manufacturer: req.body.manufacturer || 'Generic Manufacturer',
      dosageForm: req.body.dosageForm || 'Tablet',
      strength: req.body.strength || '10mg',
      storageConditions: req.body.storageConditions || 'Store in a cool, dry place',
      category: req.body.category || 'General',
      price: parseFloat(cleanPrice) || 0,
      stock: parseInt(req.body.stock) || 0,
      // Ensure arrays are initialized if missing
      indications: req.body.indications || [],
      sideEffects: req.body.sideEffects || [],
      contraindications: req.body.contraindications || [],
      interactions: req.body.interactions || [],
      seoKeywords: req.body.seoKeywords || [],
      expiryDate: req.body.expiryDate || req.body.expiry,
    };

    console.log('Processed Medicine Data:', medicineData);

    const medicine = await Medicine.create(medicineData);
    res.status(201).json({
      success: true,
      data: { medicine },
    });
  } catch (error: any) {
    console.error('CRITICAL ERROR adding medicine:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add medicine',
      error: error.toString()
    });
  }
};

// Update medicine
export const updateMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      expiryDate: req.body.expiryDate || req.body.expiry
    };

    const [updated] = await Medicine.update(updateData, {
      where: { id },
      returning: true,
    });

    if (!updated) {
      throw new AppError('Medicine not found', 404);
    }

    const medicine = await Medicine.findByPk(id);

    res.json({
      success: true,
      data: { medicine },
    });
  } catch (error) {
    next(error);
  }
};

// Delete medicine (soft delete by setting isActive: false)
export const deleteMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByPk(id);

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    // Soft delete
    medicine.isActive = false;
    await medicine.save();

    res.json({
      success: true,
      message: 'Medicine deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    // Notify patient
    if (getIO()) {
      await notifyOrderStatusUpdate(getIO(), order.patientId.toString(), order.id.toString(), status || paymentStatus || 'updated');
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Get all prescriptions (from EHRs)
export const getAllPrescriptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Find all EHR records of type 'prescription'
    // Populate patient details from Patient model (User model in Mongo)
    const prescriptions = await EHR.find({ type: 'prescription' })
      .populate('patientId', 'name email profile')
      .populate('recordedBy', 'name')
      .sort({ date: -1 })
      .limit(50); // Limit for now

    res.json({
      success: true,
      data: { prescriptions },
    });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Total Sales (Revenue) - Sum of totalAmount from Orders
    // We can use Sequelize aggregate
    const totalSalesResult = await Order.sum('totalAmount', {
      where: {
        paymentStatus: 'paid' // Or just all orders? Usually paid.
      }
    });
    const totalSales = totalSalesResult || 0;

    // 2. Total Orders
    const totalOrders = await Order.count();

    // 3. Pending Orders
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    // 4. Low Stock Medicines (threshold < 20)
    const lowStockCount = await Medicine.count({
      where: {
        stock: { [Op.lt]: 20 },
        isActive: true
      }
    });

    // 5. Total Customers (Unique patientIds in Orders)
    // Actually, maybe just count all patients? Or patients with orders.
    // Let's count unique patientIds in Orders.
    const uniqueCustomers = await Order.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('patientId')), 'patientId']]
    });
    const totalCustomers = uniqueCustomers.length;

    res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        pendingOrders,
        lowStockItems: lowStockCount,
        newCustomers: totalCustomers, // Can refine this to "new this month"
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Customers
export const getCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all users with role 'patient' or finding those with orders
    // Since we don't have a direct link from SQL Order -> Mongo User easily in a single query,
    // we can fetch users from Mongo who are patients.
    const customers = await User.find({ role: 'patient' })
      .select('name email phone profile createdAt')
      .limit(50);

    res.json({
      success: true,
      data: { customers },
    });
  } catch (error) {
    next(error);
  }
};
// Pay for a pharmacy order (Simulated)
export const payOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    const { paymentMethod = 'card' } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.patientId !== userId) {
      throw new AppError('Unauthorized: This order does not belong to you', 403);
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order has already been paid', 400);
    }

    // SIMULATED PAYMENT PROCESSING
    const transactionId = `TXN-PHARM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    order.paymentStatus = 'paid';
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }
    await order.save();

    // Record Revenue Transaction
    try {
      await RevenueTransaction.create({
        type: 'pharmacy',
        amount: Number(order.totalAmount),
        currency: 'BDT',
        patientUserId: userId,
        providerUserId: order.pharmacyUserId || (await User.findOne({ role: 'pharmacy' }))?._id,
        serviceId: order.id.toString(),
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        status: 'completed',
        date: new Date(),
        metadata: {
          itemCount: order.items.length,
          items: order.items.map(i => i.name)
        }
      });
    } catch (revError) {
      logger.error('Failed to record pharmacy revenue transaction:', revError);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order,
        transactionId,
      }
    });
  } catch (error) {
    next(error);
  }
};
