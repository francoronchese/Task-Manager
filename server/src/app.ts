import express from "express";
import authRouter from "./routes/auth.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Health check endpoint to verify the server is running
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "Server is running OK" });
});

// API routes
app.use("/api/auth", authRouter);

// Centralized error handler
app.use(errorHandler);

export default app;
