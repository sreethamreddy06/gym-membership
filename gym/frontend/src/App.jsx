import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:9090";

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

  const [lastRequest, setLastRequest] = useState("");
  const [lastStatus, setLastStatus] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const updateConsole = (method, url, res, bodyPreview) => {
    setLastRequest(`${method} ${url}`);
    setLastStatus(`${res.status} ${res.statusText}`);
    setLastResponse(bodyPreview);
  };

  // Retry logic with exponential backoff
  const fetchWithRetry = async (url, options = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, { ...options, timeout: 5000 });
        return res;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  // GET /members
  const getMembers = async () => {
    const url = `${API_BASE}/members`;
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMembers(data);
      updateConsole("GET", url, res, JSON.stringify(data, null, 2));
    } catch (err) {
      const errorMsg = err.message.includes("Failed to fetch") 
        ? "Backend server is not running. Please start the backend server on port 9090."
        : err.message || "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMembers();
  }, []);

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

      updateConsole("POST", url, res, text || "Member added");
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

      updateConsole("PUT", url, res, text || "Member updated");
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

      updateConsole("DELETE", url, res, text || "Member deleted");
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
      <header className="header">
        <div>
          <h1 className="title">Gym Membership Manager</h1>
        </div>
        <button className="refresh-btn" onClick={getMembers} disabled={loading}>
          Refresh Members
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Processing request...</div>}

      <div className="layout">
        <div className="left-panel">
          <section className="card">
            <h2 className="card-title">
              {editId ? "Edit Member" : "Add New Member"}
            </h2>
            <div className="form">
              <input
                type="text"
                placeholder="Member Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />

              <input
                type="text"
                placeholder="Plan (e.g. Monthly, Yearly)"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              />

              <input
                type="text"
                placeholder="Assigned Trainer"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
              />

              <div className="form-actions">
                {editId ? (
                  <>
                    <button onClick={updateMember} disabled={loading}>
                      Update Member
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={clearForm}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={addMember} disabled={loading}>
                    Add Member
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Members</h2>
            <div className="search-row">
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, mobile, plan, trainer, dates, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={getMembers}
                disabled={loading}
              >
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSearchTerm("")}
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
            {members.length === 0 ? (
              <p className="empty-state">No members yet. Add one above.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Plan</th>
                    <th>Trainer</th>
                    <th>Join Date</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.mobile}</td>
                      <td>{m.plan}</td>
                      <td>{m.trainer}</td>
                      <td>{m.joinDate ? new Date(m.joinDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{m.startDate ? new Date(m.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A'}</td>
                      <td className={m.status === 'Active' ? 'status-active' : 'status-expired'}>{m.status}</td>
                      <td style={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                        <button
                          className="edit"
                          onClick={() => editMember(m)}
                          disabled={loading}
                          style={{ marginRight: '4px' }}
                        >
                          Edit
                        </button>
                        <button
                          className="delete"
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;