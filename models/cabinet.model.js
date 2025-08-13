export default (sequelize, DataTypes) => {
    const Cabinet = sequelize.define("Cabinet", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        modelName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        material: {
            type: DataTypes.STRING,
            allowNull: false
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        depth: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        basePrice: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        pricePerSqft:{
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.STRING,
            enum: ['active', 'inactive'],
            defaultValue: 'active'
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
        tableName: "cabinet",
    });

    return Cabinet;
};
