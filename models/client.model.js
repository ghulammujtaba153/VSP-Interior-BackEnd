// models/client.model.js

export default (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
      id: {
        type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      emailAddress: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true
        }
      },
      phoneNumber: {
        type: DataTypes.STRING
      },
      address: {
        type: DataTypes.TEXT
      },
      postCode: {
        type: DataTypes.STRING
      },
      accountStatus: {
        type: DataTypes.STRING,
        defaultValue: 'active'
      },
      notes: {
        type: DataTypes.TEXT
      }
    }, {
      tableName: 'clients',
      timestamps: true
    });
  
    Client.associate = (models) => {
      Client.hasMany(models.Contacts, {
        foreignKey: 'clientId',
        sourceKey: 'id',
        as: 'contacts',
        onDelete: 'CASCADE'
      });
    };
  
    return Client;
  };
  