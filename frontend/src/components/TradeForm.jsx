import React, { useState } from "react";
import API from "../api/api.js";
import STOCKS from "../api/stockList.js";

export default function TradeForm({ onTrade }) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("buy");
  const [qty, setQty] = useState(0);
  const [search, setSearch] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/portfolio/trade", { symbol, side, qty });
      alert("Trade executed");
      onTrade(data.portfolio);
    } catch (err) {
      alert(err.response?.data?.error || "Trade failed");
    }
  };

  // Filter stocks by search input (name or symbol)
  const filteredStocks = STOCKS.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit}>
      <h3>Trade</h3>

      {/* Search input */}
      <input
        placeholder="Search stock by name or symbol"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Stock selection dropdown */}
      <select value={symbol} onChange={e => setSymbol(e.target.value)} required>
        <option value="">-- Select Stock --</option>
        {filteredStocks.map(s => (
          <option key={s.symbol} value={s.symbol}>
            {s.name} ({s.symbol})
          </option>
        ))}
      </select>

      {/* Buy/Sell selector */}
      <select value={side} onChange={e => setSide(e.target.value)}>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>

      {/* Quantity input */}
      <input
        type="number"
        placeholder="Quantity"
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
        required
      />

      <button type="submit">Execute</button>
    </form>
  );
}
