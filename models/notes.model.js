export default (sequelize, DataTypes) => {
  const Notes = sequelize.define(
    "Notes",
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
      workerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      files: {
        type: DataTypes.JSON, // ✅ store multiple file URLs or file metadata as array
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: "Notes",
      timestamps: true, // ✅ automatically adds createdAt & updatedAt
    }
  );

  // ✅ Associations
  Notes.associate = (models) => {
    Notes.belongsTo(models.ProjectSetupJob, {
      foreignKey: "projectSetupJobId",
      as: "projectNotesotes",
    });

    Notes.belongsTo(models.Worker, {
      foreignKey: "workerId",
      as: "creator",
    });
  };

  return Notes;
};
