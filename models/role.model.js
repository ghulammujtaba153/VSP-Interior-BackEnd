// models/Role.js
export default (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    });
  
    Role.associate = (models) => {
      Role.hasMany(models.User, { foreignKey: 'roleId' });
      Role.hasMany(models.Permission, { foreignKey: 'roleId' });
    };
  
    return Role;
  };
  