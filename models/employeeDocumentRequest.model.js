export default (sequelize, DataTypes) => {
    const EmployeeDocumentRequest = sequelize.define('EmployeeDocumentRequest', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        documentType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        documentName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            enum: ['pending', 'uploaded', 'rejected', "approved"],
            defaultValue: 'pending'
        },
        reason: {
            type: DataTypes.STRING,
            set(value) {
              if (typeof value === 'string' && value.length > 0) {
                const formatted =
                  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                this.setDataValue('reason', formatted);
              } else {
                this.setDataValue('reason', value);
              }
            },
        }
    }, {
      tableName: 'employee_document_requests',
      timestamps: true
    });

    EmployeeDocumentRequest.associate = (models) => {
        EmployeeDocumentRequest.belongsTo(models.User, { foreignKey: 'employeeId', as: 'employee' });
        EmployeeDocumentRequest.hasMany(models.EmployeeDocuments, { foreignKey: 'requestId', as: 'documents' });
    }

    return EmployeeDocumentRequest;
  };