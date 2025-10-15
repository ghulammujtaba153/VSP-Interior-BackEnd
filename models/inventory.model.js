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
        allowNull: false,
        references: { model: "PriceBookCategory", key: "id" },
      },
      priceBookId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Suppliers", key: "id" },
      },
      costPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
    },
    {
      tableName: "inventory_items",
      timestamps: true,
    }
  );

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Suppliers, { foreignKey: "supplierId", as: "supplier" });
    Inventory.belongsTo(models.PriceBookCategory, { foreignKey: "category", as: "categoryDetails" });
    Inventory.belongsTo(models.PriceBook, {
      foreignKey: "priceBookId",
      as: "priceBooks",
      onDelete: "CASCADE",
    });
  };

  return Inventory;
};
