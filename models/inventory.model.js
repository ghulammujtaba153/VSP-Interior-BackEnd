import db from './index.js';

export default (sequelize, DataTypes) => {
    const Inventory = sequelize.define(
      "Inventory",
      {
        id: {
          type: DataTypes.INTEGER, // Fixed: INTEGER not Integer
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        itemCode: {
          type: DataTypes.STRING(100), // SKU/Code for tracking
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        unit: {
          type: DataTypes.STRING(50), // e.g., Sheet, Each
          allowNull: false,
        },
        supplierId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Suppliers",
            key: "id",
          },
        },
        costPrice: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        minThreshold: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        maxThreshold: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive"),
          allowNull: false,
          defaultValue: "active",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "inventory_items",
        timestamps: true,
      }
    );

    Inventory.associate = (models) => {
        Inventory.belongsTo(models.Suppliers, { foreignKey: 'supplierId', as: 'supplier' });
        Inventory.hasMany(models.Inventory, { foreignKey: 'supplierId', as: 'inventory' });
    };
  
    return Inventory;
  };
  