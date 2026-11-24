export default (sequelize, DataTypes) => {
  const PriceBook = sequelize.define(
    'priceBooks',
    {
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
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      variant: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      basePrice: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
      },
      priceTiers: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      attributes: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NZD',
      },
      dynamic: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      importBatchId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sourceFileName: {
        type: DataTypes.STRING,
        allowNull: true,
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
    },
    {
      tableName: 'priceBooks',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['supplierId', 'sku', 'version'],
          name: 'unique_pricebook_supplier_sku_version',
        },
      ],
    }
  )

  PriceBook.associate = (models) => {
    PriceBook.belongsTo(models.Suppliers, {
      foreignKey: 'supplierId',
      as: 'supplier',
      onDelete: 'CASCADE',
    })
    PriceBook.belongsTo(models.PriceBookImport, {
      foreignKey: 'importBatchId',
      as: 'importBatch',
    })
  }

  return PriceBook
}
