import express from "express";
import roleRouter from "./user.module/role.routes.js";
import permissionRouter from "./user.module/permissions.routes.js";
import userRouter from "./user.module/user.routes.js";
import resourceRouter from "./user.module/resource.routes.js";
import clientRouter from "./client.module/client.routes.js";
import contactRouter from "./client.module/contact.routes.js";


const router = express.Router();

router.use('/role', roleRouter);
router.use('/permission', permissionRouter);
router.use('/user', userRouter);
router.use('/resource', resourceRouter);
router.use('/client', clientRouter);
router.use('/contact', contactRouter);

export default router;
