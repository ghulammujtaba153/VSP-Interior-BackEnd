export default (sequelize, DataTypes) => {
  const ProjectSetupJobWorker = sequelize.define(
    "ProjectSetupJobWorker",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectSetupJobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ProjectSetupJobs',
          key: 'id'
        }
      },
      workerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Workers',
          key: 'id'
        }
      },
      // Optional: Add additional fields to the junction table
      hoursAssigned: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      tableName: "ProjectSetupJobWorkers",
      timestamps: true,
    }
  );

  ProjectSetupJobWorker.associate = function(models) {
    ProjectSetupJobWorker.belongsTo(models.ProjectSetupJob, {
      foreignKey: 'projectSetupJobId',
      as: 'projectSetup' // Fixed name from 'project'
    });

    ProjectSetupJobWorker.belongsTo(models.Worker, {
      foreignKey: 'workerId',
      as: 'worker'
    });
  };

  return ProjectSetupJobWorker;
};