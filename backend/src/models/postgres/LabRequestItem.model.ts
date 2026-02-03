import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import LabRequest from './LabRequest.model';
import LabTest from './LabTest.model';

interface LabRequestItemAttributes {
    id: string; // UUID
    requestId: string;
    testId: string;
    resultValue?: string;
    resultStatus?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface LabRequestItemCreationAttributes extends Optional<LabRequestItemAttributes, 'id' | 'resultValue' | 'resultStatus' | 'createdAt' | 'updatedAt'> { }

class LabRequestItem extends Model<LabRequestItemAttributes, LabRequestItemCreationAttributes> implements LabRequestItemAttributes {
    public id!: string;
    public requestId!: string;
    public testId!: string;
    public resultValue?: string;
    public resultStatus?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

LabRequestItem.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: LabRequest,
                key: 'id',
            },
        },
        testId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: LabTest,
                key: 'id',
            },
        },
        resultValue: {
            type: DataTypes.STRING,
        },
        resultStatus: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        tableName: 'lab_request_items',
        timestamps: true,
        underscored: true,
    }
);

// Associations
LabRequest.hasMany(LabRequestItem, { foreignKey: 'requestId', as: 'items' });
LabRequestItem.belongsTo(LabRequest, { foreignKey: 'requestId' });

LabTest.hasMany(LabRequestItem, { foreignKey: 'testId', as: 'requestItems' });
LabRequestItem.belongsTo(LabTest, { foreignKey: 'testId', as: 'test' });

export default LabRequestItem;
