import axios from "axios";

export async function getStockPrice(symbol) {
  try {
    // Example: Finnhub (replace with your API provider)
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.STOCK_API_KEY}`;
    const { data } = await axios.get(url);
    return data.c; // current price
  } catch (err) {
    console.error(err.message);
    return null;
  }
}
