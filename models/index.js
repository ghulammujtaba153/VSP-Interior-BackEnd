// db/index.js (or db/init.js, models/index.js depending on your structure)
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

import UserModel from './user.model.js';
import RoleModel from './role.model.js';
import PermissionModel from './permission.model.js';
import ResourceModel from './resource.model.js';
import ClientModel from './client.model.js';
import ContactModel from './contact.model.js';
import SupplierModel from './suppliers.model.js';
import SupplierContactModel from './supplierContact.model.js';
import InventoryModel from './inventory.model.js';
import CabinetModel from './cabinet.model.js';
import AuditModel from './audit.model.js';
import NotificationModel from './notification.model.js';
import CabinetCategoriesModel from './cabinetCategories.model.js';
import CabinetSubCategoriesModel from './cabinetSubCategories.model.js';
import CabinetQuoteModel from './cabinetQuote.model.js';
import CabinetMaterialModel from './cabinetMaterial.model.js';
import PriceBookCategoryModel from './priceBookCategory.model.js';
import PriceBookModel from './priceBook.model.js';
import WorkerModel from './worker.model.js';
import projectModel from './project.model.js';
import inventoryAllocationModel from './inventoryAllocation.js';
import projectWorkerModel from './projectWorker.model.js';
import projectManangementModel from './projectManangement.model.js';
import employeeLeave from './employeeLeave.js';
import projectSetupModel from './projectSetup.model.js';
import projectRateModel from './projectRate.model.js';
import projectMaterialModel from './projectMaterial.model.js';
import projectVariationModel from './projectVariation.model.js';
import projectAmendModel from './projectAmend.model.js';
import employeeTimeSheetModel from './employeeTimeSheet.model.js';


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
const Inventory = InventoryModel(sequelize, Sequelize.DataTypes);
const Suppliers = SupplierModel(sequelize, Sequelize.DataTypes);
const SupplierContacts = SupplierContactModel(sequelize, Sequelize.DataTypes);
const Cabinet = CabinetModel(sequelize, Sequelize.DataTypes);
const Audit = AuditModel(sequelize, Sequelize.DataTypes);
const Notification = NotificationModel(sequelize, Sequelize.DataTypes)
const CabinetCategories = CabinetCategoriesModel(sequelize, Sequelize.DataTypes)
const CabinetSubCategories = CabinetSubCategoriesModel(sequelize, Sequelize.DataTypes)
const CabinetQuote = CabinetQuoteModel(sequelize, Sequelize.DataTypes)
const CabinetMaterial = CabinetMaterialModel(sequelize, Sequelize.DataTypes)
const PriceBookCategory = PriceBookCategoryModel(sequelize, Sequelize.DataTypes)
const PriceBook = PriceBookModel(sequelize, Sequelize.DataTypes)
const Worker = WorkerModel(sequelize, Sequelize.DataTypes)
const Project = projectModel(sequelize, Sequelize.DataTypes);
const InventoryAllocation = inventoryAllocationModel(sequelize, Sequelize.DataTypes);
const ProjectWorker = projectWorkerModel(sequelize, Sequelize.DataTypes);
const ProjectManagement = projectManangementModel(sequelize, Sequelize.DataTypes);
const EmployeeLeave = employeeLeave(sequelize, Sequelize.DataTypes);
const ProjectSetup = projectSetupModel(sequelize, Sequelize.DataTypes);
const ProjectRate = projectRateModel(sequelize, Sequelize.DataTypes);
const ProjectMaterial = projectMaterialModel(sequelize, Sequelize.DataTypes);
const ProjectVariation = projectVariationModel(sequelize, Sequelize.DataTypes);
const ProjectAmend = projectAmendModel(sequelize, Sequelize.DataTypes);
const EmployeeTimeSheet = employeeTimeSheetModel(sequelize, Sequelize.DataTypes);



// Prepare DB object
const db = {
  User,
  Role,
  Permission,
  Resource,
  Clients,
  Contacts,
  Suppliers,
  SupplierContacts,
  Inventory,
  Cabinet,
  Audit,
  Notification,
  CabinetCategories,
  CabinetSubCategories,
  CabinetQuote,
  CabinetMaterial,
  PriceBookCategory,
  PriceBook,
  Worker,
  Project,
  InventoryAllocation,
  ProjectWorker,
  ProjectManagement,
  EmployeeLeave,
  ProjectSetup,
  ProjectRate,
  ProjectMaterial,
  ProjectVariation,
  ProjectAmend,
  EmployeeTimeSheet,
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
