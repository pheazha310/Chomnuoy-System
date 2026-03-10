import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import './organization.css';

export default function OrganizationCampaignCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    category: '',
    goal: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main org-cpg-main org-create-page">
        <header className="org-create-header">
          <div>
            <p>Create Campaign</p>
            <h1>Start a New Campaign</h1>
          </div>
          <button type="button" className="org-create-back" onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGNS)}>
            <ArrowLeft size={14} />
            Back to campaigns
          </button>
        </header>
        <section className="org-create-card">
          <div className="org-create-card-title">
            <span className="org-create-icon" aria-hidden="true">i</span>
            <h2>Campaign Information</h2>
          </div>
          <div className="org-create-grid">
            <label className="org-create-field full">
              Campaign Title
              <input
                type="text"
                placeholder="e.g., Support Clean Water in Rural Villages"
                value={form.title}
                onChange={handleChange('title')}
              />
            </label>
            <label className="org-create-field">
              Category
              <select value={form.category} onChange={handleChange('category')}>
                <option value="">Select Category</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Environment">Environment</option>
                <option value="Community">Community</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </label>
            <label className="org-create-field">
              Fundraising Goal ($)
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="$ 0.00"
                value={form.goal}
                onChange={handleChange('goal')}
              />
            </label>
            <label className="org-create-field">
              Start Date
              <input
                type="date"
                placeholder="dd/mm/yyyy"
                value={form.startDate}
                onChange={handleChange('startDate')}
              />
            </label>
            <label className="org-create-field">
              End Date
              <input
                type="date"
                placeholder="dd/mm/yyyy"
                value={form.endDate}
                onChange={handleChange('endDate')}
              />
            </label>
          </div>
        </section>

        <section className="org-create-card">
          <div className="org-create-card-title">
            <span className="org-create-icon" aria-hidden="true">T</span>
            <h2>Campaign Story</h2>
          </div>
          <div className="org-create-editor">
            <p className="org-create-label">Campaign Description</p>
            <div className="org-create-toolbar" aria-hidden="true">
              <button type="button" aria-label="Bold">B</button>
              <button type="button" aria-label="Italic">I</button>
              <button type="button" aria-label="Bullet list">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="7" r="1.5" />
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="5" cy="17" r="1.5" />
                  <path d="M9 7h10M9 12h10M9 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="org-create-divider" aria-hidden="true" />
              <button type="button" aria-label="Insert link">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 14a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M14 10a5 5 0 0 0-7.07 0L4.1 12.83a5 5 0 1 0 7.07 7.07L13 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button type="button" aria-label="Insert image">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M20 16l-4.5-4.5L8 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <textarea
              placeholder="Tell potential donors why this cause matters..."
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>
        </section>

        <div className="org-create-actions">
          <button type="button" className="org-create-secondary" onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGNS)}>
            Cancel
          </button>
          <button type="button" className="org-create-primary">
            Save Draft
          </button>
          <button type="button" className="org-create-primary solid">
            Publish Campaign
          </button>
        </div>
      </main>
    </div>
  );
}
