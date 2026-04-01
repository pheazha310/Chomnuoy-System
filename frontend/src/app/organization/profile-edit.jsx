import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  findOrganizationByEmail,
  getOrganizationById,
  updateOrganizationProfile,
} from '@/services/user-service.js';
import { DEFAULT_MAP_CENTER, getCurrentCoordinates } from '@/utils/geolocation.js';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import OrganizationIdentityPill from './OrganizationIdentityPill.jsx';

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
  const [resolvedOrganizationId, setResolvedOrganizationId] = useState(
    Number(session?.organizationId ?? session?.userId ?? 0),
  );
  const loadKeyRef = useRef('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);

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
      'Passerelles numeriques Cambodia (PNC), Street 371, Phnom Penh, Cambodia',
    latitude: storedProfile?.latitude || '',
    longitude: storedProfile?.longitude || '',
    mapQuery: storedProfile?.mapQuery || storedProfile?.location || '',
    website: storedProfile?.website || '',
    socials: {
      facebook: storedProfile?.socials?.facebook || '',
      instagram: storedProfile?.socials?.instagram || '',
      telegram: storedProfile?.socials?.telegram || '',
    },
    impactAreas: Array.isArray(storedProfile?.impactAreas)
      ? storedProfile.impactAreas.join(', ')
      : (storedProfile?.impactAreas || ''),
  });

  useEffect(() => {
    let active = true;
    const loadKey = `${resolvedOrganizationId || 0}:${String(session?.email || '').trim().toLowerCase()}`;
    if (loadKeyRef.current === loadKey) {
      return undefined;
    }
    loadKeyRef.current = loadKey;

    const persistResolvedOrganization = (organization) => {
      const nextId = Number(organization?.id || 0);
      if (!nextId) return;

      setResolvedOrganizationId((previous) => (previous === nextId ? previous : nextId));
      window.localStorage.setItem(
        'chomnuoy_session',
        JSON.stringify({
          ...(getOrganizationSession() || {}),
          userId: nextId,
          organizationId: nextId,
          name: organization?.name || session?.name,
          email: organization?.email || session?.email,
        })
      );
      window.dispatchEvent(new Event('chomnuoy-session-updated'));
    };

    const resolveOrganization = async () => {
      const normalizedEmail = String(session?.email || '').trim().toLowerCase();

      if (normalizedEmail) {
        const matchedOrganization = await findOrganizationByEmail(normalizedEmail).catch(() => null);
        if (matchedOrganization?.id) {
          const resolvedOrganization = await getOrganizationById(matchedOrganization.id).catch(() => matchedOrganization);
          persistResolvedOrganization(resolvedOrganization);
          return resolvedOrganization;
        }
      }

      if (resolvedOrganizationId > 0) {
        try {
          const directOrganization = await getOrganizationById(resolvedOrganizationId);
          persistResolvedOrganization(directOrganization);
          return directOrganization;
        } catch (error) {
          if (Number(error?.response?.status) !== 404) {
            throw error;
          }
        }
      }

      if (normalizedEmail) {
        window.localStorage.setItem(
          'chomnuoy_session',
          JSON.stringify({
            ...(getOrganizationSession() || {}),
            organizationId: null,
          })
        );
        window.dispatchEvent(new Event('chomnuoy-session-updated'));
        setResolvedOrganizationId(0);
      }

      return null;
    };

    resolveOrganization()
      .then((organization) => {
        if (!active || !organization) {
          return;
        }

        setFormData((current) => ({
          ...current,
          name: current.name || organization.name || 'Organization',
          email: current.email || organization.email || '',
          location: current.location || organization.location || '',
          latitude: current.latitude || String(organization.latitude || ''),
          longitude: current.longitude || String(organization.longitude || ''),
          about: current.about || organization.description || '',
        }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [resolvedOrganizationId, session?.email, session?.name]);

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

    setSelectedLogoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
  };

  const captureLocation = async ({ useFallback = false } = {}) => {
    setIsLocating(true);
    setSavedMessage('');
    setError('');

    try {
      const coords = await getCurrentCoordinates();
      setFormData((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        location: prev.location || `${coords.latitude}, ${coords.longitude}`,
      }));
    } catch (err) {
      if (useFallback) {
        setFormData((prev) => ({
          ...prev,
          latitude: String(DEFAULT_MAP_CENTER.latitude),
          longitude: String(DEFAULT_MAP_CENTER.longitude),
          location: prev.location || `${DEFAULT_MAP_CENTER.latitude}, ${DEFAULT_MAP_CENTER.longitude}`,
        }));
      }
      setError(err.message || 'Unable to get your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  const hasCoordinates = formData.latitude && formData.longitude;
  const mapSrc = hasCoordinates
    ? `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}&z=14&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(formData.location || 'Phnom Penh, Cambodia')}&output=embed`;

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSavedMessage('');
    setError('');

    try {
      let effectiveOrganizationId = resolvedOrganizationId;

      if (!effectiveOrganizationId && formData.email) {
        const matchedOrganization = await findOrganizationByEmail(formData.email).catch(() => null);
        if (matchedOrganization?.id) {
          effectiveOrganizationId = Number(matchedOrganization.id);
          setResolvedOrganizationId(effectiveOrganizationId);
        }
      }

      if (effectiveOrganizationId) {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('email', formData.email);
        payload.append('location', formData.location || '');
        payload.append('latitude', formData.latitude || '');
        payload.append('longitude', formData.longitude || '');
        payload.append('description', formData.about || '');

        if (selectedLogoFile) {
          payload.append('avatar', selectedLogoFile);
        }

        const updatedOrganization = await updateOrganizationProfile(effectiveOrganizationId, payload);

        window.localStorage.setItem(
          'chomnuoy_session',
          JSON.stringify({
            ...(getOrganizationSession() || {}),
            userId: effectiveOrganizationId,
            organizationId: effectiveOrganizationId,
            name: updatedOrganization?.name || formData.name,
            email: updatedOrganization?.email || formData.email,
            avatar: updatedOrganization?.avatar_url || formData.logo || '',
          })
        );
        window.dispatchEvent(new Event('chomnuoy-session-updated'));
      } else {
        setError('No organization record was found for this email on the backend.');
        return;
      }

      window.localStorage.setItem(
        'chomnuoy_org_profile',
        JSON.stringify({
          ...formData,
          name: formData.name,
          logo: formData.logo,
          mapQuery: formData.mapQuery.trim(),
          socials: {
            facebook: formData.socials.facebook,
            instagram: formData.socials.instagram,
            telegram: formData.socials.telegram,
          },
          impactAreas: formData.impactAreas
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        })
      );

      setSavedMessage('Profile saved & published.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save profile right now.');
    } finally {
      setSaving(false);
    }
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
        <div className="org-main-identity">
          <OrganizationIdentityPill />
        </div>

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
          {error ? <div className="org-profile-error">{error}</div> : null}

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
                Latitude
                <input value={formData.latitude} onChange={handleChange('latitude')} placeholder="11.548038" />
              </label>
              <label>
                Longitude
                <input value={formData.longitude} onChange={handleChange('longitude')} placeholder="104.942829" />
              </label>
              <label>
                Map Search
                <input value={formData.mapQuery} onChange={handleChange('mapQuery')} placeholder="Phnom Penh, Cambodia" />
              </label>
              <label>
                Website
                <input value={formData.website} onChange={handleChange('website')} placeholder="www.organization.org" />
              </label>
              <label className="org-profile-edit-full">
                Impact Areas
                <input
                  value={formData.impactAreas}
                  onChange={handleChange('impactAreas')}
                  placeholder="Education, Community, Healthcare"
                />
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

            <div className="org-profile-location-tools">
              <div className="org-profile-location-head">
                <div>
                  <h2>Organization Map</h2>
                  <p>Track your profile location with latitude and longitude.</p>
                </div>
                <button
                  type="button"
                  className="org-profile-primary"
                  onClick={() => captureLocation({ useFallback: true })}
                  disabled={isLocating}
                >
                  {isLocating ? 'Detecting...' : 'Use Current Location'}
                </button>
              </div>
              <iframe
                title="Organization location preview"
                className="org-profile-map-embed"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {hasCoordinates ? (
                <p className="org-profile-location-caption">
                  Lat: {formData.latitude} | Lng: {formData.longitude}
                </p>
              ) : (
                <p className="org-profile-location-caption">
                  Add latitude and longitude or use your current device location.
                </p>
              )}
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


