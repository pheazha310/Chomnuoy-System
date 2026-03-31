import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";
import ROUTES from "@/constants/routes.js";
import { fetchCampaigns } from "@/services/campaign-service.js";
import OrganizationSidebar from "./OrganizationSidebar.jsx";
import OrganizationIdentityPill from "./OrganizationIdentityPill.jsx";
import { useGlobalTheme } from "@/hooks/useOrganizationSettings";
import "./organization.css";

const tabs = ["All Campaigns", "Active", "Past", "Drafts"];
const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FCD9B6"/><stop offset="100%" stop-color="#FFF7ED"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><text x="50%" y="50%" font-size="34" font-family="Source Sans 3, Noto Sans Khmer, sans-serif" text-anchor="middle" fill="#475569">Campaign Image</text></svg>'
  );

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatProgressLabel(progress, suffix) {
  if (progress > 0 && progress < 1) return `<1% ${suffix}`;
  return `${Math.round(progress)}% ${suffix}`;
}

function escapeCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function resolveCampaignImage(item) {
  const candidates = [item?.image_url, item?.image, item?.image_path];

  return candidates.find((value) => typeof value === "string" && value.trim())
    ? candidates
    : [];
}

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem("chomnuoy_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem("chomnuoy_org_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  const parts = String(name || "Organization").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function OrganizationCampaignsPage() {
  const navigate = useNavigate();
  const { displayPrefs } = useGlobalTheme();
  const [activeTab, setActiveTab] = useState("All Campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Category");
  const [selectedSort, setSelectedSort] = useState("Latest First");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeNotificationTab, setActiveNotificationTab] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getStorageFileUrl = (path) => {
    if (!path) return "";
    const rawPath = String(path).trim();
    if (
      rawPath.startsWith("http://") ||
      rawPath.startsWith("https://") ||
      rawPath.startsWith("blob:") ||
      rawPath.startsWith("data:")
    ) {
      return rawPath;
    }

    const normalizedPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const appBase = apiBase.replace(/\/api\/?$/, "");
    if (normalizedPath.startsWith("uploads/")) {
      return `${appBase}/${normalizedPath}`;
    }
    if (normalizedPath.startsWith("storage/")) {
      return `${appBase}/${normalizedPath}`;
    }
    if (normalizedPath.startsWith("files/")) {
      return `${apiBase}/${normalizedPath}`;
    }
    const relativePath = normalizedPath.startsWith("storage/")
      ? normalizedPath.replace(/^storage\//, "")
      : normalizedPath;
    const encodedPath = relativePath
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${apiBase}/files/${encodedPath}`;
  };

  const getCampaignImageUrl = (item) => {
    const candidates = resolveCampaignImage(item);

    for (const candidate of candidates) {
      const rawValue = String(candidate || "").trim();
      if (!rawValue) continue;
      return getStorageFileUrl(rawValue);
    }

    return placeholderImage;
  };

  const normalizeStatus = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "active") return "Active";
    if (value === "completed") return "Completed";
    if (value === "draft") return "Draft";
    return "Active";
  };

  const statusToneMap = {
    Active: "bg-emerald-500 text-white",
    Completed: "bg-[#64748B] text-white",
    Draft: "bg-[#F97316] text-white",
  };

  const actionLabelMap = {
    Active: "View Details",
    Completed: "View Results",
    Draft: "Resume Editing",
  };

  const actionToneMap = {
    Active: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#FFF7ED]",
    Completed: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#F1F5F9]",
    Draft: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#FFF7ED]",
  };

  const session = getOrganizationSession();
  const storedProfile = getStoredProfile();
  const organizationName = storedProfile?.name || session?.name || "Organization";
  const organizationLogo = storedProfile?.logo || "";
  const organizationInitials = getInitials(organizationName);
  const themeClass = displayPrefs.highContrast
    ? "theme-contrast"
    : displayPrefs.darkMode
      ? "theme-dark"
      : "";

  useEffect(() => {
    const session = getOrganizationSession();
    const organizationId = Number(session?.userId ?? 0);
    setLoading(true);
    setError("");
    fetchCampaigns()
      .then((items) => {
        const filtered = organizationId
          ? items.filter((item) => Number(item.organizationId) === organizationId)
          : items;
        const mapped = filtered.map((item) => {
          const status = normalizeStatus(item.status);
          return {
            id: item.id,
            status,
            statusTone: statusToneMap[status],
            category: item.category || "General",
            title: item.title || "Untitled Campaign",
            description: item.description || "No description provided.",
            campaignType: item.campaignType || (item.materialItem ? "material" : "monetary"),
            materialItem: item.materialItem || null,
            raised: Number(item.raisedAmount || 0),
            goal: Number(item.goalAmount || 0),
            createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
            action: actionLabelMap[status],
            actionTone: actionToneMap[status],
            image: item.image || getCampaignImageUrl(item),
          };
        });
        setCampaigns(mapped);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns.");
        setCampaigns([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const overview = useMemo(() => {
    const totals = campaigns.reduce(
      (acc, item) => {
        acc.raised += item.raised;
        acc.goal += item.goal;
        acc[item.status] += 1;
        acc.total += 1;
        return acc;
      },
      { raised: 0, goal: 0, total: 0, Active: 0, Completed: 0, Draft: 0 },
    );

    const completionRate = totals.goal
      ? Math.round((totals.raised / totals.goal) * 100)
      : 0;

    return {
      ...totals,
      completionRate,
    };
  }, [campaigns]);

  const tabCounts = useMemo(
    () => ({
      "All Campaigns": overview.total,
      Active: overview.Active,
      Past: overview.Completed,
      Drafts: overview.Draft,
    }),
    [overview],
  );

  const filteredCampaigns = useMemo(() => {
    let results = campaigns;

    if (activeTab === "Past") {
      results = results.filter((item) => item.status === "Completed");
    } else if (activeTab === "Drafts") {
      results = results.filter((item) => item.status === "Draft");
    } else if (activeTab !== "All Campaigns") {
      results = results.filter((item) => item.status === activeTab);
    }

    if (selectedCategory !== "Category") {
      const categoryKey = selectedCategory.toLowerCase();
      results = results.filter(
        (item) => item.category.toLowerCase() === categoryKey,
      );
    }

    const query = `${globalSearch} ${searchTerm}`.trim().toLowerCase();
    if (query) {
      results = results.filter((item) => {
        const haystack = [
          item.title,
          item.description,
          item.category,
          item.status,
          String(item.id),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const sorted = [...results];
    if (selectedSort === "Latest First") {
      sorted.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    } else if (selectedSort === "Oldest First") {
      sorted.sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
    } else if (selectedSort === "Highest Goal") {
      sorted.sort((a, b) => b.goal - a.goal);
    } else if (selectedSort === "Lowest Goal") {
      sorted.sort((a, b) => a.goal - b.goal);
    }

    return sorted;
  }, [
    activeTab,
    campaigns,
    globalSearch,
    searchTerm,
    selectedCategory,
    selectedSort,
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (activeNotificationTab === "unread") {
      return notifications.filter((item) => item.unread);
    }
    return notifications;
  }, [activeNotificationTab, notifications]);

  const handleExportReport = () => {
    const summaryRows = [
      ["Report", "Organization Campaign Report"],
      ["Generated At", new Date().toLocaleString()],
      ["Tab", activeTab],
      ["Category Filter", selectedCategory],
      ["Sort", selectedSort],
      ["Search", `${globalSearch} ${searchTerm}`.trim() || "None"],
      ["Total Campaigns", overview.total],
      ["Active Campaigns", overview.Active],
      ["Completed Campaigns", overview.Completed],
      ["Draft Campaigns", overview.Draft],
      ["Total Raised", overview.raised],
      ["Total Goal", overview.goal],
      ["Completion Rate", `${overview.completionRate}%`],
      [],
      ["ID", "Title", "Category", "Status", "Raised USD", "Goal USD", "Progress %"],
      ...filteredCampaigns.map((item) => {
        const progress = item.goal > 0 ? Math.min(100, Math.round((item.raised / item.goal) * 100)) : 0;
        return [
          item.id,
          item.title,
          item.category,
          item.status,
          item.raised,
          item.goal,
          progress,
        ];
      }),
    ];

    const csv = summaryRows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `organization-campaign-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const markAllNotificationsRead = () => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    notifications.forEach((item) => {
      fetch(`${apiBase}/notifications/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      }).catch(() => null);
    });
  };

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const session = getOrganizationSession();
    const userId = Number(session?.userId ?? 0);

    let alive = true;
    const loadNotifications = () => {
      fetch(`${apiBase}/notifications`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load notifications (${response.status})`);
          }
          return response.json();
        })
        .then((data) => {
          if (!alive) return;
          const items = Array.isArray(data) ? data : [];
          const filtered = userId
            ? items.filter((item) => {
                const recipientType = String(item.recipient_type || "").toLowerCase();
                const recipientId = Number(item.recipient_id || 0);
                if (recipientType) {
                  if (recipientType !== "organization" || recipientId !== userId) return false;
                } else if (Number(item.user_id) !== userId) {
                  return false;
                }
                const type = String(item.type || "").toLowerCase();
                return type !== "message" && type !== "reply";
              })
            : [];
          const mapped = filtered.map((item) => ({
            id: item.id,
            title: item.type === "campaign" ? "Campaign Update" : item.type === "follow" ? "New Follower" : "Notification",
            detail: item.message || "New update available.",
            time: new Date(item.created_at || Date.now()).toLocaleString(),
            type: item.type || "info",
            unread: !item.is_read,
          }));
          setNotifications(mapped);
        })
        .catch(() => {
          if (!alive) return;
          setNotifications([]);
        });
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className={`org-page ${themeClass}`}>
      <OrganizationSidebar />
      <main className="org-main org-cpg-main">
        <header className="org-cpg-toolbar flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white/90 px-6 py-4 backdrop-blur">
          <h2 className="org-cpg-toolbar-title text-lg font-semibold text-[#0F172A]">
            Campaign Management
          </h2>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <label className="org-cpg-toolbar-search relative flex w-full max-w-xs items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                placeholder="Global search..."
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                className="h-9 w-full rounded-full border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.06)] outline-none focus:border-[#1f6fe6]"
              />
            </label>
            <button
              type="button"
              className="org-notify-btn"
              aria-label="Notifications"
              onClick={() => setIsNotificationOpen(true)}
            >
              <Bell className="mx-auto h-4 w-4" />
              {unreadCount > 0 ? <span className="org-notify-dot" /> : null}
            </button>
            <OrganizationIdentityPill className="org-cpg-user-card" />
          </div>
        </header>

        {isNotificationOpen ? (
          <div className="org-notify-overlay" role="presentation" onClick={() => setIsNotificationOpen(false)}>
            <div
              className="org-notify-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="org-notify-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="org-notify-modal-head">
                <h2 id="org-notify-title">Notifications</h2>
                <div className="org-notify-head-actions">
                  <button
                    type="button"
                    className="org-notify-mark-read"
                    onClick={markAllNotificationsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </button>
                  <button
                    type="button"
                    className="org-notify-close-btn"
                    onClick={() => setIsNotificationOpen(false)}
                    aria-label="Close notifications"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path d="m18 6-12 12M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="org-notify-tabs" role="tablist" aria-label="Notification filters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeNotificationTab === "all"}
                  className={activeNotificationTab === "all" ? "is-active" : ""}
                  onClick={() => setActiveNotificationTab("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeNotificationTab === "unread"}
                  className={activeNotificationTab === "unread" ? "is-active" : ""}
                  onClick={() => setActiveNotificationTab("unread")}
                >
                  Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
                </button>
              </div>

              <div className="org-notify-modal-body">
                {visibleNotifications.length === 0 ? (
                  <p className="org-notify-empty">No unread notifications.</p>
                ) : (
                  visibleNotifications.map((item) => (
                    <article key={item.id} className={`org-notify-item ${item.unread ? "is-unread" : ""}`}>
                      <span className={`org-notify-avatar ${item.type}`} aria-hidden="true">
                        {item.type?.slice(0, 2).toUpperCase() || "NT"}
                      </span>
                      <div className="org-notify-item-content">
                        <h3>{item.title}</h3>
                        <p>{item.detail}</p>
                        <time>{item.time}</time>
                      </div>
                      {item.unread ? <span className="org-notify-unread-dot" aria-hidden="true" /> : null}
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        <section className="w-full max-w-8xl px-3 pb-12 pt-8">
          <div className="org-cpg-hero relative overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-white/95 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(31,111,230,0.12),_transparent_55%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="org-cpg-hero-kicker text-xs font-semibold uppercase tracking-[0.35em] text-[#94A3B8]">
                    Campaign Management
                  </p>
                  <h1 className="org-cpg-hero-title mt-2 text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
                    Campaigns
                  </h1>
                  <p className="org-cpg-hero-copy mt-2 max-w-xl text-sm font-medium text-[#64748B]">
                    Monitor performance, keep teams aligned, and surface the
                    campaigns that need attention.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportReport}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-[#F8FAFC]"
                  >
                    Export Report
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGN_CREATE)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6fe6] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(31,111,230,0.3)] transition hover:translate-y-[-1px] hover:bg-[#1a63d0]"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Campaign
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="org-cpg-overview-card rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <p className="org-cpg-overview-label text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                    Total Campaigns
                  </p>
                  <p className="org-cpg-overview-value mt-3 text-3xl font-semibold text-[#0F172A]">
                    {overview.total}
                  </p>
                  <p className="org-cpg-overview-meta mt-2 text-xs font-medium text-[#64748B]">
                    Active: {overview.Active} • Drafts: {overview.Draft}
                  </p>
                </div>
                <div className="org-cpg-overview-card rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <p className="org-cpg-overview-label text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                    Total Raised
                  </p>
                  <p className="org-cpg-overview-value mt-3 text-3xl font-semibold text-[#0F172A]">
                    {formatMoney(overview.raised)}
                  </p>
                  <p className="org-cpg-overview-meta mt-2 text-xs font-medium text-[#64748B]">
                    Goal: {formatMoney(overview.goal)}
                  </p>
                </div>
                <div className="org-cpg-overview-card rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <p className="org-cpg-overview-label text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                    Completion Rate
                  </p>
                  <p className="org-cpg-overview-value mt-3 text-3xl font-semibold text-[#0F172A]">
                    {overview.completionRate}%
                  </p>
                  <p className="org-cpg-overview-meta mt-2 text-xs font-medium text-[#64748B]">
                    Past campaigns: {overview.Completed}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="org-cpg-filter-panel mt-6 rounded-[28px] border border-[#E2E8F0] bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "bg-[#FFF7ED] text-[#1f6fe6] shadow-[0_0px_px_rgba(249,115,22,0.2)]"
                      : "text-[#64748B] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        activeTab === tab
                          ? "bg-white text-[#1f6fe6]"
                          : "bg-[#E2E8F0] text-[#64748B]"
                      }`}
                    >
                      {tabCounts[tab]}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex min-w-[240px] flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#94A3B8]" />
                <input
                  className="org-cpg-search-input h-11 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm text-[#0F172A] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none focus:border-[#1f6fe6]"
                  type="text"
                  placeholder="Search campaigns by title, owner, or ID..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="org-cpg-filter">
                <button
                  type="button"
                  className="org-cpg-filter-btn"
                  onClick={() => {
                    setCategoryOpen((prev) => !prev);
                    setSortOpen(false);
                  }}
                  aria-expanded={categoryOpen}
                >
                  {selectedCategory}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {categoryOpen ? (
                  <div className="org-cpg-filter-menu">
                    {["Category", "Education", "Health", "Community", "Environment", "Other"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(item);
                          setCategoryOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="org-cpg-filter">
                <button
                  type="button"
                  className="org-cpg-filter-btn is-active"
                  onClick={() => {
                    setSortOpen((prev) => !prev);
                    setCategoryOpen(false);
                  }}
                  aria-expanded={sortOpen}
                >
                  {selectedSort}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {sortOpen ? (
                  <div className="org-cpg-filter-menu">
                    {["Latest First", "Oldest First", "Highest Goal", "Lowest Goal"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedSort(item);
                          setSortOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#64748B]">Loading campaigns...</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((item) => {
              const isMaterialCampaign = String(item.campaignType || "").toLowerCase().includes("material");
              const pledgedItems = Math.max(0, Number(item.raised || 0));
              const requestedItems = Math.max(1, Number(item.materialItem?.quantity || item.goal || 1));
              const rawProgress = isMaterialCampaign
                ? (pledgedItems / requestedItems) * 100
                : (item.goal > 0 ? (item.raised / item.goal) * 100 : 0);
              const progress = Math.min(100, Math.round(rawProgress));
              const visibleProgress = rawProgress > 0 ? Math.max(Math.min(rawProgress, 100), 1) : 0;
              const remaining = isMaterialCampaign
                ? Math.max(0, requestedItems - pledgedItems)
                : Math.max(0, item.goal - item.raised);
              const metricLeftLabel = isMaterialCampaign ? "PLEDGED" : "RAISED";
              const metricRightLabel = isMaterialCampaign ? "NEEDED" : "GOAL";
              const metricLeftValue = isMaterialCampaign ? pledgedItems.toLocaleString() : formatMoney(item.raised);
              const metricRightValue = isMaterialCampaign ? requestedItems.toLocaleString() : formatMoney(item.goal);
              const progressLabel = isMaterialCampaign
                ? formatProgressLabel(rawProgress, 'pledged')
                : formatProgressLabel(rawProgress, 'funded');
              const remainingLabel = isMaterialCampaign
                ? `${remaining.toLocaleString()} items remaining`
                : `${formatMoney(remaining)} remaining`;
              return (
                <article
                  key={item.id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-[#F8FAFC]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        if (event.currentTarget.src !== placeholderImage) {
                          event.currentTarget.src = placeholderImage;
                        }
                      }}
                    />
                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${item.statusTone}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                    <span className="w-fit rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#475569]">
                      {item.category}
                    </span>
                    <h3 className="org-cpg-card-title mt-3 text-lg font-bold text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="org-cpg-card-desc mt-2 text-sm text-[#64748B]">
                      {item.description}
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                        <span>{metricLeftLabel}</span>
                        <span>{metricRightLabel}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-[#0F172A]">
                        <span className="text-[#1f6fe6]">
                          {metricLeftValue}
                        </span>
                        <span>{metricRightValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#1f6fe6]">{progressLabel}</span>
                        <span className="text-[#94A3B8]">{remainingLabel}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-2 rounded-full bg-[#1f6fe6]"
                          style={{ width: `${visibleProgress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGN_DETAIL(item.id))}
                      className={`mt-5 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${item.actionTone}`}
                    >
                      {item.action}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {!loading && !error && filteredCampaigns.length === 0 ? (
            <div className="org-cpg-empty-state mt-8 rounded-2xl border border-dashed border-[#CBD5F5] bg-white/90 px-6 py-8 text-center text-sm font-semibold text-[#64748B]">
              No campaigns match your current filters.
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#94A3B8]">
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9]"
            >
              &lsaquo;
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                className={`h-8 w-8 rounded-full border text-sm font-semibold ${
                  page === 1
                    ? "border-[#1f6fe6] bg-[#1f6fe6] text-white"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9]"
                }`}
              >
                {page}
              </button>
            ))}
            <span className="text-[#94A3B8]">...</span>
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9]"
            >
              8
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9]"
            >
              &rsaquo;
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
