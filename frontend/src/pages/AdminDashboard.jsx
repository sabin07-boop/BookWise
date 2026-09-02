import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    books: 0,
    users: 0,
    reviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       * These endpoints must exist in your backend.
       * If your current backend uses different admin endpoints,
       * we can connect those next.
       */

      const requests = [fetch(`${API_URL}/api/books`)];

      const responses = await Promise.all(requests);

      const booksResponse = responses[0];
      const booksData = await booksResponse.json();

      if (!booksResponse.ok) {
        throw new Error(booksData.error || "Unable to load dashboard data.");
      }

      const books = Array.isArray(booksData.books)
        ? booksData.books
        : Array.isArray(booksData)
          ? booksData
          : [];

      setStats({
        books: books.length,
        users: 0,
        reviews: 0,
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="admin-dashboard">
      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f7fb;
          color: #172033;
        }

        .admin-topbar {
          height: 72px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 21px;
          font-weight: 800;
        }

        .admin-brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          font-size: 20px;
        }

        .admin-badge {
          margin-left: 8px;
          padding: 5px 10px;
          border-radius: 999px;
          background: #ede9fe;
          color: #5b21b6;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .05em;
        }

        .admin-user {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .admin-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #4f46e5;
          color: white;
          font-weight: 800;
        }

        .admin-user-info {
          display: flex;
          flex-direction: column;
        }

        .admin-user-name {
          font-weight: 700;
          font-size: 14px;
        }

        .admin-user-email {
          color: #64748b;
          font-size: 12px;
        }

        .admin-logout {
          border: 1px solid #e5e7eb;
          background: white;
          padding: 9px 14px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .admin-logout:hover {
          background: #f8fafc;
        }

        .admin-layout {
          display: flex;
          min-height: calc(100vh - 72px);
        }

        .admin-sidebar {
          width: 240px;
          background: #111827;
          color: white;
          padding: 28px 16px;
        }

        .sidebar-label {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
          padding: 0 12px;
          margin-bottom: 12px;
        }

        .sidebar-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: #cbd5e1;
          padding: 12px;
          border-radius: 9px;
          text-align: left;
          font-size: 14px;
          font-weight: 650;
          margin-bottom: 5px;
          cursor: pointer;
        }

        .sidebar-item:hover,
        .sidebar-item.active {
          background: #1f2937;
          color: white;
        }

        .admin-content {
          flex: 1;
          padding: 38px;
          max-width: 1400px;
        }

        .admin-heading {
          margin-bottom: 30px;
        }

        .admin-heading h1 {
          margin: 0 0 8px;
          font-size: 30px;
          font-weight: 850;
        }

        .admin-heading p {
          margin: 0;
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, .04);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          font-size: 21px;
        }

        .stat-title {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .stat-number {
          margin-top: 18px;
          font-size: 32px;
          font-weight: 850;
        }

        .dashboard-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, .04);
        }

        .dashboard-card h2 {
          margin: 0 0 8px;
          font-size: 19px;
        }

        .dashboard-card p {
          color: #64748b;
          margin: 0;
        }

        .admin-error {
          padding: 14px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        @media (max-width: 900px) {
          .admin-sidebar {
            display: none;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .admin-content {
            padding: 24px;
          }

          .admin-topbar {
            padding: 0 20px;
          }

          .admin-user-info {
            display: none;
          }
        }
      `}</style>

      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-icon">📚</div>
          <span>BookWise</span>
          <span className="admin-badge">Admin</span>
        </div>

        <div className="admin-user">
          <div className="admin-avatar">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div className="admin-user-info">
            <span className="admin-user-name">
              {user?.name || "Administrator"}
            </span>

            <span className="admin-user-email">{user?.email || ""}</span>
          </div>

          <button className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-label">Administration</div>

          <button className="sidebar-item active">📊 Dashboard</button>

          <button className="sidebar-item">📚 Manage Books</button>

          <button className="sidebar-item">👥 Users</button>

          <button className="sidebar-item">⭐ Reviews</button>

          <button className="sidebar-item">⚙️ Settings</button>
        </aside>

        <main className="admin-content">
          <div className="admin-heading">
            <h1>Admin Dashboard</h1>
            <p>
              Welcome back, {user?.name || "Administrator"}. Manage your
              BookWise platform from here.
            </p>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-title">TOTAL BOOKS</span>
                <div className="stat-icon">📚</div>
              </div>

              <div className="stat-number">{loading ? "..." : stats.books}</div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-title">TOTAL USERS</span>
                <div className="stat-icon">👥</div>
              </div>

              <div className="stat-number">{loading ? "..." : stats.users}</div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-title">REVIEWS</span>
                <div className="stat-icon">⭐</div>
              </div>

              <div className="stat-number">
                {loading ? "..." : stats.reviews}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Welcome to BookWise Administration</h2>
            <p>
              This is your protected administration area. Only accounts with the{" "}
              <strong>admin</strong> role should be able to access it.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
