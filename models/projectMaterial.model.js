// models/projectMaterial.model.js
export default (sequelize, DataTypes) => {
  const ProjectMaterial = sequelize.define('ProjectMaterial', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: true },
    sourceType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'manual',
    },
    priceBookId: { type: DataTypes.INTEGER, allowNull: true },
    inventoryId: { type: DataTypes.INTEGER, allowNull: true },
    sku: { type: DataTypes.STRING, allowNull: true },
    unit: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    quotedUnitPrice: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    finishMaterial: {
      type: DataTypes.STRING,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('finishMaterial', formatted);
        } else {
          this.setDataValue('finishMaterial', value);
        }
      },
    },
    materialType: {
      type: DataTypes.STRING,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('materialType', formatted);
        } else {
          this.setDataValue('materialType', value);
        }
      },
    },
    measure: { type: DataTypes.STRING },
    materialCost: { type: DataTypes.FLOAT, defaultValue: 0 },
    edgingCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  }, {
    tableName: 'project_materials',
    timestamps: true,
  });

  ProjectMaterial.associate = (models) => {
    ProjectMaterial.belongsTo(models.ProjectSetup, { foreignKey: 'projectId', as: 'project' });
    ProjectMaterial.belongsTo(models.Suppliers, { foreignKey: 'supplierId', as: 'supplier' });
    ProjectMaterial.belongsTo(models.PriceBook, { foreignKey: 'priceBookId', as: 'priceBook' });
    ProjectMaterial.belongsTo(models.Inventory, { foreignKey: 'inventoryId', as: 'inventory' });
  };

  return ProjectMaterial;
};
