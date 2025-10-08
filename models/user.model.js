
export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('name', formatted);
          } else {
            this.setDataValue('name', value);
          }
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended'),
        allowNull: false,
        defaultValue: "active"
      },
    });
  
    User.associate = (models) => {
      User.belongsTo(models.Role, { foreignKey: 'roleId' });
      User.hasMany(models.Audit, { foreignKey: 'userId' });
      User.hasMany(models.EmployeeLeave, { foreignKey: 'employeeId' });
      User.hasMany(models.EmployeeTimeSheet, { foreignKey: 'employeeId' });
    };
  
    return User;
  };
  