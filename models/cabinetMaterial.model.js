export default (sequelize, DataTypes) => {
    const CabinetMaterial = sequelize.define("CabinetMaterial", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cabinetQuoteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        cabinetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'cabinetMaterials',
    });

    CabinetMaterial.associate = (models) => {
        CabinetMaterial.belongsTo(models.CabinetQuote, {
            foreignKey: "cabinetQuoteId",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            as: "cabinetQuote",
        });
        CabinetMaterial.belongsTo(models.Cabinet, {
            foreignKey: "cabinetId",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            as: "cabinet",
        });
    };



    return CabinetMaterial;
};