import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface OrderAttributes {
  id: number;
  patientId: string; // MongoDB Patient ID
  items: Array<{
    medicineId: number;
    quantity: number;
    price: number;
    name: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'card' | 'paypal' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  pharmacyUserId?: string; // MongoDB User ID of the pharmacy
  trackingNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt' | 'pharmacyUserId'> { }

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public patientId!: string;
  public items!: Array<{
    medicineId: number;
    quantity: number;
    price: number;
    name: string;
  }>;
  public totalAmount!: number;
  public status!: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public shippingAddress!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  public paymentMethod!: 'card' | 'paypal' | 'cash';
  public paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';
  public pharmacyUserId?: string;
  public trackingNumber?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'paypal', 'cash'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    pharmacyUserId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    indexes: [
      { fields: ['patientId'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Order;

