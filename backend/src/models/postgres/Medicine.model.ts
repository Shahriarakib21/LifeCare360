import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface MedicineAttributes {
  id: number;
  name: string; // Brand name
  genericName: string;
  manufacturer: string;
  category: string; // e.g., 'antibiotic', 'pain-reliever'
  dosageForm: string; // 'tablet', 'capsule', 'syrup', etc.
  strength: string; // '500mg', '10ml', etc.
  price: number;
  description?: string;
  indications: string[]; // What it's used for
  sideEffects: string[];
  contraindications: string[];
  interactions: string[]; // Drug interactions
  storageConditions: string;
  expiryDate?: Date;
  stock: number;
  isPrescriptionRequired: boolean;
  isActive: boolean;
  seoKeywords: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineCreationAttributes extends Optional<MedicineAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> { }

class Medicine extends Model<MedicineAttributes, MedicineCreationAttributes> implements MedicineAttributes {
  public id!: number;
  public name!: string;
  public genericName!: string;
  public manufacturer!: string;
  public category!: string;
  public dosageForm!: string;
  public strength!: string;
  public price!: number;
  public description?: string;
  public indications!: string[];
  public sideEffects!: string[];
  public contraindications!: string[];
  public interactions!: string[];
  public storageConditions!: string;
  public expiryDate?: Date;
  public stock!: number;
  public isPrescriptionRequired!: boolean;
  public isActive!: boolean;
  public seoKeywords!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Medicine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genericName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dosageForm: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    strength: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    indications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    sideEffects: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    contraindications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    interactions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    storageConditions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isPrescriptionRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    seoKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'medicines',
    indexes: [
      { fields: ['name'] },
      { fields: ['genericName'] },
      { fields: ['category'] },
      { fields: ['isActive'] },
      // Full-text search with gin_trgm_ops for fast ILIKE searches
      {
        fields: ['name'],
        using: 'gin',
        operator: 'gin_trgm_ops',
      },
      {
        fields: ['genericName'],
        using: 'gin',
        operator: 'gin_trgm_ops',
      },
    ],
  }
);

export default Medicine;

