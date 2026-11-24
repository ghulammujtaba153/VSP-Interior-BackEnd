import express from 'express';
import { createUser, deleteUser, getStaffProfile, getUserById, getUserByToken, getUsers, loginUser, resetUserPassword, updateUser, updateUserStatus } from '../../controller/user/user.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { attachAuthUser, requireSelfOrHr } from '../../middleware/hrPermissionMiddleware.js';
import { hrAdmin, hrSelfOrAdminById } from '../../middleware/hrRouteGuards.js';

const userRouter = express.Router();

userRouter.post('/create', ...hrAdmin, createUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-user-by-token', authMiddleware, getUserByToken);
userRouter.get('/get', ...hrAdmin, getUsers);
userRouter.get('/get/:id', authMiddleware, attachAuthUser, requireSelfOrHr({ paramKey: 'id' }), getUserById);
userRouter.put('/update/:id', authMiddleware, attachAuthUser, requireSelfOrHr({ paramKey: 'id' }), updateUser);
userRouter.delete('/delete/:id', ...hrAdmin, deleteUser);
userRouter.put('/update-status/:id', ...hrAdmin, updateUserStatus);
userRouter.put('/update-password/:token', resetUserPassword);
userRouter.get('/staff/:id', authMiddleware, attachAuthUser, requireSelfOrHr({ paramKey: 'id' }), getStaffProfile);


export default userRouter;
