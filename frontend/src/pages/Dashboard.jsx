import React, { useState, useEffect } from "react";
import StockChart from "../components/StockChart.jsx";
import TradeForm from "../components/TradeForm.jsx";
import API from "../api/api.js";

export default function Dashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [portfolio, setPortfolio] = useState(null);

  const refreshPortfolio = async () => {
    try {
      const { data } = await API.get("/portfolio");
      setPortfolio(data);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    }
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

  const analytics = portfolio ? {
    invested: portfolio.positions.reduce((acc, p) => acc + p.avgPrice * p.qty, 0),
    current: portfolio.positions.reduce((acc, p) => acc + p.avgPrice * p.qty, 0) + (portfolio.cash || 0),
  } : { invested: 0, current: 0 };

  analytics.profitLoss = analytics.current - analytics.invested;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Market Dashboard</h2>
        <div>
          <input
            placeholder="Stock Symbol"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
          />
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
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map(p => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{p.qty}</td>
                    <td>${p.avgPrice.toFixed(2)}</td>
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
