// models/ProjectSetup.js
export default (sequelize, DataTypes) => {
  const ProjectSetup = sequelize.define('ProjectSetup', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectName: { type: DataTypes.STRING, allowNull: false },
    siteLocation: { type: DataTypes.STRING, allowNull: false },
    accessNotes: { type: DataTypes.TEXT },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    qsName: { type: DataTypes.STRING },
    qsPhone: { type: DataTypes.STRING },
    revision: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'project_setups',
    timestamps: true,
  });

  ProjectSetup.associate = (models) => {
    ProjectSetup.belongsTo(models.Clients, { foreignKey: 'clientId', as: 'client' });
    ProjectSetup.hasMany(models.ProjectRate, { foreignKey: 'projectId', as: 'rates' });
    ProjectSetup.hasMany(models.ProjectMaterial, { foreignKey: 'projectId', as: 'materials' });
    ProjectSetup.hasMany(models.ProjectVariation, { foreignKey: 'projectId', as: 'variations' });
    ProjectSetup.hasMany(models.ProjectAmend, { foreignKey: 'projectId', as: 'amends' });
  };

  return ProjectSetup;
};
