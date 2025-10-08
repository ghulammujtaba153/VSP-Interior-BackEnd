

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