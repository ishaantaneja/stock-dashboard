import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  positions: [
    {
      symbol: String,
      qty: Number,
      avgPrice: Number,
    },
  ],
  cash: { type: Number, default: 10000 }, // start with demo cash
});

export default mongoose.model("Portfolio", portfolioSchema);
