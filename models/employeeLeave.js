export default (sequelize, DataTypes) => {
    const EmployeeLeave = sequelize.define('EmployeeLeave', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      leaveType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ['pending', 'approved', 'rejected'],
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
      tableName: 'employee_leaves',
      timestamps: true
    });

    EmployeeLeave.associate = (models) => {
        EmployeeLeave.belongsTo(models.User, { foreignKey: 'employeeId', as: 'employee' });
    }
  
    return EmployeeLeave;
};


