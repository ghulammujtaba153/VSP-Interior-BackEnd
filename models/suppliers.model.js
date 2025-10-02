

export default (sequelize, DataTypes) => {
    const Supplier = sequelize.define('Suppliers', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        postCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "active",
        },
        notes: {
            type: DataTypes.STRING,
        },

    }, {
        timestamps: true,
        tableName: 'suppliers',
    });

    Supplier.associate = (models) => {
        Supplier.hasMany(models.SupplierContacts, {
            foreignKey: 'supplierId',
            sourceKey: 'id',
            as: 'contacts',
            onDelete: 'CASCADE'
        });

        Supplier.hasMany(models.Inventory, {
            foreignKey: 'supplierId',
            as: 'inventory',
            onDelete: 'CASCADE',
        });

        Supplier.hasMany(models.PriceBookCategory, {
            foreignKey: 'supplierId',
            as: 'priceBookCategory',
            onDelete: 'CASCADE',
        });

        Supplier.hasMany(models.ProjectMaterial, {
            foreignKey: 'supplierId',
            as: 'projectMaterial',
            onDelete: 'CASCADE',
        });
    };

    return Supplier;
}