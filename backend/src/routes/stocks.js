import express from "express";
import { getPrice } from "../controllers/stocksController.js";

const router = express.Router();
router.get("/:symbol", getPrice);

export default router;
