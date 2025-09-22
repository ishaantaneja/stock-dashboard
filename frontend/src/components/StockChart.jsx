import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { io } from "socket.io-client";

export default function StockChart({ symbol }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socket.emit("subscribe", symbol);

    socket.on("priceUpdate", ({ price }) => {
      setData(prev => [...prev.slice(-29), { time: new Date().toLocaleTimeString(), price }]);
    });

    return () => socket.disconnect();
  }, [symbol]);

  return (
    <div className="stock-chart">
      <h3>{symbol} Price Trend</h3>
      <LineChart width={500} height={250} data={data}>
        <XAxis dataKey="time" />
        <YAxis domain={['auto','auto']} />
        <Tooltip />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="price" stroke="#00D8FF" />
      </LineChart>
    </div>
  );
}
