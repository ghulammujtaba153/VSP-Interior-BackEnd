// export default (sequelize, DataTypes) => {
//     const Worker = sequelize.define('worker', {
//         name: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         email: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         phone: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         address: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         jobTitle: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         weeklyHours: {
//             type: DataTypes.INTEGER,
//             allowNull: false
//         },
//         hourlyRate: {
//             type: DataTypes.INTEGER,
//             allowNull: false
//         },
//         status: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         createdAt: {
//             type: DataTypes.DATE,
//             allowNull: false,
//             defaultValue: DataTypes.NOW
//         },
//         updatedAt: {
//             type: DataTypes.DATE,
//             allowNull: false,
//             defaultValue: DataTypes.NOW
//         }
//     }, {
//         tableName: 'workers',
//         timestamps: true,
//     })

//     Worker.associate = (models) => {
//         Worker.hasMany(models.ProjectWorker, { foreignKey: 'workerId', as: 'projectWorkers' });
//         Worker.hasMany(models.ProjectSetupJobWorker, { foreignKey: 'workerId', as: 'worker' });
//         Worker.belongsToMany(models.ProjectSetupJob, {
//             through: models.ProjectSetupJobWorker,
//             foreignKey: 'workerId',
//             otherKey: 'projectSetupJobId',
//             as: 'jobs',
//         });
//     }   

//     return Worker;
// }

export default (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weeklyHours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hourlyRate: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING, // Keep as STRING instead of ENUM
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'workers',
    timestamps: true,
  });

  Worker.associate = (models) => {
    Worker.hasMany(models.ProjectSetupJobWorker, { 
      foreignKey: 'workerId', 
      as: 'jobAssignments'
    });

    Worker.hasMany(models.ProjectKanban, { foreignKey: 'workerId', as: 'assignedWorkers' });

    Worker.hasMany(models.Notes, { foreignKey: 'workerId', as: 'creator' });

    Worker.belongsToMany(models.ProjectSetupJob, {
      through: models.ProjectSetupJobWorker,
      foreignKey: 'workerId',
      otherKey: 'projectSetupJobId',
      as: 'jobs',
    });
  };   

  return Worker;
};