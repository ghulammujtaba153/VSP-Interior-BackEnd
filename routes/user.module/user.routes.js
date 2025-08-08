import express from 'express';
import { createUser, deleteUser, getUserById, getUserByToken, getUsers, loginUser, resetUserPassword, updateUser, updateUserStatus } from '../../controller/user.module/user.controller.js';

const userRouter = express.Router();

userRouter.post('/create', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-user-by-token', getUserByToken);
userRouter.get('/get', getUsers);
userRouter.get('/get/:id', getUserById);
userRouter.put('/update/:id', updateUser);
userRouter.delete('/delete/:id', deleteUser);
userRouter.put('/update-status/:id', updateUserStatus);
userRouter.put('/update-password/:token', resetUserPassword);


export default userRouter;
