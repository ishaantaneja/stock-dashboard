import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../api/api.js";
import STOCKS from "../api/stockList.js";
import StockChart from "../components/StockChart.jsx";
import TradeForm from "../components/TradeForm.jsx";

// --- Sub-components for better modularity ---

// Modern searchable stock selector
const StockSelector = ({ symbol, setSymbol, livePrices, filteredStocks }) => {
  return (
    <div className="relative w-full md:w-1/2">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search and select a stock..."
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        list="stocks"
      />
      <datalist id="stocks">
        {filteredStocks.map(s => (
          <option key={s.symbol} value={s.symbol}>
            {s.name} - ${livePrices[s.symbol]?.toFixed(2) || "0.00"}
          </option>
        ))}
      </datalist>
    </div>
  );
};

// Portfolio summary component
const PortfolioSummary = ({ portfolio, livePrices }) => {
  const analytics = (() => {
    let invested = 0;
    let current = 0;
    portfolio.positions.forEach(p => {
      invested += p.avgPrice * p.qty;
      current += (livePrices[p.symbol] || p.avgPrice) * p.qty;
    });
    const totalCurrent = current + (portfolio.cash || 0);
    const profitLoss = totalCurrent - (invested + (portfolio.cash || 0));
    return { invested, current: totalCurrent, profitLoss };
  })();

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-white">Portfolio Summary 📊</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Cash Balance</p>
          <p className="text-lg font-bold text-white">${portfolio.cash.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Total Invested</p>
          <p className="text-lg font-bold text-white">${analytics.invested.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Current Value</p>
          <p className="text-lg font-bold text-white">${analytics.current.toFixed(2)}</p>
        </div>
      </div>
      <div className={`p-4 rounded-lg text-center font-bold text-xl ${analytics.profitLoss >= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
        Profit / Loss: ${analytics.profitLoss.toFixed(2)}
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-3">Your Positions</h4>
        <div className="grid grid-cols-1 gap-4">
          {portfolio.positions.map(p => (
            <div key={p.symbol} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center transition-transform hover:scale-105">
              <div>
                <p className="text-md font-semibold text-white">{p.symbol}</p>
                <p className="text-sm text-gray-400">Qty: {p.qty}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Live: <span className="text-white font-bold">${(livePrices[p.symbol] || p.avgPrice).toFixed(2)}</span></p>
                <p className="text-sm text-gray-400">Avg Cost: <span className="text-white">${p.avgPrice.toFixed(2)}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [portfolio, setPortfolio] = useState(null);
  const [socket, setSocket] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

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

  useEffect(() => {
    if (socket) refreshPortfolio();
  }, [socket, refreshPortfolio]);

  useEffect(() => {
    if (!socket) return;
    const handlePriceUpdate = ({ symbol, price }) => {
      setLivePrices(prev => ({ ...prev, [symbol]: price }));
    };
    socket.on("priceUpdate", handlePriceUpdate);
    return () => socket.off("priceUpdate", handlePriceUpdate);
  }, [socket]);

  const filteredStocks = STOCKS.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans transition-colors duration-500">
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333, #000)', backgroundSize: '100% 100%' }}></div>
      <div className="relative z-10 container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Market Dashboard
          </h1>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <StockSelector 
              symbol={symbol} 
              setSymbol={setSymbol} 
              livePrices={livePrices} 
              filteredStocks={filteredStocks} 
            />
            <button
              onClick={refreshPortfolio}
              className="py-2 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
            >
              Refresh
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Stock Chart</h2>
              <StockChart symbol={symbol} />
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Place a Trade</h2>
              <TradeForm onTrade={refreshPortfolio} />
            </div>

            {/* Backend sleep notice */}
            <div className="bg-yellow-900 text-yellow-300 p-4 rounded-lg border border-yellow-700 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8.257 3.51a1.5 1.5 0 012.486 0L15.343 8a1.5 1.5 0 01-.628 2.25l-2.91 1.774a1.5 1.5 0 00-.73 1.096l-.88 2.592a1.5 1.5 0 01-2.618 0l-.88-2.592a1.5 1.5 0 00-.73-1.096L5.285 10.25a1.5 1.5 0 01-.628-2.25L8.257 3.51z" clipRule="evenodd"></path>
              </svg>
              <span>The backend may be sleeping. Please wait up to a minute for the service to wake up.</span>
            </div>

            {/* Credentials card */}
            <div className="bg-blue-900 text-blue-300 p-4 rounded-lg border border-blue-700">
              <h3 className="text-lg font-semibold mb-1">Demo Login Credentials</h3>
              <p><strong>Username:</strong> test@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </section>

          {portfolio && (
            <aside>
              <PortfolioSummary portfolio={portfolio} livePrices={livePrices} />
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}