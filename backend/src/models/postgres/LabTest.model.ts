import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface LabTestAttributes {
    id: string; // UUID
    name: string;
    category: string;
    unit: string;
    referenceRange: string;
    priceBDT: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface LabTestCreationAttributes extends Optional<LabTestAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class LabTest extends Model<LabTestAttributes, LabTestCreationAttributes> implements LabTestAttributes {
    public id!: string;
    public name!: string;
    public category!: string;
    public unit!: string;
    public referenceRange!: string;
    public priceBDT!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

LabTest.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        unit: {
            type: DataTypes.STRING,
        },
        referenceRange: {
            type: DataTypes.STRING,
        },
        priceBDT: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'lab_tests',
        timestamps: true,
        underscored: true,
    }
);

export default LabTest;
