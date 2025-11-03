// models/ProjectSetup.js
export default (sequelize, DataTypes) => {
  const ProjectSetup = sequelize.define('ProjectSetup', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectName: { type: DataTypes.STRING, allowNull: false,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('projectName', formatted);
        } else {
          this.setDataValue('projectName', value);
        }
      },
    },
    siteLocation: { type: DataTypes.STRING, allowNull: false,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('siteLocation', formatted);
        } else {
          this.setDataValue('siteLocation', value);
        }
      },
    },
    accessNotes: { type: DataTypes.TEXT,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('accessNotes', formatted);
        } else {
          this.setDataValue('accessNotes', value);
        }
      },
    },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    qsName: { type: DataTypes.STRING,
      set(value) {
        if (typeof value === 'string' && value.length > 0) {
          const formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('qsName', formatted);
        } else {
          this.setDataValue('qsName', value);
        }
      },
    },
    qsPhone: { type: DataTypes.STRING },
    revision: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft'
    }
  }, {
    tableName: 'project_setups',
    timestamps: true,
  });

  ProjectSetup.associate = (models) => {
    ProjectSetup.belongsTo(models.Clients, { foreignKey: 'clientId', as: 'client' });
    ProjectSetup.hasMany(models.ProjectRate, { foreignKey: 'projectId', as: 'rates', onDelete: 'CASCADE' });
    ProjectSetup.hasMany(models.ProjectMaterial, { foreignKey: 'projectId', as: 'materials', onDelete: 'CASCADE' });
    ProjectSetup.hasMany(models.ProjectVariation, { foreignKey: 'projectId', as: 'variations', onDelete: 'CASCADE' });
    ProjectSetup.hasMany(models.ProjectAmend, { foreignKey: 'projectId', as: 'amends', onDelete: 'CASCADE' });
    ProjectSetup.hasOne(models.ProjectCostSheet, { foreignKey: 'projectId', as: 'costingSheet', onDelete: 'CASCADE' });
    ProjectSetup.hasMany(models.ProjectSetupJob, { foreignKey: 'projectSetupId', as: 'jobs', onDelete: 'CASCADE' });
    ProjectSetup.hasMany(models.ProjectPurchase, { foreignKey: 'projectId', as: 'purchases', onDelete: 'CASCADE' });
  };

  return ProjectSetup;
};
