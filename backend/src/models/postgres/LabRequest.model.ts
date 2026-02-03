import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface LabRequestAttributes {
    id: string; // UUID
    doctorId: string; // MongoDB User ID
    patientId: string; // MongoDB User ID
    status: 'Pending' | 'Completed';
    totalBill: number;
    requestDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface LabRequestCreationAttributes extends Optional<LabRequestAttributes, 'id' | 'status' | 'requestDate' | 'createdAt' | 'updatedAt'> { }

class LabRequest extends Model<LabRequestAttributes, LabRequestCreationAttributes> implements LabRequestAttributes {
    public id!: string;
    public doctorId!: string;
    public patientId!: string;
    public status!: 'Pending' | 'Completed';
    public totalBill!: number;
    public requestDate!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

LabRequest.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        doctorId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        patientId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Pending',
        },
        totalBill: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        requestDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'lab_requests',
        timestamps: true,
        underscored: true,
    }
);

export default LabRequest;
