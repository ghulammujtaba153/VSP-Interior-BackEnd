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
        type: DataTypes.STRING
      },
      lastName: {
        type: DataTypes.STRING
      },
      role: {
        type: DataTypes.STRING
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
  