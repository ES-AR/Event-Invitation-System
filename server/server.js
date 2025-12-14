import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

// Route imports
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";

// Load env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow photo uploads
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/event", eventRoutes);
app.use("/api/registration", registrationRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Quota-Controlled Event System API is running...");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
