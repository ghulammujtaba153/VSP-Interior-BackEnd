export default (sequelize, DataTypes) => {
  const ProjectSetupJob = sequelize.define(
    "ProjectSetupJob",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      projectSetupId: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
      },
      startDate: { 
        type: DataTypes.DATE, 
        allowNull: false 
      },
      endDate: { 
        type: DataTypes.DATE, 
        allowNull: false 
      },
      status: {
        type: DataTypes.ENUM(
          'scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold', 'delayed'
        ),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      notes: { 
        type: DataTypes.TEXT, 
        allowNull: true 
      },
    },
    {
      tableName: "ProjectSetupJobs",
      timestamps: true,
    }
  );

  ProjectSetupJob.associate = function(models) {
    // Belongs to ProjectSetup
    ProjectSetupJob.belongsTo(models.ProjectSetup, {
      foreignKey: 'projectSetupId',
      as: 'projectSetup'
    });

    // Has many through junction table
    ProjectSetupJob.hasMany(models.ProjectSetupJobWorker, {
      foreignKey: 'projectSetupJobId',
      as: 'assignedWorkers'
    });

    // Many-to-Many with Worker
    ProjectSetupJob.belongsToMany(models.Worker, {
      through: models.ProjectSetupJobWorker,
      foreignKey: 'projectSetupJobId',
      otherKey: 'workerId',
      as: 'workers', // Changed from 'assignedWorkers' to 'workers' for consistency
    });


    ProjectSetupJob.hasMany(models.ProjectKanban, {
      foreignKey: "projectSetupJobId",
      as: "kanbanTasks",
    });

    ProjectSetupJob.hasMany(models.ProjectGanttChart, {
      foreignKey: "projectSetupJobId",
      as: "ganttChart",
    });
  };

  return ProjectSetupJob;
};