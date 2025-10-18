export default (sequelize, DataTypes) => {
    const EmployeeDocuments = sequelize.define('EmployeeDocuments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      employeeId: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      requestId: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      documentId: {
          type: DataTypes.STRING,
          allowNull: false
      },
      documentUrl: {
          type: DataTypes.STRING,
          allowNull: false
      },
      status: {
          type: DataTypes.STRING,
          allowNull: false
      },
      createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
      },
      updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'employee_documents',
      timestamps: true,
    });

    EmployeeDocuments.associate = (models) => {
        EmployeeDocuments.belongsTo(models.User, { foreignKey: 'employeeId', as: 'employee' });
        EmployeeDocuments.belongsTo(models.EmployeeDocumentRequest, { foreignKey: 'requestId', as: 'documentRequest' });
    }
  
    return EmployeeDocuments;
}

