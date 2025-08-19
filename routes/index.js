import express from "express";
import roleRouter from "./user.module/role.routes.js";
import permissionRouter from "./user.module/permissions.routes.js";
import userRouter from "./user.module/user.routes.js";
import resourceRouter from "./user.module/resource.routes.js";
import clientRouter from "./client.module/client.routes.js";
import contactRouter from "./client.module/contact.routes.js";
import suppliersRouter from "./suppliers.module.js/suppliers.routes.js";
import supplierContactsRouter from "./suppliers.module.js/supplierContacts.routes.js";
import inventoryRouter from "./inventory.module/inventory.routes.js";
import cabinetRouter from "./cabinet.module/cabinet.routes.js";
import auditRouter from "./audit.module/audit.routes.js";
import notificationRouter from "./notification.module.js/notification.routes.js";

const router = express.Router();

router.use('/role', roleRouter);
router.use('/permission', permissionRouter);
router.use('/user', userRouter);
router.use('/resource', resourceRouter);
router.use('/client', clientRouter);
router.use('/contact', contactRouter);
router.use('/suppliers', suppliersRouter);
router.use('/supplier-contacts', supplierContactsRouter);
router.use('/inventory', inventoryRouter);
router.use('/cabinet', cabinetRouter);
router.use('/audit', auditRouter);
router.use("/notification", notificationRouter)

export default router;
