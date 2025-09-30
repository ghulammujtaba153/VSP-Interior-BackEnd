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
    finishMaterial: { type: DataTypes.STRING },
    materialType: { type: DataTypes.STRING },
    measure: { type: DataTypes.STRING }, // e.g., M2/LM
    materialCost: { type: DataTypes.FLOAT, defaultValue: 0 },
    edgingCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  }, {
    tableName: 'project_materials',
    timestamps: true,
  });

  ProjectMaterial.associate = (models) => {
    ProjectMaterial.belongsTo(models.ProjectSetup, { foreignKey: 'projectId', as: 'project' });
  };

  return ProjectMaterial;
};
