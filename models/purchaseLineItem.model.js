export default (sequelize, DataTypes) => {
    const PurchaseLineItem = sequelize.define(
      "PurchaseLineItem",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        purchaseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "project_purchases",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        itemId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        quantity: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        unit: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        unitPrice: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        subtotal: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
      },
      {
        tableName: "purchase_line_items",
        timestamps: true,
      }
    );
  
    PurchaseLineItem.associate = (models) => {
      PurchaseLineItem.belongsTo(models.ProjectPurchase, {
        foreignKey: "purchaseId",
        as: "purchase",
      });
      PurchaseLineItem.belongsTo(models.Inventory, {
        foreignKey: "itemId",
        as: "item",
        onDelete: "CASCADE",
      });
    };
  
    return PurchaseLineItem;
  };
  