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
  const materialPhotoInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    location: '',
    summary: '',
    goal: '',
    startDate: '',
    endDate: '',
    description: '',
    payoutMethod: '',
    accountName: '',
    currency: 'USD',
    materialPriority: '',
    pickupInstructions: '',
    payoutSchedule: '',
    receiptMessage: '',
    donationTiers: '',
    contactName: '',
    contactPhone: '',
    storageCapacity: '',
    pickupWindow: '',
    donorUpdates: '',
    distributionPlan: '',
    volunteerNeeds: '',
    enableRecurring: false,
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [materialPhotos, setMaterialPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [campaignType, setCampaignType] = useState('');
  const [typeError, setTypeError] = useState('');
  const [materialItem, setMaterialItem] = useState({
    category: 'clothing',
    name: '',
    quantity: 1,
    description: '',
  });
  const [hybridItems, setHybridItems] = useState([
    { id: 'item-1', name: 'School Bags', quantity: 100, category: 'Education' },
    { id: 'item-2', name: 'Notebooks', quantity: 500, category: 'Education' },
  ]);

  const steps = [
    { id: 'type', label: 'Campaign Type' },
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

  const handleHybridItemChange = (id, field, value) => {
    setHybridItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddHybridItem = () => {
    setHybridItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, name: '', quantity: 1, category: 'Education' },
    ]);
  };

  const handleRemoveHybridItem = (id) => {
    setHybridItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMaterialPhotoPick = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      if (typeof src !== 'string') return;
      setMaterialPhotos((prev) => [
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

  const validateForm = () => {
    if (!form.title.trim()) return 'Campaign title is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (campaignType !== 'materials' && (!form.goal || Number(form.goal) <= 0)) {
      return 'Goal amount must be greater than 0.';
    }
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
          campaign_type: campaignType,
          organization_id: organizationId,
          title: form.title.trim(),
          category: form.category.trim(),
          goal_amount: Number(form.goal),
          start_date: form.startDate,
          end_date: form.endDate,
          description: form.description.trim(),
          payout_method: form.payoutMethod,
          account_name: form.accountName,
          currency: form.currency,
          payout_schedule: form.payoutSchedule,
          receipt_message: form.receiptMessage,
          donation_tiers: form.donationTiers,
          material_priority: form.materialPriority,
          pickup_instructions: form.pickupInstructions,
          contact_name: form.contactName,
          contact_phone: form.contactPhone,
          storage_capacity: form.storageCapacity,
          pickup_window: form.pickupWindow,
          donor_updates: form.donorUpdates,
          distribution_plan: form.distributionPlan,
          volunteer_needs: form.volunteerNeeds,
          enable_recurring: form.enableRecurring,
          material_item: materialItem,
          hybrid_items: hybridItems,
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
                      {form.startDate || '--'}{' -> '}{form.endDate || '--'}
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
              const isComplete = index < activeStep;
              return (
                <div key={step.id} className={`org-cpg-step ${status}`}>
                  <button
                    type="button"
                    className="org-cpg-step-circle"
                    onClick={() => setActiveStep(index)}
                    aria-current={index === activeStep ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${step.label}`}
                  >
                    {isComplete ? (
                      <svg
                        className="org-cpg-step-check"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path
                          d="M6.5 11.2 3.4 8.1l1.1-1.1 2 2 5-5 1.1 1.1-6.1 6.1Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <span className="org-cpg-step-number">{index + 1}</span>
                    )}
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
                <section className="org-cpg-type-screen">
                  <div className="org-cpg-type-top">
                    <div>
                      <h2>New Campaign</h2>
                      <p>Configure your fundraising initiative</p>
                    </div>
                    <div className="org-cpg-type-step">
                      <span>Step 1 of 4</span>
                      <strong>Campaign Type</strong>
                    </div>
                  </div>
                  <div className="org-cpg-type-progress">
                    <span style={{ width: '25%' }} />
                  </div>

                  <div className="org-cpg-type-head">
                    <h3>Choose your campaign type</h3>
                    <p>Select the most effective way to receive support for this initiative.</p>
                  </div>

                  <div className="org-cpg-type-grid">
                    <button
                      type="button"
                      className={`org-cpg-type-card ${campaignType === 'monetary' ? 'is-active' : ''}`}
                      onClick={() => {
                        setCampaignType('monetary');
                        setTypeError('');
                      }}
                      aria-pressed={campaignType === 'monetary'}
                    >
                      <span className="org-cpg-type-choice" aria-hidden="true" />
                      <span className="org-cpg-type-icon">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M7 10h1M16 14h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="org-cpg-type-chip">Fast setup</span>
                      <h3>Monetary Only</h3>
                      <p>Collect funds via bank transfers, digital wallets, or cards.</p>
                      <ul className="org-cpg-type-list">
                        <li>Instant payout tracking</li>
                        <li>Automatic donor receipts</li>
                      </ul>
                    </button>

                    <button
                      type="button"
                      className={`org-cpg-type-card ${campaignType === 'materials' ? 'is-active' : ''}`}
                      onClick={() => {
                        setCampaignType('materials');
                        setTypeError('');
                      }}
                      aria-pressed={campaignType === 'materials'}
                    >
                      <span className="org-cpg-type-choice" aria-hidden="true" />
                      <span className="org-cpg-type-icon">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M8 7v-2h8v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="org-cpg-type-chip">Inventory focus</span>
                      <h3>Materials Only</h3>
                      <p>Request specific items like food, clothes, or equipment.</p>
                      <ul className="org-cpg-type-list">
                        <li>Request quantities by item</li>
                        <li>Donor pickup scheduling</li>
                      </ul>
                    </button>

                    <button
                      type="button"
                      className={`org-cpg-type-card ${campaignType === 'hybrid' ? 'is-active' : ''}`}
                      onClick={() => {
                        setCampaignType('hybrid');
                        setTypeError('');
                      }}
                      aria-pressed={campaignType === 'hybrid'}
                    >
                      <span className="org-cpg-type-choice" aria-hidden="true" />
                      <span className="org-cpg-type-icon">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 7h9v10H4z" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M15 10h5v7h-5z" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M7 10h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M17 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="org-cpg-type-chip is-primary">Recommended</span>
                      <h3>Hybrid Support</h3>
                      <p>Accept both financial contributions and physical donation items.</p>
                      <ul className="org-cpg-type-list">
                        <li>Best for long campaigns</li>
                        <li>Flexible donor options</li>
                      </ul>
                    </button>
                  </div>

                  <div className="org-cpg-type-gallery" aria-hidden="true">
                    <div className="org-cpg-type-photo is-one" />
                    <div className="org-cpg-type-photo is-two" />
                    <div className="org-cpg-type-photo is-three" />
                  </div>

                  {typeError ? <p className="org-cpg-type-error">{typeError}</p> : null}

                  <div className="org-cpg-type-actions">
                    <button
                      type="button"
                      className="org-cpg-type-cancel"
                      onClick={() => navigate(ROUTES.ORGANIZATION_CAMPAIGNS)}
                    >
                      Cancel
                    </button>
                    <div className="org-cpg-type-actions-right">
                      <button
                        type="button"
                        className="org-cpg-type-back"
                        disabled
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="org-cpg-type-continue"
                        onClick={() => {
                          if (!campaignType) {
                            setTypeError('Please choose a campaign type to continue.');
                            return;
                          }
                          setTypeError('');
                          setActiveStep(1);
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeStep === 1 ? (
                campaignType === 'materials' ? (
                  <section className="org-cpg-panel org-cpg-material-panel">
                    <div className="org-cpg-material-head">
                      <div>
                        <h2>Donate Material Items</h2>
                        <p>Fill in the details for the items you wish to contribute.</p>
                      </div>
                      <div className="org-cpg-material-step">
                        <span>Step 2 of 4</span>
                        <strong>Item Details</strong>
                      </div>
                    </div>
                    <div className="org-cpg-material-progress">
                      <span />
                    </div>

                    <div className="org-cpg-material-section">
                      <h3 className="org-cpg-material-title">
                        <span className="org-cpg-material-title-icon" aria-hidden="true" />
                        Item Category
                      </h3>
                      <div className="org-cpg-material-grid">
                        {[
                          { id: 'clothing', label: 'Clothing' },
                          { id: 'books', label: 'Books' },
                          { id: 'electronics', label: 'Electronics' },
                          { id: 'other', label: 'Other' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`org-cpg-material-card ${materialItem.category === item.id ? 'is-active' : ''}`}
                            onClick={() => setMaterialItem((prev) => ({ ...prev, category: item.id }))}
                            aria-pressed={materialItem.category === item.id}
                          >
                            <span className="org-cpg-material-icon" />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="org-cpg-material-form">
                      <label className="org-cpg-material-label">
                        Item Name
                        <input
                          type="text"
                          placeholder="e.g., Winter Jackets"
                          value={materialItem.name}
                          onChange={(event) =>
                            setMaterialItem((prev) => ({ ...prev, name: event.target.value }))
                          }
                        />
                      </label>
                      <label className="org-cpg-material-label">
                        Quantity
                        <div className="org-cpg-qty">
                          <button
                            type="button"
                            onClick={() =>
                              setMaterialItem((prev) => ({
                                ...prev,
                                quantity: Math.max(1, prev.quantity - 1),
                              }))
                            }
                          >
                            -
                          </button>
                          <span>{materialItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setMaterialItem((prev) => ({ ...prev, quantity: prev.quantity + 1 }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </label>
                      <label className="org-cpg-material-label org-cpg-material-desc">
                        Description
                        <textarea
                          rows={4}
                          placeholder="Describe the condition, size, and any other relevant details."
                          value={materialItem.description}
                          onChange={(event) =>
                            setMaterialItem((prev) => ({ ...prev, description: event.target.value }))
                          }
                        />
                      </label>
                    </div>

                    <div className="org-cpg-material-photos">
                      <h3 className="org-cpg-material-title">Item Photos</h3>
                      <div className="org-cpg-material-photos-grid">
                        <label className="org-cpg-material-photo-add">
                          <input
                            ref={materialPhotoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMaterialPhotoPick}
                          />
                          <span>+ Add Photo</span>
                        </label>
                        {materialPhotos.map((photo) => (
                          <div className="org-cpg-material-photo" key={photo.id}>
                            <img src={photo.src} alt={photo.name} />
                            <button
                              type="button"
                              className="org-cpg-material-photo-remove"
                              onClick={() =>
                                setMaterialPhotos((prev) => prev.filter((item) => item.id !== photo.id))
                              }
                              aria-label={`Remove ${photo.name}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="org-cpg-material-help">Recommended: Clear photos in good lighting. Max 5 photos.</p>
                    </div>

                    <div className="org-cpg-material-actions">
                      <button type="button" className="org-cpg-material-back" onClick={() => setActiveStep(0)}>
                        Back to Step 1
                      </button>
                      <div className="org-cpg-material-actions-right">
                        <button type="button" className="org-cpg-material-draft">Save Draft</button>
                        <button
                          type="button"
                          className="org-cpg-material-continue"
                          onClick={() => setActiveStep(2)}
                        >
                          Continue
                        </button>
                      </div>
                    </div>

                    <div className="org-cpg-material-note">
                      <strong>Why clear descriptions matter</strong>
                      <p>
                        Accurate item details help us match your donation with the most urgent community needs.
                      </p>
                    </div>
                  </section>
                ) : campaignType === 'monetary' ? (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Monetary Campaign Details</h2>
                      <span>Funds Only</span>
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
                      <label className="text-sm font-semibold text-[#334155]">
                        Fundraising Goal
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="$ 0.00"
                          value={form.goal}
                          onChange={handleChange('goal')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Currency
                        <select
                          value={form.currency}
                          onChange={handleChange('currency')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        >
                          <option value="USD">USD</option>
                          <option value="KHR">KHR</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Payout Method
                        <select
                          value={form.payoutMethod}
                          onChange={handleChange('payoutMethod')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        >
                          <option value="">Select method</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="wallet">Digital Wallet</option>
                          <option value="card">Card Settlement</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Account Name
                        <input
                          type="text"
                          placeholder="Organization or account holder name"
                          value={form.accountName}
                          onChange={handleChange('accountName')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                  </section>
                ) : (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Hybrid Campaign Details</h2>
                      <span>Funds + Materials</span>
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
                      <label className="text-sm font-semibold text-[#334155]">
                        Fundraising Goal
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="$ 0.00"
                          value={form.goal}
                          onChange={handleChange('goal')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Materials Priority
                        <select
                          value={form.materialPriority}
                          onChange={handleChange('materialPriority')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        >
                          <option value="">Select priority</option>
                          <option value="urgent">Urgent items first</option>
                          <option value="balanced">Balanced mix</option>
                          <option value="bulk">Bulk essentials</option>
                        </select>
                      </label>
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Pickup / Drop-off Instructions
                        <textarea
                          rows={3}
                          placeholder="Provide pickup windows, location details, or storage notes."
                          value={form.pickupInstructions}
                          onChange={handleChange('pickupInstructions')}
                          className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                  </section>
                )
              ) : null}

              {activeStep === 2 ? (
                campaignType === 'materials' ? (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Collection Schedule</h2>
                      <span>Timeline</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#334155]">
                        Collection Start
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={handleChange('startDate')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Collection End
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={handleChange('endDate')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Drop-off / Pickup Location
                        <input
                          type="text"
                          placeholder="Warehouse address or pickup area"
                          value={form.location}
                          onChange={handleChange('location')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Handling Notes
                        <textarea
                          rows={3}
                          placeholder="Storage limits, preferred drop-off times, or contact info."
                          value={form.pickupInstructions}
                          onChange={handleChange('pickupInstructions')}
                          className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                  </section>
                ) : campaignType === 'hybrid' ? (
                  <section className="org-cpg-panel org-cpg-hybrid-panel">
                    <div className="org-cpg-hybrid-head">
                      <div>
                        <span className="org-cpg-hybrid-step">Step 2 of 4</span>
                        <h2>Campaign Goals</h2>
                      </div>
                      <div className="org-cpg-hybrid-progress">
                        <span>50% Complete</span>
                        <div className="org-cpg-hybrid-bar">
                          <span />
                        </div>
                      </div>
                    </div>

                    <div className="org-cpg-hybrid-block">
                      <div className="org-cpg-hybrid-block-head">
                        <h3>Monetary Goal</h3>
                      </div>
                      <div className="org-cpg-hybrid-grid">
                        <label className="org-cpg-hybrid-label">
                          Target Amount (USD)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="$ 0.00"
                            value={form.goal}
                            onChange={handleChange('goal')}
                          />
                        </label>
                        <div className="org-cpg-hybrid-toggle">
                          <span>Enable Recurring</span>
                          <button
                            type="button"
                            className={`org-cpg-hybrid-switch ${form.enableRecurring ? 'is-on' : ''}`}
                            aria-pressed={form.enableRecurring}
                            onClick={() =>
                              setForm((prev) => ({ ...prev, enableRecurring: !prev.enableRecurring }))
                            }
                          >
                            <span />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="org-cpg-hybrid-block">
                      <div className="org-cpg-hybrid-block-head">
                        <h3>Material Items Needed</h3>
                        <button type="button" className="org-cpg-link-btn" onClick={handleAddHybridItem}>
                          + Add Item
                        </button>
                      </div>
                      <div className="org-cpg-hybrid-items">
                        {hybridItems.map((item) => (
                          <div className="org-cpg-hybrid-item" key={item.id}>
                            <label>
                              Item Name
                              <input
                                type="text"
                                value={item.name}
                                onChange={(event) => handleHybridItemChange(item.id, 'name', event.target.value)}
                              />
                            </label>
                            <label>
                              Quantity
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(event) =>
                                  handleHybridItemChange(item.id, 'quantity', Number(event.target.value))
                                }
                              />
                            </label>
                            <label>
                              Category
                              <select
                                value={item.category}
                                onChange={(event) => handleHybridItemChange(item.id, 'category', event.target.value)}
                              >
                                <option value="Education">Education</option>
                                <option value="Health">Health</option>
                                <option value="Food">Food</option>
                                <option value="Other">Other</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              className="org-cpg-hybrid-trash"
                              aria-label="Remove item"
                              onClick={() => handleRemoveHybridItem(item.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Campaign Timeline</h2>
                      <span>Schedule</span>
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
                  </section>
                )
              ) : null}
              {activeStep === 3 ? (
                campaignType === 'materials' ? (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Logistics & Storage</h2>
                      <span>Materials Ops</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#334155]">
                        Storage Capacity
                        <input
                          type="text"
                          placeholder="e.g., 200 boxes / 1 room"
                          value={form.storageCapacity}
                          onChange={handleChange('storageCapacity')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Preferred Pickup Window
                        <input
                          type="text"
                          placeholder="Weekdays 9:00 - 16:00"
                          value={form.pickupWindow}
                          onChange={handleChange('pickupWindow')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Contact Person
                        <input
                          type="text"
                          placeholder="Full name"
                          value={form.contactName}
                          onChange={handleChange('contactName')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Contact Phone
                        <input
                          type="tel"
                          placeholder="+855 12 345 678"
                          value={form.contactPhone}
                          onChange={handleChange('contactPhone')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Handling Notes
                        <textarea
                          rows={3}
                          placeholder="Special handling instructions, storage limits, or staff availability."
                          value={form.pickupInstructions}
                          onChange={handleChange('pickupInstructions')}
                          className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                  </section>
                ) : campaignType === 'monetary' ? (
                  <section className="org-cpg-panel">
                    <div className="org-cpg-panel-head">
                      <h2>Payment & Receipts</h2>
                      <span>Funds Flow</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#334155]">
                        Payout Schedule
                        <select
                          value={form.payoutSchedule}
                          onChange={handleChange('payoutSchedule')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        >
                          <option value="">Select schedule</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-[#334155]">
                        Receipt Message
                        <input
                          type="text"
                          placeholder="Short thank-you note on donor receipt"
                          value={form.receiptMessage}
                          onChange={handleChange('receiptMessage')}
                          className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Suggested Donation Tiers
                        <textarea
                          rows={3}
                          placeholder="$10 - Provides a hygiene kit&#10;$50 - Covers school supplies for 1 child"
                          value={form.donationTiers}
                          onChange={handleChange('donationTiers')}
                          className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                        />
                      </label>
                    </div>
                  </section>
                ) : (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Media Assets</h2>
                        <span>Campaign Gallery</span>
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

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Logistics Snapshot</h2>
                        <span>Materials Ops</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-[#334155]">
                          Preferred Pickup Window
                          <input
                            type="text"
                            placeholder="Weekdays 9:00 - 16:00"
                            value={form.pickupWindow}
                            onChange={handleChange('pickupWindow')}
                            className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                          />
                        </label>
                        <label className="text-sm font-semibold text-[#334155]">
                          Contact Person
                          <input
                            type="text"
                            placeholder="Full name"
                            value={form.contactName}
                            onChange={handleChange('contactName')}
                            className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                          />
                        </label>
                      </div>
                    </section>
                  </>
                )
              ) : null}

              {activeStep === 4 ? (
                campaignType === 'materials' ? (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Impact Story</h2>
                        <span>Materials Story</span>
                      </div>
                      <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                        <textarea
                          ref={textareaRef}
                          rows={6}
                          placeholder="Share how these items will be used and who will benefit."
                          value={form.description}
                          onChange={handleChange('description')}
                          className="w-full bg-transparent px-4 py-4 text-sm text-[#0F172A] outline-none"
                        />
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Distribution Plan</h2>
                        <span>Delivery</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Explain where items will go, estimated timeline, and partners involved."
                        value={form.distributionPlan}
                        onChange={handleChange('distributionPlan')}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Volunteer Needs</h2>
                        <span>Support</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="List roles, shift times, and contact details for volunteers."
                        value={form.volunteerNeeds}
                        onChange={handleChange('volunteerNeeds')}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </section>
                  </>
                ) : campaignType === 'monetary' ? (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Campaign Story</h2>
                        <span>Donor Narrative</span>
                      </div>
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
                          placeholder="Explain the problem, your plan, and the expected impact."
                          value={form.description}
                          onChange={handleChange('description')}
                          className="w-full bg-transparent px-4 py-4 text-sm text-[#0F172A] outline-none"
                        />
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Donor Updates Plan</h2>
                        <span>Engagement</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Describe how often you will update donors and what they can expect."
                        value={form.donorUpdates}
                        onChange={handleChange('donorUpdates')}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Budget Breakdown</h2>
                        <button type="button" className="org-cpg-add-btn">Add Row</button>
                      </div>
                      <div className="org-cpg-budget">
                        <div className="org-cpg-budget-row">
                          <span>Direct Aid</span>
                          <span>70%</span>
                          <span>Optional detail</span>
                        </div>
                        <div className="org-cpg-budget-row">
                          <span>Operations</span>
                          <span>20%</span>
                          <span>Optional detail</span>
                        </div>
                        <div className="org-cpg-budget-row">
                          <span>Platform Fees</span>
                          <span>10%</span>
                          <span>Optional detail</span>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
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
                        <h2>Distribution Plan</h2>
                        <span>Materials</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Explain how donated items will be distributed."
                        value={form.distributionPlan}
                        onChange={handleChange('distributionPlan')}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                      />
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
                )
              ) : null}
              {activeStep === 5 ? (
                campaignType === 'materials' ? (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Item Summary</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <div className="org-cpg-summary-grid">
                        <div>
                          <span>Category</span>
                          <strong>{materialItem.category || 'Clothing'}</strong>
                        </div>
                        <div>
                          <span>Item Name</span>
                          <strong>{materialItem.name || 'Winter Jackets'}</strong>
                        </div>
                        <div>
                          <span>Quantity</span>
                          <strong>{materialItem.quantity || 1}</strong>
                        </div>
                        <div>
                          <span>Collection Dates</span>
                          <strong>{form.startDate || '--'} - {form.endDate || '--'}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Collection Plan</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <div className="org-cpg-summary-grid">
                        <div>
                          <span>Pickup Window</span>
                          <strong>{form.pickupWindow || 'Weekdays 9:00 - 16:00'}</strong>
                        </div>
                        <div>
                          <span>Contact</span>
                          <strong>{form.contactName || 'Team Lead'}</strong>
                        </div>
                        <div>
                          <span>Phone</span>
                          <strong>{form.contactPhone || '+855 12 345 678'}</strong>
                        </div>
                        <div>
                          <span>Storage Capacity</span>
                          <strong>{form.storageCapacity || '200 boxes'}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Item Photos</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <div className="org-cpg-media-grid">
                        {(materialPhotos.length > 0 ? materialPhotos.slice(0, 3) : [1, 2, 3]).map((item) => (
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
                        <h2>Story & Distribution</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {form.description || 'Impact story summary.'}
                      </p>
                      <p className="mt-3 text-sm text-[#64748B]">
                        {form.distributionPlan || 'Distribution plan summary.'}
                      </p>
                    </section>
                  </>
                ) : campaignType === 'monetary' ? (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Fundraising Summary</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <div className="org-cpg-summary-grid">
                        <div>
                          <span>Campaign Title</span>
                          <strong>{form.title || 'Community Relief Fund'}</strong>
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>{form.category || 'Community'}</strong>
                        </div>
                        <div>
                          <span>Target Goal</span>
                          <strong>{form.goal ? `$${form.goal}` : '$50,000'}</strong>
                        </div>
                        <div>
                          <span>Campaign Duration</span>
                          <strong>{form.startDate || '--'} - {form.endDate || '--'}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Payout Details</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <div className="org-cpg-summary-grid">
                        <div>
                          <span>Method</span>
                          <strong>{form.payoutMethod || 'Bank Transfer'}</strong>
                        </div>
                        <div>
                          <span>Account Name</span>
                          <strong>{form.accountName || 'Organization Account'}</strong>
                        </div>
                        <div>
                          <span>Schedule</span>
                          <strong>{form.payoutSchedule || 'Monthly'}</strong>
                        </div>
                        <div>
                          <span>Receipt Note</span>
                          <strong>{form.receiptMessage || 'Thank you for your support!'}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Story & Donor Updates</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {form.description || 'Narrative summary.'}
                      </p>
                      <p className="mt-3 text-sm text-[#64748B]">
                        {form.donorUpdates || 'Donor update plan summary.'}
                      </p>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="org-cpg-panel">
                      <div className="org-cpg-panel-head">
                        <h2>Hybrid Summary</h2>
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
                          <span>Materials Priority</span>
                          <strong>{form.materialPriority || 'Balanced mix'}</strong>
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
                        <h2>Logistics & Distribution</h2>
                        <button type="button" className="org-cpg-link-btn">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {form.pickupInstructions || 'Pickup and handling notes.'}
                      </p>
                      <p className="mt-3 text-sm text-[#64748B]">
                        {form.distributionPlan || 'Distribution plan summary.'}
                      </p>
                    </section>
                  </>
                )
              ) : null}
            </div>

            <aside className="space-y-6">
              {(activeStep === 1 || activeStep === 2) ? (
                <>
                  {activeStep === 2 && campaignType === 'hybrid' ? (
                    <>
                      <section className="org-cpg-hybrid-preview">
                        <span className="org-cpg-hybrid-chip">Hybrid Campaign</span>
                        <div className="org-cpg-hybrid-preview-image" />
                        <div className="org-cpg-hybrid-preview-body">
                          <h4>Support Rural Education 2024</h4>
                          <p>Providing essential school supplies and financial support to children in need.</p>
                          <div className="org-cpg-hybrid-preview-row">
                            <span>$0 Raised</span>
                            <span>Target: ${form.goal || '5,000'}</span>
                          </div>
                          <div className="org-cpg-hybrid-preview-tags">
                            <span>100x Bags</span>
                            <span>500x Notebooks</span>
                          </div>
                          <button type="button">View Campaign Details</button>
                        </div>
                      </section>

                      <section className="org-cpg-hybrid-note">
                        <strong>Did you know?</strong>
                        <p>Hybrid campaigns typically receive 40% more engagement by offering donors multiple ways to contribute.</p>
                      </section>
                    </>
                  ) : (
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
                  )}
                </>
              ) : null}
              {activeStep === 3 ? (
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

              {activeStep === 4 ? (
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

              {activeStep === 5 ? (
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

          {activeStep === 0 ? null : (
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
                  if (activeStep === 0 && !campaignType) {
                    setTypeError('Please choose a campaign type to continue.');
                    return;
                  }
                  setTypeError('');
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
          )}
        </section>
      </main>
    </div>
  );
}
