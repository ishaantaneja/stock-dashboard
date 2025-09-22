import Portfolio from "../models/Portfolio.js";
import Trade from "../models/Trade.js";
import { getStockPrice } from "../services/stockService.js";

export async function getPortfolio(req, res) {
  const portfolio = await Portfolio.findOne({ userId: req.userId });
  res.json(portfolio);
}

export async function trade(req, res) {
  const { symbol, side, qty } = req.body;
  const price = await getStockPrice(symbol);

  const portfolio = await Portfolio.findOne({ userId: req.userId });

  if (side === "buy") {
    const cost = qty * price;
    if (portfolio.cash < cost) return res.status(400).json({ error: "Not enough cash" });

    portfolio.cash -= cost;
    const pos = portfolio.positions.find((p) => p.symbol === symbol);
    if (pos) {
      pos.avgPrice = (pos.avgPrice * pos.qty + price * qty) / (pos.qty + qty);
      pos.qty += qty;
    } else {
      portfolio.positions.push({ symbol, qty, avgPrice: price });
    }
  }

  if (side === "sell") {
    const pos = portfolio.positions.find((p) => p.symbol === symbol);
    if (!pos || pos.qty < qty) return res.status(400).json({ error: "Not enough shares" });

    portfolio.cash += qty * price;
    pos.qty -= qty;
    if (pos.qty === 0) {
      portfolio.positions = portfolio.positions.filter((p) => p.symbol !== symbol);
    }
  }

  await portfolio.save();
  await Trade.create({ userId: req.userId, symbol, side, qty, price });

  res.json({ message: "Trade executed", portfolio });
}
