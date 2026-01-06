import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";

// Route imports
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import authRoutes from "./routes/auth.routes.js";
import geocodeRoutes from "./routes/geocode.routes.js";
import { seedDefaultAdmin } from "./utils/seedAdmin.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5174";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" })); // allow photo uploads
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/geocode", geocodeRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Quota-Controlled Event System API is running...");
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_invitation";
let memoryServer;

async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("Database connection failed:", err.message);
      process.exit(1);
    }

    console.warn(
      "Mongo connection failed (", err.message,
      "). Falling back to in-memory MongoDB for development."
    );

    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log("MongoDB connected (in-memory)");
  }
}

async function start() {
  await connectDatabase();
  await seedDefaultAdmin();

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );

  const shutdown = async () => {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
