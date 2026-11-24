export default (sequelize, DataTypes) => {
  const PriceBookImport = sequelize.define(
    'PriceBookImport',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      formatKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'v1',
      },
      status: {
        type: DataTypes.ENUM('processing', 'completed', 'failed'),
        defaultValue: 'processing',
      },
      importedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rowCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      insertedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      updatedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      skippedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      errorLog: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'price_book_imports',
      timestamps: true,
    }
  )

  PriceBookImport.associate = (models) => {
    PriceBookImport.belongsTo(models.Suppliers, {
      foreignKey: 'supplierId',
      as: 'supplier',
    })
    PriceBookImport.belongsTo(models.User, {
      foreignKey: 'importedById',
      as: 'importedBy',
    })
    PriceBookImport.hasMany(models.PriceBook, {
      foreignKey: 'importBatchId',
      as: 'items',
    })
  }

  return PriceBookImport
}
