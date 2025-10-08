export default (sequelize, DataTypes) => {
  const ProjectManagement = sequelize.define(
    "ProjectManagement",
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
      taskName: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('taskName', formatted);
          } else {
            this.setDataValue('taskName', value);
          }
        },
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('description', formatted);
          } else {
            this.setDataValue('description', value);
          }
        },
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      taskDependency: {
        type: DataTypes.INTEGER, // references another task id
        allowNull: true,
      },
    },
    {
      tableName: "projectManagement",
      timestamps: true,
    }
  );

  // Associations
  ProjectManagement.associate = (models) => {
    // Each task belongs to a project
    ProjectManagement.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });

    // Self-referencing association for dependencies
    ProjectManagement.belongsTo(ProjectManagement, {
      foreignKey: "taskDependency",
      as: "dependency",
    });

    ProjectManagement.hasMany(ProjectManagement, {
      foreignKey: "taskDependency",
      as: "dependents",
    });
  };

  return ProjectManagement;
};
