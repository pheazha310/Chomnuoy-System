import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bold, Image, Italic, List, UploadCloud } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import './organization.css';

export default function OrganizationCampaignCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    location: '',
    summary: '',
    goal: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'goals', label: 'Goals & Timeline' },
    { id: 'media', label: 'Media Assets' },
    { id: 'story', label: 'Story & Impact' },
    { id: 'review', label: 'Review & Launch' },
  ];
  const [activeStep, setActiveStep] = useState(0);

  const completion = useMemo(() => {
    const fields = [
      form.title,
      form.category,
      form.location,
      form.summary,
      form.goal,
      form.startDate,
      form.endDate,
      form.description,
    ];
    const filled = fields.filter((value) => String(value || '').trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const statusLabel = completion >= 90 ? 'Ready to Publish' : completion >= 50 ? 'In Progress' : 'Drafting';
  const editId = useMemo(() => {
    const raw = searchParams.get('edit');
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [searchParams]);
  const isEditing = Boolean(editId);

  const getOrganizationSession = () => {
    try {
      const raw = window.localStorage.getItem('chomnuoy_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const applyEditorChange = (nextValue, selectionStart, selectionEnd) => {
    setForm((prev) => ({ ...prev, description: nextValue }));
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
        textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  };

  const applyWrap = (token) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    if (selectionStart === selectionEnd) {
      const insert = `${token}${token}`;
      const next = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
      applyEditorChange(next, selectionStart + token.length, selectionStart + token.length);
      return;
    }

    const isWrapped = selected.startsWith(token) && selected.endsWith(token);
    if (isWrapped) {
      const unwrapped = selected.slice(token.length, selected.length - token.length);
      const next = value.slice(0, selectionStart) + unwrapped + value.slice(selectionEnd);
      applyEditorChange(next, selectionStart, selectionStart + unwrapped.length);
      return;
    }

    const wrapped = `${token}${selected}${token}`;
    const next = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
    applyEditorChange(next, selectionStart + token.length, selectionEnd + token.length);
  };

  const applyBulletList = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEndIndex = value.indexOf('\n', selectionEnd);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const block = value.slice(lineStart, lineEnd);

    if (selectionStart === selectionEnd && block.length === 0) {
      const next = value.slice(0, lineStart) + '- ' + value.slice(lineEnd);
      applyEditorChange(next, lineStart + 2, lineStart + 2);
      return;
    }

    const lines = block.split('\n');
    const nextBlock = lines
      .map((line) => (line.trim().startsWith('-') ? line : `- ${line}`))
      .join('\n');
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    applyEditorChange(next, lineStart, lineStart + nextBlock.length);
  };
  const handleImagePick = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      if (typeof src !== 'string') return;
      setImagePreviews((prev) => [
        ...prev,
        {
          id: `${file.name}-${file.lastModified}-${prev.length}`,
          name: file.name,
          src,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryPick = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result;
        if (typeof src !== 'string') return;
        setImagePreviews((prev) => [
          ...prev,
          {
            id: `${file.name}-${file.lastModified}-${prev.length}`,
            name: file.name,
            src,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Campaign title is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (!form.goal || Number(form.goal) <= 0) return 'Goal amount must be greater than 0.';
    if (!form.startDate) return 'Start date is required.';
    if (!form.endDate) return 'End date is required.';
    if (!form.description.trim()) return 'Campaign description is required.';
    return '';
  };

  const handleSubmit = async (status) => {
    setError('');
    setSuccess('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const session = getOrganizationSession();
    const organizationId = Number(session?.userId ?? 0);
    if (!organizationId) {
      setError('Organization session not found. Please log in again.');
      return;
    }

    setSubmitting(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const response = await fetch(isEditing ? `${apiBase}/campaigns/${editId}` : `${apiBase}/campaigns`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          title: form.title.trim(),
          category: form.category.trim(),
          goal_amount: Number(form.goal),
          start_date: form.startDate,
          end_date: form.endDate,
          description: form.description.trim(),
          status,
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to save campaign (${response.status})`);
      }

      if (isEditing) {
        setSuccess('Campaign updated.');
      } else {
        setSuccess(status === 'draft' ? 'Draft saved.' : 'Campaign published.');
      }
      window.setTimeout(() => {
        navigate(ROUTES.ORGANIZATION_CAMPAIGNS);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    setLoadingCampaign(true);
    setError('');
    setSuccess('');
    fetch(`${apiBase}/campaigns/${editId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaign (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;
        setForm({
          title: data?.title || '',
          category: data?.category || '',
          location: data?.location || '',
          summary: data?.summary || '',
          goal: data?.goal_amount ?? '',
          startDate: data?.start_date || '',
          endDate: data?.end_date || '',
          description: data?.description || '',
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load campaign.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingCampaign(false);
      });

    return () => {
      mounted = false;
    };
  }, [editId, isEditing]);

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main org-cpg-main bg-[#F8FAFC]">
        {showPreview ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 px-4 py-6">
            <div className="w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Preview</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">{form.title || 'Campaign Title'}</h2>
                  <p className="mt-1 text-sm text-[#64748B]">{form.summary || 'Short summary of the campaign.'}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#E2E8F0] px-3 py-1 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-[#475569]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Category</p>
                  <p className="mt-1">{form.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Location</p>
                  <p className="mt-1">{form.location || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Goal</p>
                  <p className="mt-1">{form.goal ? `$${form.goal}` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Timeline</p>
                  <p className="mt-1">
                    {form.startDate || '--'} -> {form.endDate || '--'}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#0F172A]">
                {form.description || 'Campaign story and impact details will appear here.'}
              </div>
            </div>
          </div>
        ) : null}

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Create New Campaign</h1>
            <p className="mt-1 text-sm text-[#64748B]">Fill in the details to start your fundraising initiative.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-semibold text-[#475569] shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:bg-[#F8FAFC]"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-semibold text-[#475569] shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:bg-[#F8FAFC]"
              onClick={() => setShowPreview(true)}
            >
              Preview
            </button>
            <button
              type="button"
              className="rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] hover:bg-[#1D4ED8]"
              onClick={() => handleSubmit('active')}
              disabled={submitting}
            >
              Publish Campaign
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
          <div className="org-cpg-steps">
            {steps.map((step, index) => {
              const status =
                index < activeStep ? 'complete' : index === activeStep ? 'active' : 'upcoming';
              return (
                <div key={step.id} className={`org-cpg-step ${status}`}>
                  <button
                    type="button"
                    className="org-cpg-step-circle"
                    onClick={() => setActiveStep(index)}
                    aria-current={index === activeStep ? 'step' : undefined}
                  >
                    {index + 1}
                  </button>
                  <span className="org-cpg-step-label">{step.label}</span>
                  {index < steps.length - 1 ? <span className="org-cpg-step-line" /> : null}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              {activeStep === 0 ? (
                <section className="org-cpg-panel">
                  <div className="org-cpg-panel-head">
                    <h2>Campaign Fundamentals</h2>
                    <span>Basic Info</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                      Campaign Title
                      <input
                        type="text"
                        placeholder="e.g., Clean Water for Siem Reap Communities"
                        value={form.title}
                        onChange={handleChange('title')}
                        className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </label>
                    <label className="text-sm font-semibold text-[#334155]">
                      Category
                      <select
                        value={form.category}
                        onChange={handleChange('category')}
                        className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      >
                        <option value="">Select Category</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Community">Community</option>
                        <option value="Infrastructure">Infrastructure</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-[#334155]">
                      Campaign Location
                      <input
                        type="text"
                        placeholder="City, Region"
                        value={form.location}
                        onChange={handleChange('location')}
                        className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </label>
                    <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                      Short Summary
                      <textarea
                        rows={3}
                        placeholder="Briefly describe your campaign mission in 2-3 sentences."
                        value={form.summary}
                        onChange={handleChange('summary')}
                        className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              {activeStep === 1 ? (
                <section className="org-cpg-panel">
                  <div className="org-cpg-panel-head">
                    <h2>Campaign Goals</h2>
                    <span>Goals & Timeline</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-[#334155]">
                      Fundraising Goal ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="$ 0.00"
                        value={form.goal}
                        onChange={handleChange('goal')}
                        className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </label>
                  </div>
                  <div className="mt-6 border-t border-[#E2E8F0] pt-5">
                    <div className="mb-4 flex items-center gap-2 text-base font-bold text-[#0F172A]">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFF] text-[#2563EB]">
                        <Image className="h-4 w-4" />
                      </span>
                      Timeline
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#334155]">
                        Start Date
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={handleChange('startDate')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        End Date
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={handleChange('endDate')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                    <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#475569]">
                      <input type="checkbox" className="h-4 w-4 rounded border border-[#CBD5F5]" />
                      Enable recurring donations
                      <span className="org-cpg-pill">Recommended</span>
                    </label>
                    <p className="mt-2 text-xs text-[#64748B]">
                      Allow donors to give monthly or quarterly to sustain your campaign long-term.
                    </p>
                  </div>
                </section>
              ) : null}
              {activeStep === 2 ? (
                <section className="org-cpg-panel">
                  <div className="org-cpg-panel-head">
                    <h2>Media Assets</h2>
                    <span>Step 3 of 5</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Campaign Cover Image</p>
                      <p className="text-xs text-[#64748B]">High quality images increase donations by up to 30%.</p>
                      <label className="mt-2 flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7E3F5] bg-[#F8FAFF] text-center text-sm text-[#64748B]">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImagePick}
                          className="hidden"
                        />
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0EAFF] text-[#2563EB]">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="mt-3 font-semibold text-[#0F172A]">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#94A3B8]">Recommended size: 1200 x 600px (PNG, JPG up to 5MB)</p>
                      </label>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Gallery Photos</p>
                      <p className="text-xs text-[#64748B]">Additional photos help donors visualize the impact.</p>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryPick}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="mt-2 inline-flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-[#D7E3F5] bg-[#F8FAFF] text-2xl font-semibold text-[#94A3B8] hover:border-[#93C5FD]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {imagePreviews.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {imagePreviews.map((image) => (
                        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]" key={image.id}>
                          <img src={image.src} alt={image.name} className="h-24 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {activeStep === 3 ? (
                <>
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Campaign Story</h2>
                      <span>Step 4 of 5</span>
                    </div>
                    <label className="text-sm font-semibold text-[#334155]">
                      Story Title
                      <input
                        type="text"
                        defaultValue="Empowering 500 students with digital literacy"
                        className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </label>
                    <div className="mt-4 flex items-center gap-3 text-[#64748B]">
                      <button type="button" onClick={() => applyWrap('**')} className="org-cpg-editor-btn" aria-label="Bold">
                        <Bold className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => applyWrap('*')} className="org-cpg-editor-btn" aria-label="Italic">
                        <Italic className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={applyBulletList} className="org-cpg-editor-btn" aria-label="Bullet list">
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      <textarea
                        ref={textareaRef}
                        rows={6}
                        placeholder="Tell your story. What is the problem? How will you fix it? Who are you helping?"
                        value={form.description}
                        onChange={handleChange('description')}
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#0F172A] outline-none"
                      />
                    </div>
                  </section>

                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Impact Milestones</h2>
                      <button type="button" className="org-cpg-link-btn">Add Milestone</button>
                    </div>
                    <div className="org-cpg-milestones">
                      <div>
                        <span>$5</span>
                        <p>Provides a month of clean water for one family.</p>
                      </div>
                      <div>
                        <span>$50</span>
                        <p>Funds a full stationery kit and textbooks for two students.</p>
                      </div>
                      <div>
                        <span>$200</span>
                        <p>Supports a community training session.</p>
                      </div>
                    </div>
                  </section>

                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Budget Breakdown</h2>
                      <button type="button" className="org-cpg-add-btn">Add Row</button>
                    </div>
                    <div className="org-cpg-budget">
                      <div className="org-cpg-budget-row">
                        <span>Direct Aid & Supplies</span>
                        <span>70%</span>
                        <span>Optional detail</span>
                      </div>
                      <div className="org-cpg-budget-row">
                        <span>Logistics</span>
                        <span>20%</span>
                        <span>Optional detail</span>
                      </div>
                      <div className="org-cpg-budget-row">
                        <span>Operations</span>
                        <span>10%</span>
                        <span>Optional detail</span>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}
              {activeStep === 4 ? (
                <>
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Basics & Timeline</h2>
                      <button type="button" className="org-cpg-link-btn">Edit</button>
                    </div>
                    <div className="org-cpg-summary-grid">
                      <div>
                        <span>Campaign Title</span>
                        <strong>{form.title || 'Clean Water for Communities'}</strong>
                      </div>
                      <div>
                        <span>Category</span>
                        <strong>{form.category || 'Water & Sanitation'}</strong>
                      </div>
                      <div>
                        <span>Target Goal</span>
                        <strong>{form.goal ? `$${form.goal}` : '$50,000'}</strong>
                      </div>
                      <div>
                        <span>Campaign Duration</span>
                        <strong>{form.startDate || 'Oct 12, 2023'} - {form.endDate || 'Dec 31, 2023'}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Media Preview</h2>
                      <button type="button" className="org-cpg-link-btn">Edit</button>
                    </div>
                    <div className="org-cpg-media-grid">
                      {(imagePreviews.length > 0 ? imagePreviews.slice(0, 3) : [1, 2, 3]).map((item) => (
                        <div key={typeof item === 'number' ? item : item.id} className="org-cpg-media-thumb">
                          {typeof item === 'number' ? null : (
                            <img src={item.src} alt={item.name} />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Story & Impact Milestones</h2>
                      <button type="button" className="org-cpg-link-btn">Edit</button>
                    </div>
                    <p className="text-sm text-[#64748B]">Narrative preview and milestones summary.</p>
                  </section>

                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Fund Allocation</h2>
                      <button type="button" className="org-cpg-link-btn">Edit</button>
                    </div>
                    <div className="org-cpg-budget">
                      <div className="org-cpg-budget-row">
                        <span>Equipment & Materials</span>
                        <span>65%</span>
                        <span>Labor & Installation 20%</span>
                      </div>
                      <div className="org-cpg-budget-row">
                        <span>Operations</span>
                        <span>10%</span>
                        <span>Platform Fees 5%</span>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}
            </div>

            <aside className="space-y-6">
              {(activeStep === 0 || activeStep === 1) ? (
                <>
                  <section className="org-cpg-card">
                    <div className="org-cpg-card-head">
                      <h3>Campaign Preview</h3>
                      <span className="org-cpg-status-tag">{statusLabel}</span>
                    </div>
                    <div className="org-cpg-progress-row">
                      <span>Profile Completion</span>
                      <strong>{completion}%</strong>
                    </div>
                    <div className="org-cpg-progress-bar">
                      <span style={{ width: `${completion}%` }} />
                    </div>
                    <div className="org-cpg-preview-list">
                      {steps.map((step, index) => (
                        <div key={step.id} className="org-cpg-preview-row">
                          <span className={`org-cpg-preview-dot ${index <= activeStep ? 'is-done' : ''}`} aria-hidden="true" />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="org-cpg-tips is-goals">
                    <h4>Tips for Success</h4>
                    <div className="org-cpg-tip-block">
                      <strong>Set realistic goals</strong>
                      <p>Look at your past performance and donor base size. Goals that are ambitious but achievable drive more momentum.</p>
                    </div>
                    <div className="org-cpg-tip-block">
                      <strong>Define your timeline</strong>
                      <p>Most successful campaigns last 30-45 days. Longer campaigns often benefit from recurring donation setups.</p>
                    </div>
                    <button type="button" className="org-cpg-link-btn">View goal-setting guide</button>
                  </section>
                </>
              ) : null}
              {activeStep === 2 ? (
                <>
                  <section className="org-cpg-card">
                    <div className="org-cpg-card-head">
                      <h3>Live Preview</h3>
                      <span className="org-cpg-chip">Live</span>
                    </div>
                    <div className="org-cpg-live-preview">
                      <div className="org-cpg-live-image" />
                      <div className="org-cpg-live-meta">
                        <span className="org-cpg-live-tag">Education</span>
                        <h4>School supplies for every child</h4>
                        <p>$1,200 raised</p>
                      </div>
                    </div>
                  </section>

                  <section className="org-cpg-tips is-media">
                    <h4>Tips for Success</h4>
                    <ul>
                      <li>Use high-resolution photos.</li>
                      <li>Show the beneficiaries.</li>
                      <li>Natural lighting wins.</li>
                    </ul>
                  </section>

                  <section className="org-cpg-support">
                    <h4>Need a photographer?</h4>
                    <p>Our Chomnuoy partners can connect you with local volunteer photographers.</p>
                    <button type="button">Request Support</button>
                  </section>
                </>
              ) : null}

              {activeStep === 3 ? (
                <>
                  <section className="org-cpg-card">
                    <div className="org-cpg-card-head">
                      <h3>Campaign Preview</h3>
                      <span className="org-cpg-status-tag">{statusLabel}</span>
                    </div>
                    <div className="org-cpg-live-preview">
                      <div className="org-cpg-live-image" />
                      <div className="org-cpg-live-meta">
                        <span className="org-cpg-live-tag">Impact</span>
                        <h4>Digital Literacy Project</h4>
                        <p>Progress: {completion}%</p>
                      </div>
                    </div>
                  </section>

                  <section className="org-cpg-tips is-story">
                    <h4>Tips for Success</h4>
                    <ul>
                      <li>Be transparent about where funds go.</li>
                      <li>Include clear milestones.</li>
                      <li>Invite donors to share the story.</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl bg-[#0F172A] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
                    <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-[#94A3B8]">Campaign Status</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      {statusLabel}
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/15">
                      <div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: `${completion}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-[#94A3B8]">Progress: {completion}% complete</p>
                  </section>
                </>
              ) : null}

              {activeStep === 4 ? (
                <section className="org-cpg-card">
                  <div className="org-cpg-card-head">
                    <h3>Live Card Preview</h3>
                    <span className="org-cpg-chip">Review</span>
                  </div>
                  <div className="org-cpg-live-preview">
                    <div className="org-cpg-live-image" />
                    <div className="org-cpg-live-meta">
                      <span className="org-cpg-live-tag">Water</span>
                      <h4>Clean Water for Sub-Saharan Communities</h4>
                      <p>$0 raised</p>
                    </div>
                  </div>
                  <label className="mt-4 flex items-start gap-2 text-xs text-[#64748B]">
                    <input type="checkbox" className="mt-1" />
                    I agree to the Terms of Service and confirm that all information is accurate.
                  </label>
                  <button type="button" className="org-cpg-launch-btn">Launch Campaign</button>
                  <button type="button" className="org-cpg-back-link" onClick={() => setActiveStep(3)}>
                    Back to Story & Impact
                  </button>
                </section>
              ) : null}
            </aside>
          </div>

          {loadingCampaign ? <p className="mt-6 text-sm text-[#64748B]">Loading campaign data...</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B]"
              onClick={() => {
                if (activeStep === 0) {
                  navigate(ROUTES.ORGANIZATION_CAMPAIGNS);
                } else {
                  setActiveStep((prev) => Math.max(0, prev - 1));
                }
              }}
            >
              <ArrowLeft size={16} />
              {activeStep === 0 ? 'Back to campaigns' : 'Back to previous step'}
            </button>
            <button
              type="button"
              className="rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_20px_rgba(37,99,235,0.28)] hover:bg-[#1D4ED8]"
              onClick={() => {
                if (activeStep < steps.length - 1) {
                  setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
                } else {
                  handleSubmit('active');
                }
              }}
              disabled={submitting}
            >
              {activeStep < steps.length - 1
                ? `Next Step: ${steps[activeStep + 1].label} ->`
                : 'Publish Campaign'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
