import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface RatingAttributes {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientId: string; // MongoDB Patient ID
  rating: number; // 1-5
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RatingCreationAttributes extends Optional<RatingAttributes, 'id' | 'comment' | 'createdAt' | 'updatedAt'> {}

class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  public id!: number;
  public appointmentId!: number;
  public doctorId!: number;
  public patientId!: string;
  public rating!: number;
  public comment?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Rating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'appointments',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    tableName: 'ratings',
    indexes: [
      { fields: ['appointmentId'], unique: true }, // One rating per appointment
      { fields: ['doctorId'] },
      { fields: ['patientId'] },
    ],
  }
);

export default Rating;

