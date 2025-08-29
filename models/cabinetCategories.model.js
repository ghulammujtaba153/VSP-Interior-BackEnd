

export default (sequelize, DataTypes) => {
    const CabinetCategories = sequelize.define('CabinetCategories', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'cabinetCategories',
    });

    CabinetCategories.associate = (models) => {
        CabinetCategories.hasMany(models.CabinetSubCategories, {
          foreignKey: "categoryId",
          as: "subCategories",
          onDelete: "CASCADE",
        });
      };

    return CabinetCategories;
}