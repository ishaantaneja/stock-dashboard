import React, { useState } from "react";
import API from "../api/api.js";

export default function TradeForm({ onTrade }) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("buy");
  const [qty, setQty] = useState(0);

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

  return (
    <form onSubmit={handleSubmit}>
      <h3>Trade</h3>
      <input placeholder="Symbol" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} required />
      <select value={side} onChange={e => setSide(e.target.value)}>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
      <input type="number" placeholder="Quantity" value={qty} onChange={e => setQty(Number(e.target.value))} required />
      <button type="submit">Execute</button>
    </form>
  );
}
