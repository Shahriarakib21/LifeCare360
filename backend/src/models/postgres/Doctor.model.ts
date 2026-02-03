import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface DoctorAttributes {
  id: number;
  userId: string; // MongoDB User ID
  specialization: string;
  qualifications: string[];
  experience: number; // years
  licenseNumber: string;
  licenseExpiry: Date;
  hospital?: string;
  clinic?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  availability: {
    days: string[]; // ['monday', 'tuesday', ...]
    hours: {
      start: string; // '09:00'
      end: string; // '17:00'
    };
    timezone: string;
  };
  consultationFee: number;
  rating?: number;
  totalReviews?: number;
  bio?: string;
  profileImage?: string;
  languages: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DoctorCreationAttributes extends Optional<DoctorAttributes, 'id' | 'rating' | 'totalReviews' | 'isVerified' | 'isActive' | 'createdAt' | 'updatedAt'> { }

class Doctor extends Model<DoctorAttributes, DoctorCreationAttributes> implements DoctorAttributes {
  public id!: number;
  public userId!: string;
  public specialization!: string;
  public qualifications!: string[];
  public experience!: number;
  public licenseNumber!: string;
  public licenseExpiry!: Date;
  public hospital?: string;
  public clinic?: string;
  public address!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  public contact!: {
    phone: string;
    email: string;
    website?: string;
  };
  public availability!: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
    timezone: string;
  };
  public consultationFee!: number;
  public rating?: number;
  public totalReviews?: number;
  public bio?: string;
  public languages!: string[];
  public isVerified!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Doctor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    hospital: {
      type: DataTypes.STRING,
    },
    clinic: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    contact: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    availability: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'doctors',
    indexes: [
      { fields: ['userId'] },
      { fields: ['specialization'] },
      { fields: ['isVerified', 'isActive'] },
      { fields: ['address'] }, // For location-based searches
    ],
  }
);

export default Doctor;

