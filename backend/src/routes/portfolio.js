import express from "express";
import { getPortfolio, trade } from "../controllers/portfolioController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", authMiddleware, getPortfolio);
router.post("/trade", authMiddleware, trade);

export default router;
