// models/contact.model.js

export default (sequelize, DataTypes) => {
    const Contact = sequelize.define('Contact', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('firstName', formatted);
          } else {
            this.setDataValue('firstName', value);
          }
        },
      },
      lastName: {
        type: DataTypes.STRING,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('lastName', formatted);
          } else {
            this.setDataValue('lastName', value);
          }
        },
      },
      role: {
        type: DataTypes.STRING,
        set(value) {
          if (typeof value === 'string' && value.length > 0) {
            const formatted =
              value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            this.setDataValue('role', formatted);
          } else {
            this.setDataValue('role', value);
          }
        },
      },
      emailAddress: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true
        }
      },
      phoneNumber: {
        type: DataTypes.STRING
      }
    }, {
      tableName: 'contacts',
      timestamps: true
    });
  
    Contact.associate = (models) => {
      Contact.belongsTo(models.Clients, {
        foreignKey: 'clientId',
        as: 'client'
      });
    };
  
    return Contact;
  };
  