import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles.css";

function UserDashboard() {
  const navigate = useNavigate();

  const [myLoans, setMyLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- Form State ---
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("");

  // --- Calculator State ---
  const [calcAmount, setCalcAmount] = useState(50000);
  const [calcRate, setCalcRate] = useState(8);
  const [calcDuration, setCalcDuration] = useState(12);

  // 🔐 Check Auth on Load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "USER") {
      navigate("/");
      return;
    }

    fetchLoans();
  }, []);

  // 🔥 FETCH USER LOANS
  const fetchLoans = async () => {
    try {
      const res = await API.get("/loans/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setMyLoans(res.data);
    } catch (error) {
      console.error("Error fetching loans:", error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 APPLY LOAN
  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await API.post(
        "/loans/apply",
        {
          amount: Number(amount),
          purpose,
          duration: Number(duration),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setAmount("");
      setPurpose("");
      setDuration("");

      fetchLoans();
    } catch (error) {
      console.error("Apply failed:", error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // --- EMI Calculator ---
  const calculatedInterest =
    calcAmount * (calcRate / 100) * (calcDuration / 12) || 0;

  const totalPayable = Number(calcAmount) + calculatedInterest;

  const monthlyInstallment =
    calcDuration > 0 ? totalPayable / calcDuration : 0;

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading dashboard...</h2>;
  }

  return (
    <div className="admin-layout dark-theme">

      <aside className="sidebar">
        <h2 className="logo">LoanPro</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li>My Loans</li>
        </ul>
        <div className="spacer"></div>
        <ul>
          <li onClick={handleLogout} className="logout-link">
            Logout
          </li>
        </ul>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <h1>User Dashboard</h1>
        </header>

        {/* EMI Calculator */}
        <section className="table-box" style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "20px" }}>
            EMI & Loan Calculator
          </h3>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>Loan Amount (₹)</label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
              />
            </div>

            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>Interest Rate (%)</label>
              <input
                type="number"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
              />
            </div>

            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>Duration (Months)</label>
              <input
                type="number"
                value={calcDuration}
                onChange={(e) => setCalcDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="stats-row" style={{ marginBottom: 0 }}>
            <div className="stat-box highlight">
              <p>Monthly EMI</p>
              <h3>₹{Math.round(monthlyInstallment).toLocaleString("en-IN")}</h3>
            </div>
            <div className="stat-box">
              <p>Total Interest</p>
              <h3>₹{Math.round(calculatedInterest).toLocaleString("en-IN")}</h3>
            </div>
            <div className="stat-box highlight-alt">
              <p>Total Payable</p>
              <h3>₹{Math.round(totalPayable).toLocaleString("en-IN")}</h3>
            </div>
          </div>
        </section>

        {/* Apply Loan */}
        <section className="table-box" style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "20px" }}>
            Apply for a New Loan
          </h3>

          <form
            style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
            onSubmit={handleApply}
          >
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Duration (Months)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Apply"}
            </button>
          </form>
        </section>

        {/* My Loans */}
        <section className="table-box">
          <h3 style={{ marginBottom: "20px" }}>
            My Applications
          </h3>

          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Interest</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>₹{loan.amount.toLocaleString("en-IN")}</td>
                  <td>{loan.purpose}</td>
                  <td>{loan.duration} months</td>
                  <td>
                    {loan.interest
                      ? `${loan.interest}%`
                      : "Pending Approval"}
                  </td>
                  <td>
                    <span className={`status ${loan.status.toLowerCase()}`}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </section>
      </main>
    </div>
  );
}

export default UserDashboard;