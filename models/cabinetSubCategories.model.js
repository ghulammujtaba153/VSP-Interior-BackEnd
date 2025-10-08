export default (sequelize, DataTypes) => {

    const CabinetSubCategories = sequelize.define('CabinetSubCategories', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'cabinetSubCategories',
    });

    CabinetSubCategories.associate = (models) => {
        CabinetSubCategories.belongsTo(models.CabinetCategories, { foreignKey: 'categoryId' });
    };

    

    return CabinetSubCategories;
}