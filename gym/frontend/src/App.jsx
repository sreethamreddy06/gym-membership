import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9090";
const MEMBERSHIP_PLANS = [
  { id: "monthly", name: "Monthly", price: 5000, caption: "30-day access" },
  { id: "yearly", name: "Yearly", price: 15000, caption: "Best long-term value" },
];

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

function App() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [plan, setPlan] = useState("");
  const [trainer, setTrainer] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getMembers = useCallback(async () => {
    const url = `${API_BASE}/members`;
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      const errorMsg = err.message.includes("Failed to fetch")
        ? `Backend server at ${API_BASE} is unreachable. Check CORS or server status.`
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMembers();
  }, [getMembers]);

  const clearForm = () => {
    setName("");
    setEmail("");
    setMobile("");
    setPlan("");
    setTrainer("");
    setEditId(null);
  };

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !plan.trim() || !trainer.trim()) {
      setError("Please fill in all fields before submitting.");
      return false;
    }
    return true;
  };

  const addMember = async () => {
    if (!validateForm()) return;

    const member = { name, email, mobile, plan, trainer };
    const url = `${API_BASE}/members/add`;

    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to add member");

      await getMembers();
      clearForm();
    } catch (err) {
      const errorMsg = err.message.includes("Failed to fetch")
        ? `Backend server at ${API_BASE} is unreachable. Check CORS or server status.`
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async () => {
    if (!validateForm() || editId == null) return;

    const member = { id: editId, name, email, mobile, plan, trainer };
    const url = `${API_BASE}/members/update`;

    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to update member");

      await getMembers();
      clearForm();
    } catch (err) {
      const errorMsg = err.message.includes("Failed to fetch")
        ? `Backend server at ${API_BASE} is unreachable. Check CORS or server status.`
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id) => {
    const url = `${API_BASE}/members/delete/${id}`;

    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url, {
        method: "DELETE",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to delete member");
      await getMembers();
    } catch (err) {
      const errorMsg = err.message.includes("Failed to fetch")
        ? `Backend server at ${API_BASE} is unreachable. Check CORS or server status.`
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const editMember = (member) => {
    setEditId(member.id);
    setName(member.name);
    setEmail(member.email);
    setMobile(member.mobile);
    setPlan(member.plan);
    setTrainer(member.trainer);
    setError("");
  };

  const filteredMembers = members.filter((member) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (member.name && member.name.toLowerCase().includes(q)) ||
      (member.email && member.email.toLowerCase().includes(q)) ||
      (member.mobile && member.mobile.toLowerCase().includes(q)) ||
      (member.plan && member.plan.toLowerCase().includes(q)) ||
      (member.trainer && member.trainer.toLowerCase().includes(q)) ||
      (member.joinDate &&
        new Date(member.joinDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (member.startDate &&
        new Date(member.startDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (member.endDate &&
        new Date(member.endDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (member.status && member.status.toLowerCase().includes(q))
    );
  });

  const activeMembers = members.filter((member) => member.status === "Active").length;
  const expiringMembers = members.filter((member) => {
    if (!member.endDate) return false;
    const daysLeft = (new Date(member.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;
  const trainersCount = new Set(
    members.map((member) => member.trainer?.trim()).filter(Boolean)
  ).size;
  const selectedPlanDetails =
    MEMBERSHIP_PLANS.find((membershipPlan) => membershipPlan.name === plan) ?? null;

  return (
    <div className="dashboard">
      <div className="dashboard-bg" aria-hidden="true" />
      <div className="dashboard-grid" aria-hidden="true" />

      <header className="header">
        <div className="hero-shell">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <span />
            </div>
            <div>
              <p className="eyebrow">Gym Membership Hub</p>
              <h1 className="title">Build a stronger member experience</h1>
              <p className="subtitle">
                Track sign-ups, manage plans, assign trainers, and keep your gym
                membership desk moving with confidence.
              </p>
            </div>
          </div>

          <div className="hero-banner">
            <p className="hero-banner__label">Front desk status</p>
            <p className="hero-banner__value">
              {loading ? "Syncing member activity" : "Membership system online"}
            </p>
            <p className="hero-banner__meta">
              API base: {API_BASE}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className="stat-pill" title="Total members loaded">
            <span className="stat-pill__label">Total members</span>
            <span className="stat-pill__value">{members.length}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary refresh-btn"
            onClick={getMembers}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <section className="summary-strip">
        <article className="summary-card">
          <p className="summary-card__label">Active members</p>
          <p className="summary-card__value">{activeMembers}</p>
          <p className="summary-card__meta">Members with a live plan right now</p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Renewals due</p>
          <p className="summary-card__value">{expiringMembers}</p>
          <p className="summary-card__meta">Plans ending in the next 7 days</p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Assigned coaches</p>
          <p className="summary-card__value">{trainersCount}</p>
          <p className="summary-card__meta">Unique trainers linked to members</p>
        </article>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon" aria-hidden="true">
            !
          </span>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-bar" aria-live="polite">
          <span className="loading-bar__shine" />
        </div>
      )}

      <main className="layout">
        <section className="card card-form">
          <div className="card-head">
            <p className="card-kicker">New Membership</p>
            <h2 className="card-title">{editId ? "Edit member" : "New member"}</h2>
            <p className="card-desc">
              {editId
                ? "Update member details and keep the gym roster accurate."
                : "Capture member details, choose a plan, and add them to your gym roster."}
            </p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Mobile</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+1 or local number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Plan</span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="">Select membership plan</option>
                {MEMBERSHIP_PLANS.map((membershipPlan) => (
                  <option key={membershipPlan.id} value={membershipPlan.name}>
                    {membershipPlan.name} - Rs. {membershipPlan.price}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-span">
              <span className="field-label">Trainer</span>
              <input
                type="text"
                placeholder="Assigned coach or trainer"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
              />
            </label>
          </div>

          <div className="plan-strip">
            {MEMBERSHIP_PLANS.map((membershipPlan) => (
              <button
                key={membershipPlan.id}
                type="button"
                className={`plan-card${
                  plan === membershipPlan.name ? " plan-card--active" : ""
                }`}
                onClick={() => setPlan(membershipPlan.name)}
              >
                <span className="plan-card__name">{membershipPlan.name}</span>
                <span className="plan-card__price">Rs. {membershipPlan.price}</span>
                <span className="plan-card__caption">{membershipPlan.caption}</span>
              </button>
            ))}
          </div>

          {selectedPlanDetails ? (
            <p className="plan-note">
              Selected plan: <strong>{selectedPlanDetails.name}</strong> for
              <strong> Rs. {selectedPlanDetails.price}</strong>.
            </p>
          ) : null}

          <div className="form-actions">
            {editId ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateMember}
                  disabled={loading}
                >
                  Save changes
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearForm}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={addMember}
                disabled={loading}
              >
                Add member
              </button>
            )}
          </div>
        </section>

        <section className="card card-table">
          <div className="card-head card-head--row">
            <div>
              <p className="card-kicker">Gym Roster</p>
              <h2 className="card-title">Member directory</h2>
              <p className="card-desc">
                {filteredMembers.length === members.length
                  ? "All registered gym members in the current roster."
                  : `Showing ${filteredMembers.length} of ${members.length} members after filtering.`}
              </p>
            </div>

            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="search-input"
                  placeholder="Filter by name, email, plan, trainer, dates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={getMembers}
                disabled={loading}
              >
                Reload
              </button>

              {searchTerm ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSearchTerm("")}
                  disabled={loading}
                >
                  Clear filter
                </button>
              ) : null}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">No members yet</p>
              <p className="empty-state__text">
                Use the form above to register your first member.
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Plan</th>
                    <th>Trainer</th>
                    <th>Join</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="mono">{member.id}</td>
                      <td className="cell-strong">{member.name}</td>
                      <td>{member.email}</td>
                      <td className="mono">{member.mobile}</td>
                      <td>{member.plan}</td>
                      <td>{member.trainer}</td>
                      <td>
                        {member.joinDate
                          ? new Date(member.joinDate).toLocaleDateString()
                          : "--"}
                      </td>
                      <td>
                        {member.startDate
                          ? new Date(member.startDate).toLocaleDateString()
                          : "--"}
                      </td>
                      <td>
                        {member.endDate
                          ? new Date(member.endDate).toLocaleDateString()
                          : "--"}
                      </td>
                      <td>
                        <span
                          className={
                            member.status === "Active" ? "pill pill--ok" : "pill pill--bad"
                          }
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-edit"
                          onClick={() => editMember(member)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-delete"
                          onClick={() => deleteMember(member.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
