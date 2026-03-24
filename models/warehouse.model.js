export default (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    "Warehouse",
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
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
      },
    },
    {
      tableName: "warehouses",
      timestamps: true,
    }
  );

  Warehouse.associate = (models) => {
    Warehouse.hasMany(models.Inventory, {
      foreignKey: "warehouseId",
      as: "inventoryItems",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return Warehouse;
};
