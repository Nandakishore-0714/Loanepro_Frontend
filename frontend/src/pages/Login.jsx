import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginRole, setLoginRole] = useState("USER");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
        role: loginRole   // ✅ correct
      });

      const { role, id } = res.data;

      // Backend doesn't use JWT, so create simple token
      const token = "loggedin";

      // Save login info
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", id);

      // Redirect based on role
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }

    } catch (error) {
      console.error("Login failed:", error);

      alert(
        error.response?.data?.message ||
        "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-card">

        {/* LEFT SIDE */}
        <div className="login-left">
          <div className="brand-content">
            <h1>LoanPro</h1>
            <p>SDC - PROJECT 15</p>
            <div className="badge-pill">
              SECURE • FAST • TRANSPARENT
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right">
          <h2>Welcome Back</h2>

          <form className="login-form" onSubmit={handleSubmit}>

            {/* Role Selection */}
            <div className="form-group">
              <label>Login As</label>
              <div className="select-wrapper">
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Register */}
            <p className="switch-link">
              New user?
              <span onClick={() => navigate("/register")}>
                Create Account
              </span>
            </p>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;