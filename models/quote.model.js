export default (sequelize, DataTypes) => {
    const Quote = sequelize.define('Quote', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        quoteData: {
            type: DataTypes.JSON,
            allowNull: false
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
    }, { tableName: 'quotes', timestamps: true });
    return Quote;
};