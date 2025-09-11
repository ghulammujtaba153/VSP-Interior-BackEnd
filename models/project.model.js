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
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
