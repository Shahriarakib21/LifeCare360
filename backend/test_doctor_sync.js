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

class Doctor extends Model { }
Doctor.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING, allowNull: false },
    qualifications: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    experience: { type: DataTypes.INTEGER, allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    licenseExpiry: { type: DataTypes.DATE, allowNull: false },
    hospital: { type: DataTypes.STRING },
    clinic: { type: DataTypes.STRING },
    address: { type: DataTypes.JSONB, allowNull: false },
    contact: { type: DataTypes.JSONB, allowNull: false },
    availability: { type: DataTypes.JSONB, allowNull: false },
    consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    totalReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    bio: { type: DataTypes.TEXT },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    languages: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'doctors', indexes: [{ fields: ['userId'] }] });

async function run() {
    try {
        await sequelize.authenticate();
        console.log('AUTHENTICATED');
        await sequelize.sync({ alter: true });
        console.log('SYNC SUCCESS');
    } catch (err) {
        console.error('SYNC ERROR:', err);
        console.error('SQL:', err.sql);
        process.exit(1);
    }
}

run();
