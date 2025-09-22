import { getStockPrice } from "../services/stockService.js";

export async function getPrice(req, res) {
  const { symbol } = req.params;
  const price = await getStockPrice(symbol);
  res.json({ symbol, price });
}
