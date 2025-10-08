export default (sequelize, DataTypes) => {
    const SupplierContact = sequelize.define('SupplierContacts', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        supplierId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING,
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('firstName', formatted);
                } else {
                    this.setDataValue('firstName', value);
                }
            },
        },
        lastName: {
            type: DataTypes.STRING,
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('lastName', formatted);
                } else {
                    this.setDataValue('lastName', value);
                }
            },
        },
        role: {
            type: DataTypes.STRING,
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('role', formatted);
                } else {
                    this.setDataValue('role', value);
                }
            },
        },
        emailAddress: {
            type: DataTypes.STRING,
            validate: {
                isEmail: true
            }
        },
        phoneNumber: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'supplier_contacts',
        timestamps: true
    });

    SupplierContact.associate = (models) => {
        SupplierContact.belongsTo(models.Suppliers, {
            foreignKey: 'supplierId',
            as: 'supplier',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return SupplierContact;
};
