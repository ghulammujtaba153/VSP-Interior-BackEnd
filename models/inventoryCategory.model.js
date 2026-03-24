export default (sequelize, DataTypes) => {
  const InventoryCategory = sequelize.define(
    "InventoryCategory",
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
      status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
      },
    },
    {
      tableName: "inventory_categories",
      timestamps: true,
    }
  );

  InventoryCategory.associate = (models) => {
    InventoryCategory.hasMany(models.Inventory, {
      foreignKey: "categoryId",
      as: "inventoryItems",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return InventoryCategory;
};