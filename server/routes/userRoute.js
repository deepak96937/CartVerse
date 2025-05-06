import express from "express";
import { isAuth, login, logout, register } from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.get('/is-auth', authUser, isAuth); // GET is okay if no body is needed
userRouter.get('/logout', authUser, logout); // Use POST, not GET



export default userRouter;
