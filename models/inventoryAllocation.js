export default (sequelize, DataTypes) => {
  const InventoryAllocation = sequelize.define(
    "InventoryAllocation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      materialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantityAllocated: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "inventory_allocations", // 👈 explicit lowercase table
      timestamps: true,
    }
  );

  // 🔹 Associations
  InventoryAllocation.associate = (models) => {
    // InventoryAllocation.belongsTo(models.Project, {
    //   foreignKey: "projectId",
    //   as: "project",
    //   onDelete: "CASCADE",
    //   onUpdate: "CASCADE",
    // });

    InventoryAllocation.belongsTo(models.Inventory, {
      foreignKey: "materialId",
      as: "material",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return InventoryAllocation;
};
