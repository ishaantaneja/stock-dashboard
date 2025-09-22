import React, { useEffect, useState } from "react";
import API from "../api/api.js";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { io } from "socket.io-client";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [livePrices, setLivePrices] = useState({});

  // Fetch portfolio from backend
  const fetchPortfolio = async () => {
    try {
      const { data } = await API.get("/portfolio");
      setPortfolio(data);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Live price WebSocket
  useEffect(() => {
    if (!portfolio) return;
    const socket = io("http://localhost:4000");
    portfolio.positions.forEach(p => socket.emit("subscribe", p.symbol));

    socket.on("priceUpdate", ({ symbol, price }) => {
      setLivePrices(prev => ({ ...prev, [symbol]: price }));
    });

    return () => socket.disconnect();
  }, [portfolio]);

  // Portfolio analytics
  const calculateAnalytics = () => {
    if (!portfolio) return { invested: 0, current: 0, profitLoss: 0 };

    let invested = 0;
    let current = 0;

    portfolio.positions.forEach((p) => {
      invested += p.avgPrice * p.qty;
      current += (livePrices[p.symbol] || p.avgPrice) * p.qty;
    });

    const cash = portfolio.cash;
    const totalCurrent = current + cash;
    const profitLoss = totalCurrent - (invested + cash);

    return { invested, current: totalCurrent, profitLoss };
  };

  const analytics = calculateAnalytics();

  // Prepare PieChart data
  const pieData =
    portfolio?.positions.map((p) => ({
      name: p.symbol,
      value: (livePrices[p.symbol] || p.avgPrice) * p.qty,
    })) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4567"];

  if (!portfolio) return <p>Loading portfolio...</p>;

  return (
    <div>
      <h2>Portfolio</h2>
      <p>Cash: ${portfolio.cash.toFixed(2)}</p>

      <table border="1">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Avg Price</th>
            <th>Live Price</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.positions.map((p) => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.qty}</td>
              <td>${p.avgPrice.toFixed(2)}</td>
              <td>${(livePrices[p.symbol] || p.avgPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Portfolio Analytics */}
      <div style={{ marginTop: "20px" }}>
        <h3>Portfolio Analytics</h3>
        <p>Total Invested: ${analytics.invested.toFixed(2)}</p>
        <p>Current Value + Cash: ${analytics.current.toFixed(2)}</p>
        <p>Profit / Loss: ${analytics.profitLoss.toFixed(2)}</p>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Asset Allocation</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      )}
    </div>
  );
}
