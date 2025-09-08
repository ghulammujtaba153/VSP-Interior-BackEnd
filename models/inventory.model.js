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
        totalStocks: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        notes: {
          type: DataTypes.TEXT,
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
      Inventory.belongsTo(models.Suppliers, {
        foreignKey: "supplierId",
        as: "supplier",
      });
    };
  
    return Inventory;
  };
  