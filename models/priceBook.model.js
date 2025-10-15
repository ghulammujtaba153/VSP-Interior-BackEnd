export default (sequelize, DataTypes) => {
    const PriceBook = sequelize.define('priceBooks', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        priceBookCategoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'PriceBookCategory',
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
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
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
        tableName: 'priceBooks',
        timestamps: true,
    })

    PriceBook.associate = (models) => {
        PriceBook.belongsTo(models.PriceBookCategory, {
            foreignKey: 'priceBookCategoryId',
            onDelete: 'CASCADE',
        });
        PriceBook.hasMany(models.Inventory, {
            foreignKey: 'priceBookId',
            onDelete: 'CASCADE',
        });
    };

    return PriceBook;
}