import { Router } from "express";
import {
  forgotPassword,
  googleAuth,
  googleCallback,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/verify-email", verifyEmail);
authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
