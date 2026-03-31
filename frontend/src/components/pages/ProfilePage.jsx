import { useEffect, useState } from 'react';
import {
  MapPin,
  Mail,
  Globe,
  Edit3,
  Award,
  Users,
  Star,
  FileText,
  User,
  Shield,
  Bell,
  Clock,
  CheckCircle,
  Upload,
  Briefcase,
  TrendingUp,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import './ProfilePage.css';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
}

const iconMap = {
  upload: Upload,
  review: MessageSquare,
  certification: Award,
  project: Briefcase,
  update: FileText,
  achievement: TrendingUp,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  const session = getSession();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = session?.userId || 1;
      const response = await fetch(`http://localhost:8000/api/profile/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditedProfile(data.profile);
    } catch (err) {
      setError(err.message);
      // Use mock data for development
      setProfile({
        profile: {
          id: 1,
          name: 'Alex Rivera',
          title: 'Senior Architectural Consultant & Urban Planner',
          email: 'a.rivera@architectpro.com',
          location: 'San Francisco, CA',
          bio: 'Architect with over 12 years of experience specializing in sustainable urban infrastructure and biophilic design. I lead cross-functional teams at ArchitectPro to deliver high-impact commercial projects that integrate cutting-edge technology with environmental stewardship. My philosophy centers on the "Curated Workspace"—designing environments that empower focus and creativity through architectural harmony.',
          website: 'alexrivera.design',
          linkedin_url: 'linkedin.com/in/alexrivera',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          skills: ['Urban Planning', 'BIM Management', 'Sustainability', 'Client Relations', 'AutoCAD Expert'],
          status: 'active',
          created_at: '2020-01-15T00:00:00Z',
        },
        network_stats: {
          rank: 'Top 1%',
          connections_count: 500,
          project_reviews_count: 142,
        },
        recent_activities: [
          {
            id: 1,
            type: 'upload',
            title: 'Final Blueprints Uploaded',
            description: 'The "Skyline Plaza" commercial project phase 3 has been finalized.',
            icon: 'upload',
            time_ago: '2 hours ago',
          },
          {
            id: 2,
            type: 'review',
            title: 'New Review from Client',
            description: 'Metropolitan Heights project received a 5-star review for execution.',
            icon: 'review',
            time_ago: 'Yesterday',
          },
          {
            id: 3,
            type: 'certification',
            title: 'Certification Renewed',
            description: 'LEED Accredited Professional credential successfully updated.',
            icon: 'certification',
            time_ago: '3 days ago',
          },
        ],
      });
      setEditedProfile({
        name: 'Alex Rivera',
        title: 'Senior Architectural Consultant & Urban Planner',
        email: 'a.rivera@architectpro.com',
        location: 'San Francisco, CA',
        bio: 'Architect with over 12 years of experience specializing in sustainable urban infrastructure and biophilic design. I lead cross-functional teams at ArchitectPro to deliver high-impact commercial projects that integrate cutting-edge technology with environmental stewardship. My philosophy centers on the "Curated Workspace"—designing environments that empower focus and creativity through architectural harmony.',
        website: 'alexrivera.design',
        linkedin_url: 'linkedin.com/in/alexrivera',
        skills: ['Urban Planning', 'BIM Management', 'Sustainability', 'Client Relations', 'AutoCAD Expert'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const userId = session?.userId || 1;
      const response = await fetch(`http://localhost:8000/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setIsEditing(false);
    } catch (err) {
      // For development, just update local state
      setProfile((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...editedProfile },
      }));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile?.profile || {});
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (skillsString) => {
    const skills = skillsString.split(',').map((s) => s.trim()).filter(Boolean);
    setEditedProfile((prev) => ({ ...prev, skills }));
  };

  if (loading) {
    return (
      <div className="profile-page loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page error">
        <p>Error: {error}</p>
        <button onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  const { profile: profileData, network_stats, recent_activities } = profile;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Main Content */}
        <div className="profile-main">
          {/* Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-header-content">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <img
                    src={profileData.avatar_url || '/default-avatar.png'}
                    alt={profileData.name}
                  />
                  {isEditing && (
                    <button className="avatar-edit-btn">
                      <Upload size={16} />
                    </button>
                  )}
                </div>
                <button
                  className="edit-profile-btn"
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                >
                  {isEditing ? 'Cancel' : (
                    <>
                      <Edit3 size={16} />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              <div className="profile-info-section">
                {isEditing ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editedProfile.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Full Name"
                      className="edit-input name-input"
                    />
                    <input
                      type="text"
                      value={editedProfile.title || ''}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Professional Title"
                      className="edit-input title-input"
                    />
                    <div className="edit-row">
                      <input
                        type="text"
                        value={editedProfile.location || ''}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="Location"
                        className="edit-input"
                      />
                      <input
                        type="email"
                        value={editedProfile.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="Email"
                        className="edit-input"
                      />
                    </div>
                    <div className="edit-row">
                      <input
                        type="text"
                        value={editedProfile.website || ''}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="Website"
                        className="edit-input"
                      />
                      <input
                        type="text"
                        value={editedProfile.linkedin_url || ''}
                        onChange={(e) => handleChange('linkedin_url', e.target.value)}
                        placeholder="LinkedIn"
                        className="edit-input"
                      />
                    </div>
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Professional Background"
                      className="edit-textarea"
                      rows={4}
                    />
                    <input
                      type="text"
                      value={(editedProfile.skills || []).join(', ')}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      placeholder="Skills (comma separated)"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button className="save-btn" onClick={handleSave}>
                        <CheckCircle size={16} />
                        Save Changes
                      </button>
                      <button className="cancel-btn" onClick={handleCancel}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="profile-name">{profileData.name}</h1>
                    <p className="profile-title">{profileData.title}</p>

                    <div className="profile-meta">
                      {profileData.location && (
                        <span className="meta-item">
                          <MapPin size={16} />
                          {profileData.location}
                        </span>
                      )}
                      {profileData.email && (
                        <span className="meta-item">
                          <Mail size={16} />
                          {profileData.email}
                        </span>
                      )}
                      {profileData.website && (
                        <span className="meta-item">
                          <Globe size={16} />
                          <a href={`https://${profileData.website}`} target="_blank" rel="noopener noreferrer">
                            {profileData.website}
                          </a>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Professional Background */}
          <div className="profile-section">
            <h2 className="section-title">Professional Background</h2>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="edit-textarea"
                rows={6}
              />
            ) : (
              <p className="profile-bio">{profileData.bio}</p>
            )}

            {!isEditing && profileData.skills && profileData.skills.length > 0 && (
              <div className="skills-container">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="profile-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list">
              {recent_activities?.map((activity) => {
                const IconComponent = iconMap[activity.icon] || FileText;
                return (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <IconComponent size={20} />
                    </div>
                    <div className="activity-content">
                      <h4 className="activity-title">{activity.title}</h4>
                      <p className="activity-description">{activity.description}</p>
                    </div>
                    <span className="activity-time">{activity.time_ago}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="profile-sidebar">
          {/* Network Strength Card */}
          <div className="sidebar-card network-card">
            <h3 className="sidebar-card-title">Network Strength</h3>
            <div className="network-rank">{network_stats?.rank || 'Top 10%'}</div>
            <div className="network-stats">
              <div className="stat-item">
                <span className="stat-value">{network_stats?.connections_count || 0}+</span>
                <span className="stat-label">Connections</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{network_stats?.project_reviews_count || 0}</span>
                <span className="stat-label">Project Reviews</span>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="sidebar-card settings-card">
            <h3 className="sidebar-card-title">Quick Settings</h3>
            <nav className="settings-nav">
              <a href="#personal" className="settings-link">
                <User size={18} />
                <span>Personal Info</span>
                <ArrowRight size={16} className="arrow" />
              </a>
              <a href="#security" className="settings-link">
                <Shield size={18} />
                <span>Security</span>
                <ArrowRight size={16} className="arrow" />
              </a>
              <a href="#notifications" className="settings-link">
                <Bell size={18} />
                <span>Notifications</span>
                <ArrowRight size={16} className="arrow" />
              </a>
            </nav>
          </div>

          {/* Featured Project */}
          <div className="sidebar-card project-card">
            <h3 className="sidebar-card-title">Featured Project</h3>
            <div className="project-image">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop"
                alt="Skyline Plaza Phase III"
              />
            </div>
            <h4 className="project-title">Skyline Plaza Phase III</h4>
            <p className="project-description">
              A masterclass in sustainable high-density commercial design.
            </p>
            <a href="#project" className="project-link">
              View Case Study <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
