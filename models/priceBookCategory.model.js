export default (sequelize, DataTypes) => {

    const PriceBookCategory = sequelize.define('PriceBookCategory', {
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
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'PriceBookCategory',
        timestamps: true,
        
    })

    PriceBookCategory.associate = (models) => {

        PriceBookCategory.hasMany(models.PriceBook, {
            foreignKey: 'priceBookCategoryId',
            onDelete: 'CASCADE',
        });

        PriceBookCategory.hasMany(models.Inventory, {
            foreignKey: 'category',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        });
        
    };
    

    return PriceBookCategory;
}