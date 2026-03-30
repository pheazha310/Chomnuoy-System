function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_org_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'OR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function OrganizationIdentityPill({ className = '' }) {
  const session = getOrganizationSession();
  const storedProfile = getStoredProfile();
  const organizationName = storedProfile?.name || session?.name || 'Organization';
  const organizationInitials = getInitials(organizationName);
  const organizationLogo = storedProfile?.logo || storedProfile?.logoUrl || '';
  const pillClassName = ['org-profile-pill', className].filter(Boolean).join(' ');

  return (
    <div className={pillClassName} aria-label="Organization profile">
      <span className="org-profile-pill-avatar" aria-hidden="true">
        {organizationLogo ? (
          <img
            src={organizationLogo}
            alt=""
            className="org-profile-pill-logo"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          organizationInitials
        )}
        <span className="org-profile-pill-status" />
      </span>
      <div className="org-profile-pill-meta">
        <p className="org-profile-pill-name">{organizationName}</p>
        <p className="org-profile-pill-role">Organization</p>
      </div>
    </div>
  );
}
