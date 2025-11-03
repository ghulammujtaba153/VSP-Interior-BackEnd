export default (sequelize, DataTypes) => {
    const ProjectPurchase = sequelize.define(
      "ProjectPurchase",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        projectId: {
          type: DataTypes.INTEGER,
          allowNull: true, // "General Stock" can be used, so project is optional
        },
        supplierId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          
        },
        expectedDelivery: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("submit", "approved", "rejected", "pending", "delivered", "delayed"),
          defaultValue: "submit",
        },
        totalAmount: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        attachments: {
          type: DataTypes.JSON, // store uploaded files as JSON array
          allowNull: true,
        },
      },
      {
        tableName: "project_purchases",
        timestamps: true,
      }
    );
  
    ProjectPurchase.associate = (models) => {
      ProjectPurchase.belongsTo(models.ProjectSetup, {
        foreignKey: "projectId",
        as: "project",
      });
      ProjectPurchase.belongsTo(models.Suppliers, {
        foreignKey: "supplierId",
        as: "suppliers",
      });
      ProjectPurchase.hasMany(models.PurchaseLineItem, {
        foreignKey: "purchaseId",
        as: "lineItems",
        onDelete: "CASCADE",
      });
    };
  
    return ProjectPurchase;
  };
