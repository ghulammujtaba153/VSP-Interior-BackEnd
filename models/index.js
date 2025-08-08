// db/index.js (or db/init.js, models/index.js depending on your structure)
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

import UserModel from './user.model.js';
import RoleModel from './role.model.js';
import PermissionModel from './permission.model.js';
import ResourceModel from './resource.model.js';
import ClientModel from './client.model.js';
import ContactModel from './contact.model.js';

dotenv.config();

const isSupabase = !!process.env.DATABASE_URL;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    })

// Initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const Role = RoleModel(sequelize, Sequelize.DataTypes);
const Permission = PermissionModel(sequelize, Sequelize.DataTypes);
const Resource = ResourceModel(sequelize, Sequelize.DataTypes);
const Clients = ClientModel(sequelize, Sequelize.DataTypes);
const Contacts = ContactModel(sequelize, Sequelize.DataTypes);

// Prepare DB object
const db = {
  User,
  Role,
  Permission,
  Resource,
  Clients,
  Contacts,
  sequelize,
  Sequelize,
};

// Setup associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
