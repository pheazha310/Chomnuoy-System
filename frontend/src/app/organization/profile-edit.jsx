import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';

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

export default function OrganizationProfileEditPage() {
  const navigate = useNavigate();
  const session = useMemo(() => getOrganizationSession(), []);
  const storedProfile = useMemo(() => getStoredProfile(), []);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [formData, setFormData] = useState({
    name: storedProfile?.name || session?.name || 'Organization',
    logo: storedProfile?.logo || '',
    category: storedProfile?.category || '',
    city: storedProfile?.city || '',
    orgType: storedProfile?.orgType || '',
    founded: storedProfile?.founded || '',
    members: storedProfile?.members || '',
    about: storedProfile?.about || '',
    email: storedProfile?.email || session?.email || '',
    phone: storedProfile?.phone || '',
    location:
      storedProfile?.location ||
      'Passerelles numériques Cambodia (PNC), BP 511, Phum Tropeang Chhuk (Borey Sorla) Sangtak, Street 371, Phnom Penh, Cambodia',
    website: storedProfile?.website || '',
    socials: {
      facebook: storedProfile?.socials?.facebook || '',
      instagram: storedProfile?.socials?.instagram || '',
      telegram: storedProfile?.socials?.telegram || '',
    },
    impactAreas: storedProfile?.impactAreas || ['Amazon Basin', 'Southeast Asian Rainforests', 'Arctic Circle'],
  });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSocialChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [field]: event.target.value },
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();
    setSaving(true);
    setSavedMessage('');

    window.setTimeout(() => {
      window.localStorage.setItem(
        'chomnuoy_org_profile',
        JSON.stringify({
          ...formData,
          name: formData.name,
          logo: formData.logo,
          socials: {
            facebook: formData.socials.facebook,
            instagram: formData.socials.instagram,
            telegram: formData.socials.telegram,
          },
        })
      );
      setSaving(false);
      setSavedMessage('Profile saved & published.');
    }, 600);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Delete organization account? This cannot be undone.');
    if (!confirmed) return;
    window.localStorage.removeItem('chomnuoy_org_profile');
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    navigate('/', { replace: true });
  };

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main">
        <form className="org-profile-edit" onSubmit={handleSave}>
          <div className="org-profile-edit-head">
            <div className="org-profile-edit-title">
              <span className="org-profile-edit-icon">EP</span>
              <div>
                <h1>Edit Organization Profile</h1>
                <p>Update your public profile and organization details.</p>
              </div>
            </div>
            <button type="submit" className="org-profile-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {savedMessage ? <div className="org-profile-success">{savedMessage}</div> : null}

          <section className="org-profile-edit-card">
            <div className="org-profile-logo-edit">
              {formData.logo ? (
                <img src={formData.logo} alt="Organization logo preview" className="org-profile-logo-preview" />
              ) : (
                <span className="org-profile-logo-circle">ORG</span>
              )}
              <div>
                <h2>{formData.name}</h2>
                <label className="org-profile-link org-profile-upload">
                  Update Organization Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
            </div>

            <div className="org-profile-edit-grid">
              <label>
                Category
                <input value={formData.category} onChange={handleChange('category')} placeholder="Select Category" />
              </label>
              <label>
                City / Province
                <input value={formData.city} onChange={handleChange('city')} placeholder="City or Province" />
              </label>
              <label>
                Organization Type
                <input value={formData.orgType} onChange={handleChange('orgType')} placeholder="Corporation, NGO..." />
              </label>
              <label>
                Date Founded
                <input type="date" value={formData.founded} onChange={handleChange('founded')} />
              </label>
              <label>
                Number of Members
                <input value={formData.members} onChange={handleChange('members')} placeholder="1250" />
              </label>
              <label>
                Public Email
                <input value={formData.email} onChange={handleChange('email')} placeholder="contact@org.com" />
              </label>
              <label>
                Public Phone
                <input value={formData.phone} onChange={handleChange('phone')} placeholder="+1 (555) 123-4567" />
              </label>
              <label>
                Location
                <input value={formData.location} onChange={handleChange('location')} placeholder="Headquarters address" />
              </label>
              <label>
                Website
                <input value={formData.website} onChange={handleChange('website')} placeholder="www.organization.org" />
              </label>
              <label className="org-profile-edit-full">
                About Organization
                <textarea
                  rows="4"
                  value={formData.about}
                  onChange={handleChange('about')}
                  placeholder="Share your mission, focus areas, and impact."
                />
              </label>
            </div>
          </section>

          <section className="org-profile-edit-card">
            <h2>Social Media Presence</h2>
            <div className="org-profile-edit-grid">
              <label>
                Facebook
                <input value={formData.socials.facebook} onChange={handleSocialChange('facebook')} placeholder="facebook.com/username" />
              </label>
              <label>
                Telegram
                <input value={formData.socials.telegram} onChange={handleSocialChange('telegram')} placeholder="t.me/channel" />
              </label>
              <label>
                Instagram
                <input value={formData.socials.instagram} onChange={handleSocialChange('instagram')} placeholder="instagram.com/username" />
              </label>
            </div>
          </section>

          <section className="org-profile-danger">
            <h2>Danger Zone</h2>
            <p>Deleting your organization profile will remove all associated campaigns and donor history.</p>
            <button type="button" className="org-profile-danger-btn" onClick={handleDeleteAccount}>
              Delete Organization Account
            </button>
          </section>

          <div className="org-profile-edit-actions">
            <button type="button" className="org-profile-link" onClick={() => navigate('/organization/profile')}>
              Cancel
            </button>
            <button type="submit" className="org-profile-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
