import express from "express";
import { login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import { checkAuth } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);

userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
