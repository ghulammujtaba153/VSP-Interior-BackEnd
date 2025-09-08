export default (sequelize, DataTypes) => {
    const PriceBookCategory = sequelize.define('PriceBookCategory', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        supplierId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Suppliers',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
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
        PriceBookCategory.belongsTo(models.Suppliers, {
            foreignKey: 'supplierId',
            onDelete: 'CASCADE',
        });

        PriceBookCategory.hasMany(models.PriceBook, {
            foreignKey: 'priceBookCategoryId',
            onDelete: 'CASCADE',
        });
        
    };

    return PriceBookCategory;
}