

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
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1);
                    this.setDataValue('name', formatted);
                } else {
                    this.setDataValue('name', value);
                }
            },
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
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('notes', formatted);
                } else {
                    this.setDataValue('notes', value);
                }
            },
        },

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

        Supplier.hasMany(models.PriceBook, {
            foreignKey: 'supplierId',
            as: 'priceBooks',
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