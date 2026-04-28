import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import API from "../services/api";
import "../styles.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- View & Filter States ---
  const [view, setView] = useState("DASHBOARD"); // "DASHBOARD" or "REQUESTS"
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/");
      return;
    }
    fetchLoans();
  }, [navigate]);

  const fetchLoans = async () => {
    try {
      const res = await API.get("/loans");
      setLoans(res.data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestChange = (id, value) => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === id ? { ...loan, interest: Number(value) } : loan
      )
    );
  };

  const approveLoan = async (id, interest) => {
    if (interest <= 0) return alert("Please set a valid interest rate.");
    if (!window.confirm("Approve this loan?")) return;

    try {
      await API.put(`/loans/${id}/approve`, { interest });
      fetchLoans();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  const rejectLoan = async (id) => {
    if (!window.confirm("Reject this loan?")) return;
    try {
      await API.put(`/loans/${id}/reject`);
      fetchLoans();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // --- Filtering Logic ---
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesStatus = filterStatus === "ALL" || loan.status === filterStatus;
      const amount = loan.amount || 0;
      const matchesMin = minAmount === "" || amount >= Number(minAmount);
      const matchesMax = maxAmount === "" || amount <= Number(maxAmount);

      return matchesStatus && matchesMin && matchesMax;
    });
  }, [loans, filterStatus, minAmount, maxAmount]);

  // --- CSV Export (Reports) ---
  const exportToCSV = () => {
    const headers = "Applicant,Amount (INR),Interest Rate (%),Status\n";
    const rows = filteredLoans.map(
      (l) => `${l.userName || "Unknown"},${l.amount || 0},${l.interest || 0},${l.status}`
    );
    const csvContent = headers + rows.join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Loan_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Advanced Stats Calculation ---
  const pendingCount = loans.filter((l) => l.status === "PENDING").length;
  const approvedCount = loans.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = loans.filter((l) => l.status === "REJECTED").length;

  const totalLoaned = loans
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, loan) => sum + (loan.amount || 0), 0);

  const totalInterest = loans
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, loan) => sum + (loan.amount * ((loan.interest || 0) / 100)), 0);

  const statusChartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [pendingCount, approvedCount, rejectedCount],
        backgroundColor: ["#fbbf24", "#16a34a", "#dc2626"],
        hoverOffset: 15,
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#a1a1aa", padding: 20 } },
    },
    cutout: "70%",
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2>Syncing with Ledger...</h2>
      </div>
    );
  }

  // --- Shared Table Rendering Function ---
  const renderTableBody = (data) => (
    <tbody>
      {data.length > 0 ? (
        data.map((loan) => (
          <tr key={loan.id} className="table-row-smooth">
            <td>{loan.userName || "Unknown"}</td>
            <td>₹{loan.amount?.toLocaleString("en-IN")}</td>
            <td>
              <input
                type="number"
                min="0"
                max="100"
                value={loan.interest || ""}
                placeholder="0"
                disabled={loan.status !== "PENDING"}
                onChange={(e) => handleInterestChange(loan.id, e.target.value)}
                className="interest-input"
              />
            </td>
            <td>
              <span className={`status ${loan.status.toLowerCase()}`}>
                {loan.status}
              </span>
            </td>
            <td>
              <div className="action-group">
                <button
                  className="approve-btn"
                  disabled={loan.status !== "PENDING"}
                  onClick={() => approveLoan(loan.id, loan.interest || 0)}
                >
                  Approve
                </button>
                <button
                  className="reject-btn"
                  disabled={loan.status !== "PENDING"}
                  onClick={() => rejectLoan(loan.id)}
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
            No loan requests found.
          </td>
        </tr>
      )}
    </tbody>
  );

  return (
    <div className="admin-layout dark-theme">
      <aside className="sidebar">
        <h2 className="logo">LoanPro</h2>
        <ul>
          <li className={view === "DASHBOARD" ? "active" : ""} onClick={() => setView("DASHBOARD")}>
            Dashboard
          </li>
          <li className={view === "REQUESTS" ? "active" : ""} onClick={() => setView("REQUESTS")}>
            Loan Requests <span className="badge">{pendingCount}</span>
          </li>
        </ul>
        <div className="spacer"></div>
        <ul>
          <li onClick={handleLogout} className="logout-link">
            Logout
          </li>
        </ul>
      </aside>

      <main className="main-content">
        {view === "DASHBOARD" ? (
          // ==============================
          // VIEW: MAIN DASHBOARD OVERVIEW
          // ==============================
          <>
            <header className="topbar">
              <h1>System Overview</h1>
            </header>

            <section className="stats-row">
              <div className="stat-box">
                <p>Pending Actions</p>
                <h3 style={{ color: "#fbbf24" }}>{pendingCount}</h3>
              </div>
              <div className="stat-box">
                <p>Approved Loans</p>
                <h3>{approvedCount}</h3>
              </div>
              <div className="stat-box highlight">
                <p>Capital Disbursed</p>
                <h3>₹{totalLoaned.toLocaleString("en-IN")}</h3>
              </div>
              <div className="stat-box highlight-alt">
                <p>Projected Revenue</p>
                <h3>₹{totalInterest.toLocaleString("en-IN")}</h3>
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="chart-box">
                <h3>Loan Status Distribution</h3>
                <div style={{ height: "250px", marginTop: "20px" }}>
                  <Doughnut data={statusChartData} options={chartOptions} />
                </div>
              </section>

              <section className="table-box">
                <h3>Recent Applications</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Amount</th>
                      <th>Rate %</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  {/* Show only top 5 recent loans on the dashboard view */}
                  {renderTableBody(loans.slice(0, 5))}
                </table>
              </section>
            </div>
          </>
        ) : (
          // ==============================
          // VIEW: LOAN REQUESTS & REPORTS
          // ==============================
          <>
            <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Manage Loan Requests</h1>
              <button className="export-btn" onClick={exportToCSV}>
                Download CSV Report
              </button>
            </header>

            {/* --- Filter Bar --- */}
            <section className="filter-bar">
              <div className="filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Min Amount (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="filter-group">
                <label>Max Amount (₹)</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="500000"
                />
              </div>

              <button
                className="reset-btn"
                onClick={() => {
                  setMinAmount("");
                  setMaxAmount("");
                  setFilterStatus("ALL");
                }}
              >
                Reset
              </button>
            </section>

            {/* --- Filtered Table --- */}
            <section className="table-box">
              <h3 style={{ marginBottom: "15px", color: "#a1a1aa" }}>
                Showing {filteredLoans.length} Result(s)
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Amount</th>
                    <th>Rate %</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                {renderTableBody(filteredLoans)}
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;