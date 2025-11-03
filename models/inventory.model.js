export default (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    "Inventory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        set(value) {
          if (value) {
            const formatted = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue("name", formatted);
          }
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "PriceBookCategory", key: "id" },
      },
      // priceBookId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true, 
      // },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Suppliers", key: "id" },
      },
      costPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("In Stock", "Low Stock", "Out of Stock"),
        defaultValue: "In Stock",
      },
    },
    {
      tableName: "inventory_items",
      timestamps: true,
    }
  );

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Suppliers, { foreignKey: "supplierId", as: "supplier" }, { onDelete: "CASCADE" });
    Inventory.belongsTo(models.PriceBookCategory, {
      foreignKey: "category",
      as: "categoryDetails",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // Inventory.belongsTo(models.PriceBookCategory, { foreignKey: "category", as: "categoryDetails" }, { onDelete: 'SET NULL',
    //   onUpdate: 'CASCADE', });
    // Inventory.belongsTo(models.PriceBook, {
    //   foreignKey: "priceBookId",
    //   as: "priceBooks",
    //   onDelete: "CASCADE",
    // });
    Inventory.hasMany(models.PurchaseLineItem, {
      foreignKey: "itemId",
      as: "purchaseLineItems",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Inventory;
};
