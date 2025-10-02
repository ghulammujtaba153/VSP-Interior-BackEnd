export default (sequelize, DataTypes) => {
  const ProjectAmend = sequelize.define(
    "ProjectAmend",
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
      previousData: {
        type: DataTypes.JSON, 
        allowNull: true,
      },
      updatedData: {
        type: DataTypes.JSON, 
        allowNull: true,
      },
    },
    {
        tableName: 'project_amend',
      timestamps: true, 
    }
  );

  ProjectAmend.associate = (models) => {
      ProjectAmend.belongsTo(models.ProjectSetup, { foreignKey: 'projectId', as: 'project' });
    };

  return ProjectAmend;
};
