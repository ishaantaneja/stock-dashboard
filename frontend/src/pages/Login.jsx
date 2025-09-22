import React, { useState } from "react";
import API from "../api/api.js";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setUser(data.token);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}