import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className={`navbar ${darkMode ? "dark" : "light"}`}>
      <div className="logo">📈 StockDash</div>
      <div className="links">
        <Link to="/">Dashboard</Link>
        <Link to="/portfolio">Portfolio</Link>
        {user ? <button onClick={logout}>Logout</button> : <Link to="/login">Login</Link>}
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}
