
export default (sequelize, DataTypes) => {
    const Cabinet = sequelize.define(
      "Cabinet",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        cabinetCategoryId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        cabinetSubCategoryId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        description: {
          type: DataTypes.STRING,
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
        dynamicData: {
          type: DataTypes.JSONB, // ✅ Flexible dynamic fields
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive"), // ✅ proper enum
          defaultValue: "active",
        },
      },
      {
        tableName: "cabinets", // ✅ better to match plural DB convention
        timestamps: true, // ✅ will auto-create createdAt & updatedAt
      }
    );
  
    Cabinet.associate = (models) => {
      Cabinet.belongsTo(models.CabinetCategories, {
        foreignKey: "cabinetCategoryId",
        onDelete: "CASCADE",
        as: "cabinetCategory",
      });
      Cabinet.belongsTo(models.CabinetSubCategories, {
        foreignKey: "cabinetSubCategoryId",
        onDelete: "CASCADE",
        as: "cabinetSubCategory",
      });
    };
  
    return Cabinet;
  };
  