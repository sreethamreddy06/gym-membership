import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9090";

// Retry logic with exponential backoff
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
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

  // GET /members
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
        ? "Backend server is not running. Please start the backend server on port 9090."
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

  // POST /members/add
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
        ? "Backend server is not running. Please start the backend server on port 9090."
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // PUT /members/update
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
        ? "Backend server is not running. Please start the backend server on port 9090."
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // DELETE /members/delete/{id}
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
        ? "Backend server is not running. Please start the backend server on port 9090."
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const editMember = (m) => {
    setEditId(m.id);
    setName(m.name);
    setEmail(m.email);
    setMobile(m.mobile);
    setPlan(m.plan);
    setTrainer(m.trainer);
    setError("");
  };

  const filteredMembers = members.filter((m) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.mobile && m.mobile.toLowerCase().includes(q)) ||
      (m.plan && m.plan.toLowerCase().includes(q)) ||
      (m.trainer && m.trainer.toLowerCase().includes(q)) ||
      (m.joinDate && new Date(m.joinDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (m.startDate && new Date(m.startDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (m.endDate && new Date(m.endDate).toLocaleDateString().toLowerCase().includes(q)) ||
      (m.status && m.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="dashboard">
      <div className="dashboard-bg" aria-hidden="true" />

      <header className="header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="eyebrow">Operations</p>
            <h1 className="title">Gym Membership</h1>
            <p className="subtitle">
              Add members, assign plans, and keep records in sync with your API.
            </p>
          </div>
        </div>
        <div className="header-actions">
          <div className="stat-pill" title="Total members loaded">
            <span className="stat-pill__label">Members</span>
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
            <h2 className="card-title">
              {editId ? "Edit member" : "New member"}
            </h2>
            <p className="card-desc">
              {editId
                ? "Update details and save to push changes to the server."
                : "Fill in contact and plan details, then add to the roster."}
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
              <input
                type="text"
                placeholder="Monthly, yearly, trial…"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              />
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
              <h2 className="card-title">Directory</h2>
              <p className="card-desc">
                {filteredMembers.length === members.length
                  ? "All members in the current list."
                  : `Showing ${filteredMembers.length} of ${members.length} after filter.`}
              </p>
            </div>
            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="search-input"
                  placeholder="Filter by name, email, plan, trainer, dates…"
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
                  {filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="mono">{m.id}</td>
                      <td className="cell-strong">{m.name}</td>
                      <td>{m.email}</td>
                      <td className="mono">{m.mobile}</td>
                      <td>{m.plan}</td>
                      <td>{m.trainer}</td>
                      <td>
                        {m.joinDate
                          ? new Date(m.joinDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {m.startDate
                          ? new Date(m.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {m.endDate
                          ? new Date(m.endDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={
                            m.status === "Active"
                              ? "pill pill--ok"
                              : "pill pill--bad"
                          }
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-edit"
                          onClick={() => editMember(m)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-delete"
                          onClick={() => deleteMember(m.id)}
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