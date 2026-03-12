import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";
import ROUTES from "@/constants/routes.js";
import OrganizationSidebar from "./OrganizationSidebar.jsx";
import "./organization.css";

const campaignData = [
  {
    id: "c1",
    status: "Active",
    statusTone: "bg-emerald-500 text-white",
    category: "Medical Equipment",
    title: "Emergency Oxygen Supply for Rural Clinics",
    description:
      "Providing 50 new oxygen concentrators to underserved provinces.",
    raised: 45200,
    goal: 60000,
    action: "View Details",
    actionTone: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#FFF7ED]",
    art: "from-[#FCD9B6] via-[#FDEAD6] to-[#FFF7ED]",
  },
  {
    id: "c2",
    status: "Completed",
    statusTone: "bg-[#64748B] text-white",
    category: "Surgery Fund",
    title: "Pediatric Heart Surgery Program 2023",
    description:
      "Funding life-saving cardiac procedures for children in low-income families.",
    raised: 125000,
    goal: 120000,
    action: "View Results",
    actionTone: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#F1F5F9]",
    art: "from-[#E2E8F0] via-[#EEF2F7] to-[#F8FAFC]",
  },
  {
    id: "c3",
    status: "Draft",
    statusTone: "bg-[#F97316] text-white",
    category: "Public Health",
    title: "Community Wellness & Nutrition Drive",
    description:
      "Launching a new initiative to educate and provide nutrition support.",
    raised: 0,
    goal: 15000,
    action: "Resume Editing",
    actionTone: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#FFF7ED]",
    art: "from-[#FFE6C7] via-[#FFF1DF] to-[#FFFBF5]",
  },
  {
    id: "c4",
    status: "Active",
    statusTone: "bg-emerald-500 text-white",
    category: "Cancer Care",
    title: "Mobile Screening Unit Fund",
    description:
      "Purchasing a fully equipped mobile unit for early cancer screening.",
    raised: 18750,
    goal: 85000,
    action: "View Details",
    actionTone: "border-[#1f6fe6] text-[#1f6fe6] hover:bg-[#FFF7ED]",
    art: "from-[#FBC7B7] via-[#FBD9CF] to-[#FFECE7]",
  },
];

const tabs = ["All Campaigns", "Active", "Past", "Drafts"];

function formatMoney(value) {
  return `$${value.toLocaleString("en-US")}`;
}

export default function OrganizationCampaignsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Campaigns");

  const filteredCampaigns = useMemo(() => {
    if (activeTab === "All Campaigns") return campaignData;
    if (activeTab === "Past")
      return campaignData.filter((item) => item.status === "Completed");
    if (activeTab === "Drafts")
      return campaignData.filter((item) => item.status === "Draft");
    return campaignData.filter((item) => item.status === activeTab);
  }, [activeTab]);

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main org-cpg-main">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white/90 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Campaign Management
          </h2>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <label className="relative flex w-full max-w-xs items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                placeholder="Global search..."
                className="h-9 w-full rounded-full border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.06)] outline-none focus:border-[#1f6fe6]"
              />
            </label>
            <button
              type="button"
              className="relative h-9 w-9 rounded-full border border-[#E2E8F0] bg-white text-[#475569] shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
            >
              <span className="sr-only">Notifications</span>
              <Bell className="mx-auto h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#1f6fe6]" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
              <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#1629a1] bg-[radial-gradient(circle_at_top,_#FFF7ED,_#FED7AA)] text-xs font-bold text-[#EA580C] shadow-[0_6px_14px_rgba(234,88,12,0.2)]">
                DC
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <div className="pr-1.5">
                <p className="text-sm font-semibold leading-tight text-[#0F172A]">
                  Dr. Chomnuoy
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">
                  Organization
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className=" w-full max-w-8xl px-3 pb-12 pt-8">
          <div className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-4xl font-semibold uppercase tracking-[0.16em] text-[#000000]">
                  Campaigns
                </p>
                <h1 className="text-1xl mt-2 font-bold tracking-tight text-[#64748B] md:text-[1rem]">
                  Manage and monitor your healthcare fundraising initiatives
                  across the region.
                </h1>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGN_CREATE)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6fe6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f6fe6]"
              >
                <Plus className="h-4 w-4" />
                Create New Campaign
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
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
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex min-w-[240px] flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search campaigns by title or ID..."
                  className="h-11 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm text-[#0F172A] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none focus:border-[#1f6fe6]"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-[#F8FAFC]"
              >
                Category
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-[#F8FAFC]"
              >
                Latest First
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((item) => {
              const progress = Math.min(
                100,
                Math.round((item.raised / item.goal) * 100),
              );
              return (
                <article
                  key={item.id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  <div
                    className={`relative h-40 w-full bg-gradient-to-br ${item.art}`}
                  >
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
                    <h3 className="mt-3 text-lg font-bold text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#64748B]">
                      {item.description}
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                        <span>RAISED</span>
                        <span>GOAL</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-[#0F172A]">
                        <span className="text-[#1f6fe6]">
                          {formatMoney(item.raised)}
                        </span>
                        <span>{formatMoney(item.goal)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-2 rounded-full bg-[#1f6fe6]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`mt-5 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${item.actionTone}`}
                    >
                      {item.action}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

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
