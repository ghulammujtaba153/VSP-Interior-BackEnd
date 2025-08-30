export default (sequelize, DataTypes) => {
    const CabinetQuote = sequelize.define("CabinetQuote", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    }, {
        tableName: 'cabinetQuotes',
    });


    CabinetQuote.associate = (models) => {
        CabinetQuote.hasMany(models.CabinetMaterial, {
            foreignKey: "cabinetQuoteId",
            as: "cabinetMaterials",
        });
    };


    return CabinetQuote;
};