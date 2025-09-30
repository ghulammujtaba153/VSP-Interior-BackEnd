// models/ProjectRate.js
export default (sequelize, DataTypes) => {
  const ProjectRate = sequelize.define('ProjectRate', {
    id: { 
        type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true, 
    },
    projectId: { type: DataTypes.INTEGER, allowNull: false, onDelete: "CASCADE", },
    type: { 
      type: DataTypes.ENUM('Material', 'Hardware', 'BuyIn', 'Freight', 'ShopDrawing', 'Machining', 'Assembly', 'Installation'),
      allowNull: false,
    },
    markup: { type: DataTypes.FLOAT, defaultValue: 0 },
    cost: { type: DataTypes.FLOAT, defaultValue: 0 },
    sell: { type: DataTypes.FLOAT, defaultValue: 0 },
    hourlyRate: { type: DataTypes.FLOAT, allowNull: true }, // For processes like ShopDrawing, Machining, etc.
  }, {
    tableName: 'project_rates',
    timestamps: true,
  });

  ProjectRate.associate = (models) => {
    ProjectRate.belongsTo(models.ProjectSetup, { foreignKey: 'projectId', as: 'project' });
  };

  return ProjectRate;
};
