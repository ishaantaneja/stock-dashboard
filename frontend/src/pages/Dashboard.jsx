import React, { useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import StockChart from "../components/StockChart.jsx";
import TradeForm from "../components/TradeForm.jsx";
import API from "../api/api.js";
import STOCKS from "../api/stockList.js";

// --- STYLES ---
// Injecting CSS via a style tag to keep everything in one file.
const DashboardStyles = () => (
  <style>{`
    :root {
      --bg-color: #1a1a1e;
      --panel-bg: #25252a;
      --border-color: #3a3a40;
      --text-primary: #f0f0f0;
      --text-secondary: #a0a0a0;
      --accent-color: #007bff;
      --positive-color: #28a745;
      --negative-color: #dc3545;
      --warning-bg: #fff3cd;
      --warning-border: #ffeeba;
      --warning-text: #856404;
      --info-bg: #e3f2fd;
      --info-border: #90caf9;
      --info-text: #0d47a1;
    }

    .dashboard-container {
      padding: 2rem;
      background-color: var(--bg-color);
      color: var(--text-primary);
      min-height: 100vh;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .dashboard-header h2 { margin: 0; }
    
    .dashboard-header .controls { display: flex; gap: 1rem; }
    
    .dashboard-header input, .dashboard-header select, .dashboard-header button {
      background-color: var(--panel-bg);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease-in-out;
    }
    
    .dashboard-header input:focus, .dashboard-header select:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px var(--accent-color);
    }
    
    .dashboard-header button {
      cursor: pointer;
      background-color: var(--accent-color);
      border-color: var(--accent-color);
    }
    
    .dashboard-header button:hover { filter: brightness(1.2); }
    
    .info-cards-container { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
    
    .info-card { padding: 1.5rem; border: 1px solid; border-radius: 8px; flex: 1; }
    .info-card.warning { background-color: var(--warning-bg); border-color: var(--warning-border); color: var(--warning-text); }
    .info-card.info { background-color: var(--info-bg); border-color: var(--info-border); color: var(--info-text); }
    .info-card h3 { margin-top: 0; }
    
    .dashboard-main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-template-rows: auto auto;
      grid-template-areas: "chart portfolio" "trade portfolio";
      gap: 1.5rem;
    }
    
    .panel { background-color: var(--panel-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); }
    
    .chart-panel { grid-area: chart; }
    .trade-panel { grid-area: trade; }
    .portfolio-panel { grid-area: portfolio; }
    
    .portfolio-summary h3 { margin-top: 0; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; }
    
    .analytics { margin-bottom: 1.5rem; }
    .analytics p { display: flex; justify-content: space-between; margin: 0.5rem 0; }
    .analytics span { font-weight: bold; }
    
    .portfolio-summary table { width: 100%; border-collapse: collapse; }
    .portfolio-summary th, .portfolio-summary td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--border-color); }
    .portfolio-summary th { color: var(--text-secondary); }
    
    .positive { color: var(--positive-color); transition: color 0.3s; }
    .negative { color: var(--negative-color); transition: color 0.3s; }
    
    .loader { display: flex; justify-content: center; align-items: center; height: 100%; font-size: 1.2rem; color: var(--text-secondary); }
  `}</style>
);

// --- LOCAL PRESENTATIONAL COMPONENTS ---

const DashboardHeader = ({
  search, onSearchChange, symbol, onSymbolChange,
  filteredStocks, livePrices, onRefresh
}) => (
  <header className="dashboard-header">
    <h2>Market Dashboard</h2>
    <div className="controls">
      <input type="search" placeholder="Search stock..." value={search} onChange={e => onSearchChange(e.target.value)} />
      <select value={symbol} onChange={e => onSymbolChange(e.target.value)}>
        {filteredStocks.map(s => (
          <option key={s.symbol} value={s.symbol}>
            {s.name} ({s.symbol}) - ${livePrices[s.symbol]?.toFixed(2) || '...'}
          </option>
        ))}
      </select>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  </header>
);

const PortfolioSummary = ({ portfolio, livePrices }) => {
  const analytics = useMemo(() => {
    if (!portfolio?.positions) return { invested: 0, current: 0, profitLoss: 0 };
    const invested = portfolio.positions.reduce((acc, p) => acc + p.avgPrice * p.qty, 0);
    const currentValue = portfolio.positions.reduce((acc, p) => acc + (livePrices[p.symbol] || p.avgPrice) * p.qty, 0);
    const totalCurrentValue = currentValue + portfolio.cash;
    const totalInvestedValue = invested + portfolio.cash;
    return {
      invested,
      current: totalCurrentValue,
      profitLoss: totalCurrentValue - totalInvestedValue,
    };
  }, [portfolio, livePrices]);

  if (!portfolio) return <p>No portfolio data available.</p>;
  const profitLossClass = analytics.profitLoss >= 0 ? 'positive' : 'negative';

  return (
    <div className="portfolio-summary">
      <h3>Portfolio Summary</h3>
      <div className="analytics">
        <p>Cash: <span>${portfolio.cash?.toFixed(2)}</span></p>
        <p>Total Value: <span>${analytics.current.toFixed(2)}</span></p>
        <p>Profit / Loss: <span className={profitLossClass}>${analytics.profitLoss.toFixed(2)}</span></p>
      </div>
      <table>
        <thead><tr><th>Symbol</th><th>Qty</th><th>Avg Price</th><th>Live Price</th></tr></thead>
        <tbody>
          {portfolio.positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td><td>{p.qty}</td><td>${p.avgPrice.toFixed(2)}</td><td>${(livePrices[p.symbol] || p.avgPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InfoCard = ({ children, type = 'info' }) => (
  <div className={`info-card ${type}`}>{children}</div>
);

// --- MAIN DASHBOARD COMPONENT ---

export default function Dashboard() {
  // --- STATE AND LOGIC ---
  const [symbol, setSymbol] = useState('AAPL');
  const [search, setSearch] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [socket, setSocket] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Portfolio refresh logic
  const refreshPortfolio = useCallback(async () => {
    if (!socket) return;
    setIsLoading(true);
    try {
      const { data } = await API.get('/portfolio');
      setPortfolio(data);
      data.positions?.forEach(p => socket.emit('subscribe', p.symbol));
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Live price listener
  useEffect(() => {
    if (!socket) return;
    const handlePriceUpdate = ({ symbol, price }) => {
      setLivePrices(prev => ({ ...prev, [symbol]: price }));
    };
    socket.on('priceUpdate', handlePriceUpdate);
    return () => socket.off('priceUpdate', handlePriceUpdate);
  }, [socket]);
  
  // Memoized derived state
  const filteredStocks = useMemo(() =>
    STOCKS.filter(
      s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.symbol.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  // --- RENDER ---
  return (
    <>
      <DashboardStyles />
      <div className="dashboard-container">
        <DashboardHeader
          search={search}
          onSearchChange={setSearch}
          symbol={symbol}
          onSymbolChange={setSymbol}
          filteredStocks={filteredStocks}
          livePrices={livePrices}
          onRefresh={refreshPortfolio}
        />
        <div className="info-cards-container">
          <InfoCard type="warning">
            ⚠️ Since the backend is on a free-tier host, it may sleep after 15 minutes of inactivity. The initial load could take up to a minute.
          </InfoCard>
          <InfoCard type="info">
            <h3>Demo Credentials</h3>
            <p><b>Username:</b> test@example.com</p>
            <p><b>Password:</b> password123</p>
          </InfoCard>
        </div>
        <div className="dashboard-main-grid">
          <div className="panel chart-panel">
            <StockChart symbol={symbol} />
          </div>
          <div className="panel trade-panel">
            <TradeForm onTrade={refreshPortfolio} />
          </div>
          <div className="panel portfolio-panel">
            {isLoading && !portfolio ? (
              <div className="loader">Loading Portfolio...</div>
            ) : (
              <PortfolioSummary portfolio={portfolio} livePrices={livePrices} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}