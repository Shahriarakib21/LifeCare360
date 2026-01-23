import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface AppointmentAttributes {
  id: number;
  patientId: string; // MongoDB Patient ID
  doctorId: number; // PostgreSQL Doctor ID
  date: Date;
  time: string; // 'HH:mm' format
  type: 'in-person' | 'video' | 'phone';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  duration: number; // minutes
  notes?: string;
  meetingLink?: string; // For video consultations
  visitFee?: number; // Amount in local currency
  vatAmount?: number;
  serviceCharge?: number;
  feeStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'waived'; // Payment status
  feeCurrency?: string; // Currency code (e.g., 'BDT', 'USD')
  feeRecordedAt?: Date; // When fee was recorded
  feeRecordedBy?: string; // MongoDB User ID of doctor who recorded fee
  paymentDeadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> { }

class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
  public id!: number;
  public patientId!: string;
  public doctorId!: number;
  public date!: Date;
  public time!: string;
  public type!: 'in-person' | 'video' | 'phone';
  public status!: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  public duration!: number;
  public notes?: string;
  public meetingLink?: string;
  public visitFee?: number;
  public vatAmount?: number;
  public serviceCharge?: number;
  public feeStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'waived';
  public feeCurrency?: string;
  public feeRecordedAt?: Date;
  public feeRecordedBy?: string;
  public paymentDeadline?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Appointment.init(
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
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('in-person', 'video', 'phone'),
      allowNull: false,
      defaultValue: 'in-person',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30, // 30 minutes default
    },
    notes: {
      type: DataTypes.TEXT,
    },
    meetingLink: {
      type: DataTypes.STRING,
    },
    visitFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    vatAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    serviceCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    feeStatus: {
      type: DataTypes.ENUM('unpaid', 'pending', 'paid', 'failed', 'expired', 'waived'),
      allowNull: true,
      defaultValue: 'unpaid',
    },
    feeCurrency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'BDT', // Bangladeshi Taka
    },
    feeRecordedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    feeRecordedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'appointments',
    indexes: [
      { fields: ['patientId'] },
      { fields: ['doctorId'] },
      { fields: ['date', 'time'] },
      { fields: ['status'] },
      { fields: ['doctorId', 'date', 'time'] }, // For checking availability
    ],
  }
);

export default Appointment;

