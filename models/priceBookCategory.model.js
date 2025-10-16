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
        indexes: [
            {
                unique: true,
                fields: ['name', 'supplierId'],
                name: 'unique_category_name_supplier'
            }
        ]
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

        PriceBookCategory.hasMany(models.Inventory, {
            foreignKey: 'category',
            onDelete: 'SET NULL',
        });
        
    };

    return PriceBookCategory;
}