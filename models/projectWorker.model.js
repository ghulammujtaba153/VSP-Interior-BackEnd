export default (sequelize, DataTypes) => {
  const ProjectWorker = sequelize.define("ProjectWorker", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    workerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedHours: {
      type: DataTypes.INTEGER,
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
  }, {
    tableName: "project_workers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
  );

  ProjectWorker.associate = (models) => {
    // ProjectWorker.belongsTo(models.Project, { foreignKey: "projectId" });
    ProjectWorker.belongsTo(models.Worker, { foreignKey: "workerId" });
  };

  return ProjectWorker;
};
