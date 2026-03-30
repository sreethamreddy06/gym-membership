import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9090";

const MEMBERSHIP_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: 5000,
    caption: "Flexible access for a strong start",
    badge: "Starter",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 15000,
    caption: "Best value for transformation goals",
    badge: "Most popular",
  },
];

const EXPERIENCE_CARDS = [
  {
    title: "Strength Floor",
    detail: "Coach-led sessions, smart programming, and progressive lifting plans.",
  },
  {
    title: "Cardio Burn",
    detail: "HIIT, endurance blocks, and calorie-crushing routines built for consistency.",
  },
  {
    title: "Recovery Zone",
    detail: "Mobility, stretching, and trainer guidance to keep members returning.",
  },
];

const AI_SUGGESTIONS = [
  "Which members are expiring soon?",
  "Suggest the best plan for a beginner.",
  "How should I pitch yearly membership?",
];

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }

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
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about memberships, renewals, pricing, or trainer assignments.",
    },
  ]);

  const getMembers = useCallback(async () => {
    const url = `${API_BASE}/members`;

    try {
      setLoading(true);
      setError("");
      const res = await fetchWithRetry(url);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

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
    if (!validateForm()) {
      return;
    }

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

      if (!res.ok) {
        throw new Error(text || "Failed to add member");
      }

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
    if (!validateForm() || editId == null) {
      return;
    }

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

      if (!res.ok) {
        throw new Error(text || "Failed to update member");
      }

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

      if (!res.ok) {
        throw new Error(text || "Failed to delete member");
      }

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
    if (!searchTerm.trim()) {
      return true;
    }

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
    if (!member.endDate) {
      return false;
    }

    const daysLeft = (new Date(member.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;
  const trainersCount = new Set(
    members.map((member) => member.trainer?.trim()).filter(Boolean)
  ).size;
  const selectedPlanDetails =
    MEMBERSHIP_PLANS.find((membershipPlan) => membershipPlan.name === plan) ?? null;
  const yearlyMembers = members.filter((member) => member.plan === "Yearly").length;
  const retentionRate = members.length
    ? Math.round((activeMembers / members.length) * 100)
    : 0;

  const askAssistant = async (message) => {
    if (!message.trim()) {
      return;
    }

    const userMessage = { role: "user", text: message.trim() };
    setAssistantMessages((current) => [...current, userMessage]);
    setAssistantInput("");
    setAssistantLoading(true);

    try {
      const res = await fetch(`${API_BASE}/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to reach the AI assistant");
      }

      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply || "I could not generate a response." },
      ]);
    } catch (err) {
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: err.message || "The assistant is unavailable right now.",
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-glow app-glow--left" aria-hidden="true" />
      <div className="app-glow app-glow--right" aria-hidden="true" />

      <div className="app-surface">
        <header className="topbar">
          <div className="topbar__brand">
            <div className="brand-badge" aria-hidden="true">
              fit
            </div>
            <div>
              <p className="topbar__eyebrow">Gym Membership Platform</p>
              <h1>PulseFit Club</h1>
            </div>
          </div>

          <nav className="topbar__nav" aria-label="Sections">
            <a href="#membership">Memberships</a>
            <a href="#operations">Operations</a>
            <a href="#assistant">AI Coach</a>
          </nav>

          <button
            type="button"
            className="button button--dark"
            onClick={getMembers}
            disabled={loading}
          >
            {loading ? "Syncing..." : "Refresh data"}
          </button>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="section-tag">Train. Recover. Repeat.</p>
            <h2>
              A fitness-first membership app inspired by modern gym brands.
            </h2>
            <p className="hero-copy__text">
              Sell plans, onboard members, assign trainers, and run your front desk from
              one high-energy experience built for a premium gym.
            </p>

            <div className="hero-actions">
              <a className="button button--primary" href="#membership">
                View plans
              </a>
              <a className="button button--ghost" href="#operations">
                Manage members
              </a>
            </div>

            <div className="hero-metrics">
              <article className="metric-card">
                <span className="metric-card__label">Active members</span>
                <strong>{activeMembers}</strong>
                <p>Members currently training with live access.</p>
              </article>
              <article className="metric-card">
                <span className="metric-card__label">Renewals this week</span>
                <strong>{expiringMembers}</strong>
                <p>High-intent opportunities ready for follow-up.</p>
              </article>
              <article className="metric-card">
                <span className="metric-card__label">Retention score</span>
                <strong>{retentionRate}%</strong>
                <p>Share of members staying active in the roster.</p>
              </article>
            </div>
          </div>

          <aside className="hero-spotlight">
            <p className="hero-spotlight__kicker">Live desk pulse</p>
            <div className="hero-spotlight__stat">
              <span>Total members</span>
              <strong>{members.length}</strong>
            </div>
            <div className="hero-spotlight__stat">
              <span>Coaches assigned</span>
              <strong>{trainersCount}</strong>
            </div>
            <div className="hero-spotlight__stat">
              <span>Yearly members</span>
              <strong>{yearlyMembers}</strong>
            </div>
            <p className="hero-spotlight__meta">Connected to {API_BASE}</p>
          </aside>
        </section>

        <section className="experience-strip">
          {EXPERIENCE_CARDS.map((card) => (
            <article key={card.title} className="experience-card">
              <p className="experience-card__title">{card.title}</p>
              <p className="experience-card__detail">{card.detail}</p>
            </article>
          ))}
        </section>

        <section id="membership" className="plans-layout">
          <div className="section-heading">
            <p className="section-tag">Memberships</p>
            <h3>Simple plans, premium positioning</h3>
            <p>
              Present plans like a modern fitness product while keeping pricing crystal clear
              for your front desk team.
            </p>
          </div>

          <div className="pricing-grid">
            {MEMBERSHIP_PLANS.map((membershipPlan) => (
              <button
                key={membershipPlan.id}
                type="button"
                className={`pricing-card${
                  plan === membershipPlan.name ? " pricing-card--active" : ""
                }`}
                onClick={() => setPlan(membershipPlan.name)}
              >
                <span className="pricing-card__badge">{membershipPlan.badge}</span>
                <h4>{membershipPlan.name}</h4>
                <p className="pricing-card__price">Rs. {membershipPlan.price}</p>
                <p className="pricing-card__caption">{membershipPlan.caption}</p>
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="error-banner" role="alert">
            <span className="error-banner__icon" aria-hidden="true">
              !
            </span>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="loading-bar" aria-live="polite">
            <span className="loading-bar__shine" />
          </div>
        ) : null}

        <main id="operations" className="operations-grid">
          <section className="panel panel--form">
            <div className="section-heading section-heading--compact">
              <p className="section-tag">Front Desk</p>
              <h3>{editId ? "Update member profile" : "Create new membership"}</h3>
              <p>
                Capture the lead, lock the plan, and assign a trainer without leaving the
                dashboard.
              </p>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Enter member name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Mobile</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Plan</span>
                <select value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="">Select membership plan</option>
                  {MEMBERSHIP_PLANS.map((membershipPlan) => (
                    <option key={membershipPlan.id} value={membershipPlan.name}>
                      {membershipPlan.name} - Rs. {membershipPlan.price}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--full">
                <span>Trainer</span>
                <input
                  type="text"
                  placeholder="Assign trainer or coach"
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                />
              </label>
            </div>

            {selectedPlanDetails ? (
              <div className="selection-banner">
                <span>Selected plan</span>
                <strong>
                  {selectedPlanDetails.name} - Rs. {selectedPlanDetails.price}
                </strong>
                <p>{selectedPlanDetails.caption}</p>
              </div>
            ) : null}

            <div className="form-actions">
              {editId ? (
                <>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={updateMember}
                    disabled={loading}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={clearForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={addMember}
                  disabled={loading}
                >
                  Add member
                </button>
              )}
            </div>
          </section>

          <section id="assistant" className="panel panel--assistant">
            <div className="section-heading section-heading--compact">
              <p className="section-tag">AI Coach</p>
              <h3>Smart help for sales and retention</h3>
              <p>
                Use your AI assistant to pitch plans, identify renewals, and improve member
                engagement.
              </p>
            </div>

            <div className="assistant-suggestions">
              {AI_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => askAssistant(suggestion)}
                  disabled={assistantLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="assistant-thread">
              {assistantMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`assistant-bubble assistant-bubble--${message.role}`}
                >
                  <span className="assistant-bubble__role">
                    {message.role === "assistant" ? "AI Coach" : "You"}
                  </span>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            <div className="assistant-composer">
              <textarea
                rows="4"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask about renewals, sales scripts, trainers, or member engagement..."
              />
              <button
                type="button"
                className="button button--primary"
                onClick={() => askAssistant(assistantInput)}
                disabled={assistantLoading || !assistantInput.trim()}
              >
                {assistantLoading ? "Thinking..." : "Ask assistant"}
              </button>
            </div>
          </section>
        </main>

        <section className="panel panel--table">
          <div className="table-head">
            <div className="section-heading section-heading--compact">
              <p className="section-tag">Operations</p>
              <h3>Member roster</h3>
              <p>
                {filteredMembers.length === members.length
                  ? "View every member, active plan, coach assignment, and status in one place."
                  : `Showing ${filteredMembers.length} of ${members.length} members after filtering.`}
              </p>
            </div>

            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search members, plans, trainers, dates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="button button--ghost"
                onClick={getMembers}
                disabled={loading}
              >
                Reload
              </button>

              {searchTerm ? (
                <button
                  type="button"
                  className="button button--dark"
                  onClick={() => setSearchTerm("")}
                  disabled={loading}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">No members yet</p>
              <p className="empty-state__text">
                Start by adding your first member from the front desk panel above.
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
                            member.status === "Active" ? "status-pill status-pill--ok" : "status-pill status-pill--bad"
                          }
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button
                          type="button"
                          className="button button--small button--edit"
                          onClick={() => editMember(member)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--small button--delete"
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
      </div>
    </div>
  );
}

export default App;
