import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles.css";

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/auth/register", {
        email,
        password,
        role,
      });

      alert("Registration successful! Please login.");
      navigate("/login");

    } catch (error) {
      console.error("Registration failed:", error);

      alert(
        error.response?.data?.message ||
        "Registration failed. Please try again."
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
          <h2>Create Account</h2>

          <form className="login-form" onSubmit={handleRegister}>

            {/* Role */}
            <div className="form-group">
              <label>Register As</label>
              <div className="select-wrapper">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
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
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <p className="switch-link">
              Already have an account?
              <span onClick={() => navigate("/login")}>
                Login
              </span>
            </p>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Register;