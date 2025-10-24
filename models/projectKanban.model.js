export default (sequelize, DataTypes) => {
  const ProjectKanban = sequelize.define(
    "ProjectKanban",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectSetupJobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      workerId: {
        type: DataTypes.INTEGER, // ✅ FIXED: should be INTEGER, not String
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "medium", // 'low', 'medium', 'high'
      },
      stage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "To Do", // e.g., 'To Do', 'In Progress', 'Done'
      },
      comments: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      files: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "ProjectKanbans",
      timestamps: true,
    }
  );

  ProjectKanban.associate = (models) => {
    ProjectKanban.belongsTo(models.ProjectSetupJob, {
      foreignKey: "projectSetupJobId",
      as: "kanbanTasks",
    });

    ProjectKanban.belongsTo(models.Worker, {
      foreignKey: "workerId",
      as: "assignedWorker",
    });
  };

  return ProjectKanban;
};
