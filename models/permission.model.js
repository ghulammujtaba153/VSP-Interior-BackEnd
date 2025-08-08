export default (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Resources',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id',
      },
    },
    canCreate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canView: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'Permissions',
    timestamps: true,
  });

  Permission.associate = (models) => {
    Permission.belongsTo(models.Role, {
      foreignKey: 'roleId',
    });

    Permission.belongsTo(models.Resource, {
      foreignKey: 'resourceId',
      onDelete: 'CASCADE',
    });


  };

  return Permission;
};
