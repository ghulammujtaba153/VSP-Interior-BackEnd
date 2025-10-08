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
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('title', formatted);
                } else {
                    this.setDataValue('title', value);
                }
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            set(value) {
                if (typeof value === 'string' && value.length > 0) {
                    const formatted =
                      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    this.setDataValue('description', formatted);
                } else {
                    this.setDataValue('description', value);
                }
            },
        }
    }, {
        tableName: 'cabinetQuotes',
    });


    CabinetQuote.associate = (models) => {
        CabinetQuote.hasMany(models.CabinetMaterial, {
            foreignKey: "cabinetQuoteId",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            as: "cabinetMaterials",
        });
    };


    return CabinetQuote;
};