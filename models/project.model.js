export default (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('name', formatted);
          } else {
            this.setDataValue('name', value);
          }
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('location', formatted);
          } else {
            this.setDataValue('location', value);
          }
        },
      },
      client: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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

      // 🔹 Key milestone dates
      shopDrawingSubmissionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      siteMeasureDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      installationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // 🔹 Job phases
      machiningDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      assemblyDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      installPhaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // 🔹 Resource management
      estimatedHours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      availableHours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // 🔹 Status tracking
      status: {
        type: DataTypes.ENUM("planned", "in-progress", "completed", "on-hold"),
        allowNull: false,
        defaultValue: "planned",
      },
      alertStatus: {
        type: DataTypes.ENUM("green", "yellow", "red"),
        defaultValue: "green", // green = on track
      },
    },
    {
      tableName: "projects", // 👈 lowercase (matches DB)
      timestamps: true, // createdAt, updatedAt
    }
  );

  // 🔹 Associations
  Project.associate = (models) => {
    // Each project can have many workers assigned
    Project.hasMany(models.ProjectWorker, {
    foreignKey: "projectId",
    as: "workers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Project.hasMany(models.ProjectManagement, {
    foreignKey: "projectId",
    as: "tasks",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

    // Each project belongs to a client
    Project.belongsTo(models.Clients, {
      foreignKey: "clientId",
      as: "clientDetails",
    });

    // Link with inventory for material allocation
    Project.hasMany(models.InventoryAllocation, {
      foreignKey: "projectId",
      as: "allocations",
    });
  };

  return Project;
};
