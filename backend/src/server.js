import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import portfolioRoutes from "./routes/portfolio.js";
import stocksRoutes from "./routes/stocks.js";
import { getStockPrice } from "./services/stockService.js";
import User from "./models/User.js";
import Portfolio from "./models/Portfolio.js";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();

// ===== MIDDLEWARES =====
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stocks", stocksRoutes);

// ===== HTTP + SOCKET.IO SERVER =====
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN, methods: ["GET", "POST"] },
});

// ===== SOCKET.IO REALTIME =====
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  let interval;
  socket.on("subscribe", async (symbol) => {
    console.log(`User subscribed to ${symbol}`);

    // Clear previous interval if exists
    if (interval) clearInterval(interval);

    interval = setInterval(async () => {
      const price = await getStockPrice(symbol);
      socket.emit("priceUpdate", { symbol, price });
    }, 5000);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (interval) clearInterval(interval);
  });
});

// ===== CREATE DEFAULT TEST USER =====
async function createTestUser() {
  try {
    const existing = await User.findOne({ email: "test@example.com" });
    if (!existing) {
      const hash = await bcrypt.hash("password123", 10);
      const user = await User.create({ email: "test@example.com", passwordHash: hash });
      await Portfolio.create({ userId: user._id, positions: [], cash: 10000 });
      console.log("✅ Test user created: test@example.com / password123");
    } else {
      console.log("Test user already exists.");
    }
  } catch (err) {
    console.error("Error creating test user:", err);
  }
}

// ===== CONNECT DATABASE + START SERVER =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await createTestUser(); // ensure test user exists
    server.listen(process.env.PORT, () =>
      console.log(`Backend running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
