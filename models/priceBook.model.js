export default (sequelize, DataTypes) => {
   
    const PriceBook = sequelize.define('priceBooks', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
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
        variant: {
            type: DataTypes.STRING,
            allowNull: true,
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1);
                    this.setDataValue('variant', formatted);
                } else {
                    this.setDataValue('variant', value);
                }
            },
        },
        dynamic: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: false,
        },
        
        version: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'v1',
        },
        versionEndDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active',
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
        indexes: [
            {
                unique: true,
                fields: ['name', 'version'],
                name: 'unique_pricebook_name_version'
            }
        ]
    })

    PriceBook.associate = (models) => {
 
        // PriceBook.hasMany(models.Inventory, {
        //     foreignKey: 'priceBookId',
        //     onDelete: 'CASCADE',
        // });
        PriceBook.belongsTo(models.Suppliers, {
            foreignKey: 'supplierId',
            onDelete: 'CASCADE',
        });
    };

    return PriceBook;
}