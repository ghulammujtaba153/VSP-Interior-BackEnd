export default (sequelize, DataTypes) => {
  const ProjectVariation = sequelize.define(
    "ProjectVariation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING, // [{ name: "extra room", cost: 2000 }, { name: "balcony", cost: 1500 }]
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
      variations: {
        type: DataTypes.JSONB, // [{ name: "extra room", cost: 2000 }, { name: "balcony", cost: 1500 }]
        allowNull: false,
      },
      totalCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "project_variations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  )

  ProjectVariation.associate = (models) => {
    ProjectVariation.belongsTo(models.ProjectSetup, {
      foreignKey: "projectId",
      as: "project",
    })
  }

  return ProjectVariation
}
