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
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
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
    };

    return PriceBook;
}