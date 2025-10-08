
export default (sequelize, DataTypes) => {
    const Notification = sequelize.define(
      "Notification",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING(255),
          allowNull: false,
          set(value) {
            if (typeof value === 'string' && value.length > 0) {
              const formatted =
                value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              this.setDataValue('message', formatted);
            } else {
              this.setDataValue('message', value);
            }
          },
        },
        seen: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "notifications",
        timestamps: true,
      }
    );
  
    return Notification;
  };
  