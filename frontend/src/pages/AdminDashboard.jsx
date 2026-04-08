import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import API from "../services/api";
import "../styles.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {

  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Check Admin Auth
  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
      navigate("/");
      return;
    }

    fetchLoans();
  }, [navigate]);

  // 🔥 Fetch Loans
  const fetchLoans = async () => {
    try {
      const res = await API.get("/loans");
      setLoans(res.data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Update Interest locally
  const handleInterestChange = (id, value) => {
    setLoans(
      loans.map((loan) =>
        loan.id === id ? { ...loan, interest: Number(value) } : loan
      )
    );
  };

  // 🔥 Approve Loan
  const approveLoan = async (id, interest) => {
    if (!window.confirm("Approve this loan?")) return;

    try {
      await API.put(`/loans/${id}/approve`, { interest });
      fetchLoans();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  // 🔥 Reject Loan
  const rejectLoan = async (id) => {
    if (!window.confirm("Reject this loan?")) return;

    try {
      await API.put(`/loans/${id}/reject`);
      fetchLoans();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  // 🔓 Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // 📊 Stats
  const approvedCount = loans.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = loans.filter((l) => l.status === "REJECTED").length;

  const totalLoaned = loans
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, loan) => sum + loan.amount, 0);

  const totalInterest = loans
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, loan) => sum + loan.amount * (loan.interest / 100), 0);

  const statusPieData = {
    labels: ["Approved", "Rejected"],
    datasets: [
      {
        data: [approvedCount, rejectedCount],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading dashboard...</h2>;
  }

  return (
    <div className="admin-layout dark-theme">

      <aside className="sidebar">
        <h2 className="logo">LoanPro</h2>

        <ul>
          <li className="active">Dashboard</li>
          <li>Loan Requests</li>
          <li>Reports</li>
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
          <h1>Admin Dashboard</h1>
        </header>

        <section className="stats-row">
          <div className="stat-box">
            <p>Approved</p>
            <h3>{approvedCount}</h3>
          </div>

          <div className="stat-box">
            <p>Rejected</p>
            <h3>{rejectedCount}</h3>
          </div>

          <div className="stat-box highlight">
            <p>Total Loaned</p>
            <h3>₹{totalLoaned.toLocaleString("en-IN")}</h3>
          </div>

          <div className="stat-box highlight-alt">
            <p>Expected Interest</p>
            <h3>₹{totalInterest.toLocaleString("en-IN")}</h3>
          </div>
        </section>

        <section className="chart-box">
          <div style={{ height: "300px" }}>
            <Pie data={statusPieData} options={chartOptions} />
          </div>
        </section>

        <section className="table-box">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Interest %</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>

                  <td>{loan.userName}</td>

                  <td>
                    ₹{loan.amount.toLocaleString("en-IN")}
                  </td>

                  <td>
                    <input
                      type="number"
                      value={loan.interest || 0}
                      disabled={loan.status !== "PENDING"}
                      onChange={(e) =>
                        handleInterestChange(loan.id, e.target.value)
                      }
                      className="interest-input"
                    />
                  </td>

                  <td>
                    <span className={`status ${loan.status.toLowerCase()}`}>
                      {loan.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="approve-btn"
                      disabled={loan.status !== "PENDING"}
                      onClick={() =>
                        approveLoan(loan.id, loan.interest || 0)
                      }
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

export default AdminDashboard;