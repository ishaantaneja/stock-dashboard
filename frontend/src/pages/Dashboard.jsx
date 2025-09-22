import React, { useState, useEffect, useCallback } from "react";
import StockChart from "../components/StockChart.jsx";
import TradeForm from "../components/TradeForm.jsx";
import API from "../api/api.js";
import { io } from "socket.io-client";
import STOCKS from "../api/stockList.js";

export default function Dashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [portfolio, setPortfolio] = useState(null);
  const [socket, setSocket] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [search, setSearch] = useState("");

  // Initialize socket once
  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Refresh portfolio & subscribe to live updates
  const refreshPortfolio = useCallback(async () => {
    try {
      const { data } = await API.get("/portfolio");
      setPortfolio(data);

      if (socket && data.positions) {
        data.positions.forEach(p => socket.emit("subscribe", p.symbol));
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    }
  }, [socket]);

  // Fetch portfolio on mount
  useEffect(() => {
    if (socket) refreshPortfolio();
  }, [socket, refreshPortfolio]);

  // Live price updates
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = ({ symbol, price }) => {
      setLivePrices(prev => ({ ...prev, [symbol]: price }));
    };

    socket.on("priceUpdate", handlePriceUpdate);

    return () => socket.off("priceUpdate", handlePriceUpdate);
  }, [socket]);

  // Filter stocks by search input
  const filteredStocks = STOCKS.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Portfolio analytics
  const analytics = portfolio
    ? (() => {
        let invested = 0;
        let current = 0;
        portfolio.positions.forEach(p => {
          invested += p.avgPrice * p.qty;
          current += (livePrices[p.symbol] || p.avgPrice) * p.qty;
        });
        const totalCurrent = current + (portfolio.cash || 0);
        return { invested, current: totalCurrent, profitLoss: totalCurrent - invested };
      })()
    : { invested: 0, current: 0, profitLoss: 0 };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Market Dashboard</h2>
        <div>
          {/* Searchable stock dropdown */}
          <input
            placeholder="Search stock by name or symbol"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={symbol} onChange={e => setSymbol(e.target.value)}>
            {filteredStocks.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.name} ({s.symbol}) - ${livePrices[s.symbol]?.toFixed(2) || "0.00"}
              </option>
            ))}
          </select>
          <button onClick={refreshPortfolio}>Refresh Portfolio</button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="chart-panel">
          <StockChart symbol={symbol} />
        </div>

        <div className="trade-panel">
          <TradeForm onTrade={refreshPortfolio} />
        </div>

        {portfolio && (
          <div className="portfolio-summary">
            <h3>Portfolio Summary</h3>
            <p>Cash: ${portfolio.cash.toFixed(2)}</p>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Live Price</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map(p => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{p.qty}</td>
                    <td>${p.avgPrice.toFixed(2)}</td>
                    <td>${(livePrices[p.symbol] || p.avgPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="analytics">
              <p>Total Invested: ${analytics.invested.toFixed(2)}</p>
              <p>Current Value + Cash: ${analytics.current.toFixed(2)}</p>
              <p>Profit / Loss: ${analytics.profitLoss.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
