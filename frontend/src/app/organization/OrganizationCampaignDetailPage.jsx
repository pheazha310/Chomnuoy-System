import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Pencil, Plus } from "lucide-react";
import ROUTES from "@/constants/routes.js";
import { normalizeCampaign } from "@/services/campaign-service.js";
import OrganizationSidebar from "./OrganizationSidebar.jsx";
import OrganizationIdentityPill from "./OrganizationIdentityPill.jsx";
import "./organization.css";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatMoney = (value) => (
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
);

export default function OrganizationCampaignDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [donations, setDonations] = useState([]);
  const [velocityDays, setVelocityDays] = useState(30);
  const [velocitySeries, setVelocitySeries] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    goal_amount: "",
    start_date: "",
    end_date: "",
    status: "",
  });

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    if (!id) return;
    setLoading(true);
    setError("");
    fetch(`${apiBase}/campaigns/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaign (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        setCampaign(data);
        setEditForm({
          title: data?.title || "",
          category: data?.category || "",
          description: data?.description || "",
          goal_amount: data?.goal_amount ?? "",
          start_date: data?.start_date || "",
          end_date: data?.end_date || "",
          status: data?.status || "",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaign.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    if (!id) return;

    let alive = true;
    const loadDonations = () => {
      fetch(`${apiBase}/campaigns/${id}/donations`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load donations (${response.status})`);
          }
          return response.json();
        })
        .then((data) => {
          if (!alive) return;
          setDonations(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : "Failed to load donations.");
        });
    };

    loadDonations();
    const timer = window.setInterval(loadDonations, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    if (!id) return;
    fetch(`${apiBase}/campaigns/${id}/velocity?days=${velocityDays}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load velocity (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        const series = Array.isArray(data?.series) ? data.series : [];
        setVelocitySeries(series);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load velocity.");
        setVelocitySeries([]);
      });
  }, [id, velocityDays]);

  const stats = useMemo(() => {
    const normalizedCampaign = normalizeCampaign(campaign);
    const raised = Number(normalizedCampaign?.raisedAmount || 0);
    const goal = Number(normalizedCampaign?.goalAmount || 0);
    const progress = goal ? Math.round((raised / goal) * 100) : 0;
    const daysRemaining = getDaysRemaining(campaign?.end_date);
    const donors = donations.length > 0 ? donations.length : Math.max(0, Math.floor(raised / 50));
    return { raised, goal, progress, daysRemaining, donors };
  }, [campaign, donations]);

  const velocityMax = useMemo(() => {
    if (velocitySeries.length === 0) return 1;
    return Math.max(...velocitySeries.map((entry) => Number(entry.total || 0)), 1);
  }, [velocitySeries]);

  const handleExportReport = () => {
    if (!campaign) return;
    const payload = {
      campaign,
      stats,
      donations,
      velocity: velocitySeries,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-${campaign.id}-report.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePostUpdate = async () => {
    if (!campaign || !updateText.trim()) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    setUpdating(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/campaign_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          update_description: updateText.trim(),
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to post update (${response.status})`);
      }
      setUpdateText("");
      setShowUpdateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post update.");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditChange = (field) => (event) => {
    setEditForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!campaign) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    setUpdating(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          category: editForm.category.trim(),
          description: editForm.description.trim(),
          goal_amount: Number(editForm.goal_amount || 0),
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          status: editForm.status || campaign.status,
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to update campaign (${response.status})`);
      }
      const updated = await response.json();
      setCampaign(updated);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main org-cpd-main">
        <section className="org-cpd-shell">
          <header className="org-cpd-header">
            <div>
              <p className="org-cpd-kicker">Campaign</p>
              <h1>{campaign?.title || "Campaign Detail"}</h1>
              <p className="org-cpd-subtitle">Detailed performance analytics and real-time donation tracking.</p>
            </div>
            <div className="org-cpd-actions">
              <OrganizationIdentityPill />
              <button
                type="button"
                className="org-cpd-btn"
                onClick={() => setEditMode((prev) => !prev)}
              >
                <Pencil className="h-4 w-4" />
                {editMode ? "Editing" : "Edit Campaign"}
              </button>
              <button type="button" className="org-cpd-btn" onClick={handleExportReport}>
                <Download className="h-4 w-4" />
                Export Report
              </button>
              <button type="button" className="org-cpd-btn primary" onClick={() => setShowUpdateModal(true)}>
                <Plus className="h-4 w-4" />
                Post Update
              </button>
            </div>
          </header>

          {showUpdateModal ? (
            <div className="org-cpd-modal">
              <div className="org-cpd-modal-card">
                <h3>Post a Campaign Update</h3>
                <p>Share progress, milestones, or donor shout-outs.</p>
                <textarea
                  rows={5}
                  value={updateText}
                  onChange={(event) => setUpdateText(event.target.value)}
                  placeholder="Write a short update for donors..."
                />
                <div className="org-cpd-modal-actions">
                  <button type="button" onClick={() => setShowUpdateModal(false)}>
                    Cancel
                  </button>
                  <button type="button" onClick={handlePostUpdate} disabled={updating || !updateText.trim()}>
                    {updating ? "Posting..." : "Post Update"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {loading ? <p className="org-cpd-status">Loading campaign...</p> : null}
          {error ? <p className="org-cpd-status error">{error}</p> : null}

          <div className="org-cpd-stats">
            <article className="org-cpd-stat">
              <p>Total Raised</p>
              <h3>{formatMoney(stats.raised)}</h3>
              <span>+12% from last week</span>
            </article>
            <article className="org-cpd-stat">
              <p>Progress</p>
              <h3>{stats.progress}%</h3>
              <div className="org-cpd-progress">
                <span style={{ width: `${stats.progress}%` }} />
              </div>
              <span>Goal: {formatMoney(stats.goal)}</span>
            </article>
            <article className="org-cpd-stat">
              <p>Total Donors</p>
              <h3>{stats.donors}</h3>
              <span>{Math.max(1, Math.floor(stats.donors / 4))} recurring donors</span>
            </article>
            <article className="org-cpd-stat">
              <p>Days Remaining</p>
              <h3>{typeof stats.daysRemaining === "number" ? `${stats.daysRemaining} Days` : "--"}</h3>
              <span>Campaign ends {campaign?.end_date || "TBD"}</span>
            </article>
          </div>

          <section className="org-cpd-card org-cpd-edit-card">
            <div className="org-cpd-card-head">
              <h2>Campaign Summary</h2>
              {editMode ? (
                <div className="org-cpd-edit-actions">
                  <button type="button" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveEdit} disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="org-cpd-edit-grid">
              <label>
                Title
                {editMode ? (
                  <input value={editForm.title} onChange={handleEditChange("title")} />
                ) : (
                  <span>{campaign?.title || "-"}</span>
                )}
              </label>
              <label>
                Category
                {editMode ? (
                  <input value={editForm.category} onChange={handleEditChange("category")} />
                ) : (
                  <span>{campaign?.category || "-"}</span>
                )}
              </label>
              <label>
                Goal Amount
                {editMode ? (
                  <input type="number" value={editForm.goal_amount} onChange={handleEditChange("goal_amount")} />
                ) : (
                  <span>{formatMoney(campaign?.goal_amount)}</span>
                )}
              </label>
              <label>
                Status
                {editMode ? (
                  <select value={editForm.status} onChange={handleEditChange("status")}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span>{campaign?.status || "-"}</span>
                )}
              </label>
              <label>
                Start Date
                {editMode ? (
                  <input type="date" value={editForm.start_date} onChange={handleEditChange("start_date")} />
                ) : (
                  <span>{campaign?.start_date || "-"}</span>
                )}
              </label>
              <label>
                End Date
                {editMode ? (
                  <input type="date" value={editForm.end_date} onChange={handleEditChange("end_date")} />
                ) : (
                  <span>{campaign?.end_date || "-"}</span>
                )}
              </label>
              <label className="org-cpd-edit-desc">
                Description
                {editMode ? (
                  <textarea rows={4} value={editForm.description} onChange={handleEditChange("description")} />
                ) : (
                  <span>{campaign?.description || "-"}</span>
                )}
              </label>
            </div>
          </section>

          <div className="org-cpd-grid">
            <section className="org-cpd-card">
              <div className="org-cpd-card-head">
                <h2>Fundraising Velocity</h2>
                <div className="org-cpd-tabs">
                  <button type="button" onClick={() => setVelocityDays(7)} className={velocityDays === 7 ? "is-active" : ""}>7D</button>
                  <button type="button" onClick={() => setVelocityDays(30)} className={velocityDays === 30 ? "is-active" : ""}>30D</button>
                  <button type="button" onClick={() => setVelocityDays(365)} className={velocityDays === 365 ? "is-active" : ""}>All Time</button>
                </div>
              </div>
              <div className="org-cpd-chart">
                {(velocitySeries.length > 0 ? velocitySeries : [{ total: 0, date: "na" }]).map((item, index) => (
                  <span
                    key={`${item.date || index}`}
                    style={{ height: `${Math.round((Number(item.total || 0) / velocityMax) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="org-cpd-chart-labels">
                {velocitySeries.length > 0 ? (
                  <>
                    <span>{formatDate(velocitySeries[0]?.date)}</span>
                    <span>{formatDate(velocitySeries[Math.floor(velocitySeries.length / 3)]?.date)}</span>
                    <span>{formatDate(velocitySeries[Math.floor((velocitySeries.length * 2) / 3)]?.date)}</span>
                    <span>{formatDate(velocitySeries[velocitySeries.length - 1]?.date)}</span>
                  </>
                ) : (
                  <>
                    <span>--</span>
                    <span>--</span>
                    <span>--</span>
                    <span>--</span>
                  </>
                )}
              </div>
            </section>

            <section className="org-cpd-card">
              <div className="org-cpd-card-head">
                <h2>Recent Donations</h2>
                <button type="button" className="org-cpd-link">View All Donations</button>
              </div>
              <div className="org-cpd-table">
                <div className="org-cpd-row head">
                  <span>Donor Name</span>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {donations.map((donation) => (
                  <div className="org-cpd-row" key={donation.id}>
                    <span>{donation.donor_name}</span>
                    <span>{formatDate(donation.created_at)}</span>
                    <span>{formatMoney(donation.amount)}</span>
                    <span className={String(donation.status).toLowerCase() === "completed" ? "chip success" : "chip pending"}>
                      {donation.status}
                    </span>
                    <button type="button" className="org-cpd-more">...</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <button type="button" className="org-cpd-back" onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGNS)}>
            Back to campaigns
          </button>
        </section>
      </main>
    </div>
  );
}
