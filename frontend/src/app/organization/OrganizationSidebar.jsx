export default function OrganizationSidebar() {
  return (
    <aside className="org-sidebar" aria-label="Organization navigation">
      <div className="org-brand">
        <span className="org-brand-mark">C</span>
        <span>Chomnuoy</span>
      </div>

      <nav className="org-nav">
        <button className="org-nav-item active" type="button">Dashboard</button>
        <button className="org-nav-item" type="button">Campaigns</button>
        <button className="org-nav-item" type="button">Donations</button>
        <button className="org-nav-item" type="button">Reports</button>
        <button className="org-nav-item" type="button">Settings</button>
      </nav>

      <div className="org-plan-card">
        <p>Support Tier</p>
        <strong>Pro Plan</strong>
      </div>

      <button className="org-new-campaign" type="button">+ New Campaign</button>
    </aside>
  );
}
