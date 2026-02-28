import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginRole, setLoginRole] = useState("User");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegister) {
        // 🔥 REGISTER (Backend API)
        await API.post("/auth/register", {
          email,
          password,
          role: loginRole.toUpperCase(),
        });

        alert("Registration successful! Please login.");
        setIsRegister(false);
        return;
      }

      // 🔥 LOGIN (Backend API)
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // Expected backend response:
      // { token: "...", role: "ADMIN" or "USER" }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }

    } catch (error) {
      console.error(error);
      alert("Authentication failed");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-card">

        {/* Left Side */}
        <div className="login-left">
          <div className="brand-content">
            <h1>LoanPro</h1>
            <p>Smart Loan Management Platform</p>
            <div className="badge-pill">
              SECURE • FAST • TRANSPARENT
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Login As</label>
              <div className="select-wrapper">
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              {isRegister ? "Register" : "Login"}
            </button>

            <p className="switch-link">
              {isRegister ? "Already have an account?" : "New user?"}
              <span onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? " Login" : " Register"}
              </span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;