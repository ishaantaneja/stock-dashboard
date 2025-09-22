import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  symbol: String,
  side: { type: String, enum: ["buy", "sell"] },
  qty: Number,
  price: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Trade", tradeSchema);
