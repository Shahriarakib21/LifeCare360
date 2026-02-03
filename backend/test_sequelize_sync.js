const { Sequelize, DataTypes, Model } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'healthlife',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        dialect: 'postgres',
        logging: console.log
    }
);

class LabTest extends Model { }
LabTest.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    unit: { type: DataTypes.STRING },
    referenceRange: { type: DataTypes.STRING },
    priceBDT: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { sequelize, tableName: 'lab_tests', underscored: true });

async function run() {
    try {
        await sequelize.authenticate();
        console.log('AUTHENTICATED');
        await sequelize.sync({ alter: true });
        console.log('SYNC SUCCESS');
    } catch (err) {
        console.error('SYNC ERROR:', err);
        if (err.parent) console.error('PARENT ERROR:', err.parent);
        process.exit(1);
    }
}

run();
