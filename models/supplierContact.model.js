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
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.STRING
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
