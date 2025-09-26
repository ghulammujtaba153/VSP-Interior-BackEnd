
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
    };
  
    return User;
  };
  