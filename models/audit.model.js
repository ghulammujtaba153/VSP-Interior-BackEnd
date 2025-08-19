export default (sequelize, DataTypes) => {
    const Audit = sequelize.define("Audit", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tableName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        oldData: {
            type: DataTypes.JSON,
            allowNull: true
        },
        newData: {
            type: DataTypes.JSON,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: "audit",
    });


    Audit.associate = (models) => {
        Audit.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return Audit;
};
