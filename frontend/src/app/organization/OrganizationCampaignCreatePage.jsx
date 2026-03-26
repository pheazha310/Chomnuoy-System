import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bold, Crosshair, Italic, List, MapPinned, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import OrganizationIdentityPill from './OrganizationIdentityPill.jsx';
import './organization.css';

const DEFAULT_COORDINATE_CENTER = [11.5564, 104.9282];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MATERIAL_CATEGORY_OPTIONS = [
  {
    id: 'clothing',
    label: 'Clothing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 5.5 12 7l2.5-1.5 2 2.5L20 9.5l-2 3V19a1 1 0 0 1-1 1h-3v-6h-4v6H7a1 1 0 0 1-1-1v-6.5l-2-3L7.5 8l2-2.5Z" />
      </svg>
    ),
  },
  {
    id: 'books',
    label: 'Books',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H18v15H8.5A2.5 2.5 0 0 0 6 20.5V5.5Z" />
        <path d="M6 5.5V20.5" />
        <path d="M10 7h4" />
      </svg>
    ),
  },
  {
    id: 'electronics',
    label: 'Electronics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="10" rx="2" />
        <path d="M8 19h8" />
        <path d="M10 15v4" />
        <path d="M14 15v4" />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.5 19 7v10l-7 3.5L5 17V7l7-3.5Z" />
        <path d="M5 7 12 11l7-4" />
        <path d="M12 11v9.5" />
      </svg>
    ),
  },
];

const createBudgetRow = (id, label = '', percentage = '', detail = '') => ({
  id,
  label,
  percentage,
  detail,
});

export default function OrganizationCampaignCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const materialPhotoInputRef = useRef(null);
  const locationSearchAbortRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    location: '',
    latitude: '',
    longitude: '',
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
  const [supportRequested, setSupportRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [campaignType, setCampaignType] = useState('');
  const [reviewAccepted, setReviewAccepted] = useState(false);
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
  const [budgetRowsByType, setBudgetRowsByType] = useState({
    monetary: [
      createBudgetRow('budget-money-1', 'Direct Aid', '70', ''),
      createBudgetRow('budget-money-2', 'Operations', '20', ''),
      createBudgetRow('budget-money-3', 'Platform Fees', '10', ''),
    ],
    hybrid: [
      createBudgetRow('budget-hybrid-1', 'Direct Aid & Supplies', '70', ''),
      createBudgetRow('budget-hybrid-2', 'Logistics', '20', ''),
      createBudgetRow('budget-hybrid-3', 'Operations', '10', ''),
    ],
  });

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

  const previewImage = imagePreviews[0]?.src || materialPhotos[0]?.src || '';
  const previewCategory = form.category?.trim() || (campaignType === 'materials' ? 'Materials' : campaignType === 'monetary' ? 'Fundraising' : 'Impact');
  const previewTitle = form.title?.trim() || (campaignType === 'materials' ? 'Item collection campaign' : campaignType === 'monetary' ? 'Fundraising campaign' : 'Hybrid impact campaign');
  const previewMetric = campaignType === 'monetary'
    ? `${form.goal ? `$${Number(form.goal).toLocaleString()}` : '$0'} target`
    : campaignType === 'materials'
      ? `${materialItem.quantity || 0} items requested`
      : `Progress: ${completion}%`;
  const reviewRaisedText = campaignType === 'materials'
    ? `${materialItem.quantity || 0} items requested`
    : `$0 raised of ${form.goal ? `$${Number(form.goal).toLocaleString()}` : '$0'}`;
  const mediaTips = useMemo(() => {
    const tips = [];
    if (!previewImage) tips.push('Upload a cover image so donors immediately see your campaign.');
    if (!form.title.trim()) tips.push('Add a clear campaign title before publishing.');
    if (!form.category.trim()) tips.push('Choose a category so the preview feels complete.');
    if (tips.length === 0) {
      return [
        'Your preview is live and updating with the current form values.',
        'Use a sharp cover image and short title for better engagement.',
        'Review the card on mobile before publishing.',
      ];
    }
    return tips;
  }, [form.category, form.title, previewImage]);

  const statusLabel = completion >= 90 ? 'Ready to Publish' : completion >= 50 ? 'In Progress' : 'Drafting';
  const hasPickupCoordinates = form.latitude !== '' && form.longitude !== '' && Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));
  const editId = useMemo(() => {
    const raw = searchParams.get('edit');
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [searchParams]);
  const isEditing = Boolean(editId);

  useEffect(() => () => {
    if (locationSearchAbortRef.current) {
      locationSearchAbortRef.current.abort();
    }
  }, []);

  const getStorageFileUrl = (path) => {
    if (!path) return '';
    const rawPath = String(path).trim();
    if (
      rawPath.startsWith('http://') ||
      rawPath.startsWith('https://') ||
      rawPath.startsWith('blob:') ||
      rawPath.startsWith('data:')
    ) {
      return rawPath;
    }

    const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const appBase = apiBase.replace(/\/api\/?$/, '');
    if (normalizedPath.startsWith('uploads/')) {
      return `${appBase}/${normalizedPath}`;
    }
    if (normalizedPath.startsWith('storage/')) {
      return `${appBase}/${normalizedPath}`;
    }
    return `${appBase}/storage/${normalizedPath}`;
  };

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

  const applyLocationSelection = (result) => {
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setLocationError('Selected location does not contain valid coordinates.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      location: result.display_name || prev.location,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setLocationError('');
    setLocationSearchResults([]);
  };

  const searchPickupLocation = async () => {
    const query = form.location.trim();
    if (!query) {
      setLocationError('Enter an address or pickup area to search.');
      setLocationSearchResults([]);
      return;
    }

    if (locationSearchAbortRef.current) {
      locationSearchAbortRef.current.abort();
    }

    const controller = new AbortController();
    locationSearchAbortRef.current = controller;
    setLocationSearchLoading(true);
    setLocationError('');

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('countrycodes', 'kh');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('q', query);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Location search failed (${response.status})`);
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        setLocationSearchResults([]);
        setLocationError('No matching locations were found. Try a more specific address.');
        return;
      }

      setLocationSearchResults(results);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setLocationSearchResults([]);
      setLocationError(err instanceof Error ? err.message : 'Unable to search locations right now.');
    } finally {
      if (locationSearchAbortRef.current === controller) {
        locationSearchAbortRef.current = null;
      }
      setLocationSearchLoading(false);
    }
  };

  const reverseLookupPickupLocation = async (latitude, longitude) => {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', String(latitude));
      url.searchParams.set('lon', String(longitude));

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) return;
      const result = await response.json();
      if (typeof result?.display_name !== 'string' || !result.display_name.trim()) return;

      setForm((prev) => ({
        ...prev,
        location: result.display_name,
      }));
    } catch {
      // keep detected coordinates even if reverse lookup fails
    }
  };

  const handleDetectPickupLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setForm((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        setLocationSearchResults([]);
        setLocationLoading(false);
        reverseLookupPickupLocation(latitude, longitude);
      },
      (geoError) => {
        setLocationError(geoError?.message || 'Unable to detect your location.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const renderCoordinateTracker = ({
    title = 'Map Coordinates',
    description = 'Store latitude and longitude for a precise campaign location.',
    mapTitle = 'Campaign location map preview',
    emptyMessage = 'Add coordinates manually or use current location to preview the location on the map.',
    inputClassName = 'mt-1.5 h-11 w-full rounded-xl border border-[#CFE0F6] bg-white px-4 text-base font-semibold normal-case tracking-normal text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]',
    containerClassName = 'mt-3 overflow-hidden rounded-[26px] border border-[#D9E6F6] bg-[linear-gradient(180deg,#FBFDFF_0%,#F4F8FF_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.06)]',
    fieldsClassName = 'grid gap-3 lg:grid-cols-2',
    statusLabel = hasPickupCoordinates ? 'Pinned' : 'Awaiting pin',
  } = {}) => {
    const previewCenter = hasPickupCoordinates
      ? [Number(form.latitude), Number(form.longitude)]
      : DEFAULT_COORDINATE_CENTER;

    return (
      <div className={containerClassName}>
        <div className="border-b border-[#DDE8F5] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.10)]">
                  <MapPinned size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-extrabold tracking-tight text-[#0F172A]">{title}</p>
                    <span className="inline-flex rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-[#64748B]">{description}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectPickupLocation}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-xl border border-[#BFD6FF] bg-white px-4 text-sm font-bold text-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:text-[#1D4ED8] lg:w-auto"
            >
              <Crosshair size={16} />
              {locationLoading ? 'Detecting...' : 'Use Current'}
            </button>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className={fieldsClassName}>
            <label className="rounded-[20px] border border-[#E6EEF8] bg-white/90 p-3.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5F7595] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              Latitude
              <input
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="11.5564"
                value={form.latitude}
                onChange={handleChange('latitude')}
                className={inputClassName}
              />
            </label>
            <label className="rounded-[20px] border border-[#E6EEF8] bg-white/90 p-3.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5F7595] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              Longitude
              <input
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="104.9282"
                value={form.longitude}
                onChange={handleChange('longitude')}
                className={inputClassName}
              />
            </label>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {hasPickupCoordinates ? (
            <div className="overflow-hidden rounded-[28px] border border-[#D7E3F4] bg-white shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
              <div className="h-[240px] w-full sm:h-[260px]">
                <MapContainer
                  key={`${previewCenter[0]}-${previewCenter[1]}`}
                  center={previewCenter}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={previewCenter}>
                    <Popup>
                      <strong>{mapTitle}</strong>
                      <br />
                      Lat: {Number(form.latitude).toFixed(5)}, Lng: {Number(form.longitude).toFixed(5)}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#E2E8F0] bg-[#FCFDFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2563EB]">
                    Coordinates saved
                  </span>
                  <p className="mt-1 text-sm font-medium text-[#64748B] sm:text-base">
                    Lat {Number(form.latitude).toFixed(5)}, Lng {Number(form.longitude).toFixed(5)}
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=12/${form.latitude}/${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#2563EB] px-5 text-base font-bold text-white transition hover:bg-[#1D4ED8]"
                >
                  Open Map
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#CFE0F6] bg-white/80 px-6 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#2563EB]">
                <MapPinned size={20} />
              </div>
              <p className="mt-4 text-xl font-bold tracking-tight text-[#0F172A]">Map preview</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">{emptyMessage}</p>
            </div>
          )}
        </div>
        {locationError ? (
          <div className="border-t border-[#F3D2D2] bg-[#FFF7F7] px-5 py-3 text-sm font-medium text-[#DC2626] sm:px-6">
            {locationError}
          </div>
        ) : null}
      </div>
    );
  };

  const appendImageFiles = (files, replaceExisting = false) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result;
        if (typeof src !== 'string') return;
        setImagePreviews((prev) => {
          const nextItem = {
            id: `${file.name}-${file.lastModified}-${index}`,
            name: file.name,
            src,
            file,
            isExisting: false,
          };
          if (replaceExisting) {
            return [nextItem, ...prev.slice(1)];
          }
          return [...prev, nextItem];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImagePreview = (id) => {
    setImagePreviews((prev) => prev.filter((item) => item.id !== id));
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
    appendImageFiles([file], true);
    event.target.value = '';
  };

  const handleGalleryPick = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    appendImageFiles(files);
    event.target.value = '';
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

  const handleBudgetRowChange = (budgetType, rowId, field, value) => {
    setBudgetRowsByType((prev) => ({
      ...prev,
      [budgetType]: prev[budgetType].map((row) => (
        row.id === rowId ? { ...row, [field]: value } : row
      )),
    }));
  };

  const handleAddBudgetRow = (budgetType) => {
    setBudgetRowsByType((prev) => ({
      ...prev,
      [budgetType]: [
        ...prev[budgetType],
        createBudgetRow(`budget-${budgetType}-${Date.now()}`, '', '', ''),
      ],
    }));
  };

  const handleRemoveBudgetRow = (budgetType, rowId) => {
    setBudgetRowsByType((prev) => {
      const nextRows = prev[budgetType].filter((row) => row.id !== rowId);
      return {
        ...prev,
        [budgetType]: nextRows.length > 0 ? nextRows : [createBudgetRow(`budget-${budgetType}-${Date.now()}`, '', '', '')],
      };
    });
  };

  const renderBudgetBreakdown = (budgetType) => {
    const rows = budgetRowsByType[budgetType] || [];
    const totalPercentage = rows.reduce((sum, row) => {
      const value = Number(row.percentage);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    const isBalanced = totalPercentage === 100;

    return (
      <section className="org-cpg-panel">
        <div className="org-cpg-panel-head">
          <div>
            <h2>Budget Breakdown</h2>
            <span>{rows.length} active rows</span>
          </div>
          <button type="button" className="org-cpg-add-btn" onClick={() => handleAddBudgetRow(budgetType)}>
            <Plus size={14} />
            Add Row
          </button>
        </div>
        <div className="org-cpg-budget-head">
          <div>
            <strong>{totalPercentage}% allocated</strong>
            <span>{isBalanced ? 'Budget total is balanced.' : 'Adjust rows until the total reaches 100%.'}</span>
          </div>
          <span className={`org-cpg-budget-total ${isBalanced ? 'is-balanced' : 'is-warning'}`}>
            {isBalanced ? 'Ready' : `${100 - totalPercentage}% left`}
          </span>
        </div>
        <div className="org-cpg-budget">
          {rows.map((row) => (
            <div key={row.id} className="org-cpg-budget-row is-editable">
              <label>
                Category
                <input
                  type="text"
                  placeholder="Direct Aid"
                  value={row.label}
                  onChange={(event) => handleBudgetRowChange(budgetType, row.id, 'label', event.target.value)}
                />
              </label>
              <label>
                Percent
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="25"
                  value={row.percentage}
                  onChange={(event) => handleBudgetRowChange(budgetType, row.id, 'percentage', event.target.value)}
                />
              </label>
              <label>
                Detail
                <input
                  type="text"
                  placeholder="Optional detail"
                  value={row.detail}
                  onChange={(event) => handleBudgetRowChange(budgetType, row.id, 'detail', event.target.value)}
                />
              </label>
              <button
                type="button"
                className="org-cpg-budget-remove"
                onClick={() => handleRemoveBudgetRow(budgetType, row.id)}
                aria-label="Remove budget row"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    );
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

  const handleRequestSupport = () => {
    setSupportRequested(true);
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

  const uploadCampaignImages = async (campaignId) => {
    const newImages = imagePreviews.filter((item) => item.file instanceof File);
    if (newImages.length === 0) return [];

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const failures = [];

    await Promise.all(newImages.map(async (item) => {
      const body = new FormData();
      body.append('campaign_id', String(campaignId));
      body.append('image', item.file);

      const response = await fetch(`${apiBase}/campaign_image`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const message = await response.text();
        failures.push(message || `Failed to upload image (${response.status})`);
      }
    }));

    return failures;
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
          location: form.location.trim(),
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
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

      const savedCampaign = await response.json();
      const savedCampaignId = Number(savedCampaign?.id ?? editId);
      let imageUploadFailures = [];
      if (savedCampaignId) {
        imageUploadFailures = await uploadCampaignImages(savedCampaignId);
      }

      if (isEditing) {
        setSuccess(
          imageUploadFailures.length > 0
            ? 'Campaign updated, but campaign images could not be uploaded.'
            : 'Campaign updated.'
        );
      } else {
        setSuccess(
          imageUploadFailures.length > 0
            ? (status === 'draft'
              ? 'Draft saved, but campaign images could not be uploaded.'
              : 'Campaign published, but campaign images could not be uploaded.')
            : (status === 'draft' ? 'Draft saved.' : 'Campaign published.')
        );
      }
      if (status === 'active') {
        try {
          await fetch(`${apiBase}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: organizationId,
              message: `New campaign published: ${form.title.trim() || 'Untitled Campaign'}`,
              type: 'campaign',
              is_read: false,
            }),
          });
        } catch {
          // non-blocking notification failure
        }
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
    Promise.all([
      fetch(`${apiBase}/campaigns/${editId}`).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaign (${response.status})`);
        }
        return response.json();
      }),
      fetch(`${apiBase}/campaign_image?campaign_id=${editId}`).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaign images (${response.status})`);
        }
        return response.json();
      }),
    ])
      .then(([data, images]) => {
        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          title: data?.title || '',
          category: data?.category || '',
          location: data?.location || '',
          latitude: data?.latitude ?? '',
          longitude: data?.longitude ?? '',
          summary: data?.summary || '',
          goal: data?.goal_amount ?? '',
          startDate: data?.start_date || '',
          endDate: data?.end_date || '',
          description: data?.description || '',
          payoutMethod: data?.payout_method || '',
          accountName: data?.account_name || '',
          currency: data?.currency || 'USD',
          materialPriority: data?.material_priority || '',
          pickupInstructions: data?.pickup_instructions || '',
          payoutSchedule: data?.payout_schedule || '',
          receiptMessage: data?.receipt_message || '',
          donationTiers: data?.donation_tiers || '',
          contactName: data?.contact_name || '',
          contactPhone: data?.contact_phone || '',
          storageCapacity: data?.storage_capacity || '',
          pickupWindow: data?.pickup_window || '',
          donorUpdates: data?.donor_updates || '',
          distributionPlan: data?.distribution_plan || '',
          volunteerNeeds: data?.volunteer_needs || '',
          enableRecurring: Boolean(data?.enable_recurring),
        }));
        setCampaignType(data?.campaign_type || '');
        setImagePreviews(
          Array.isArray(images)
            ? images.map((image) => ({
              id: `existing-${image.id}`,
              name: image.image_path || `Campaign image ${image.id}`,
              src: getStorageFileUrl(image.image_path),
              isExisting: true,
            }))
            : [],
        );
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
            <OrganizationIdentityPill />
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
                        {MATERIAL_CATEGORY_OPTIONS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`org-cpg-material-card ${materialItem.category === item.id ? 'is-active' : ''}`}
                            onClick={() => setMaterialItem((prev) => ({ ...prev, category: item.id }))}
                            aria-pressed={materialItem.category === item.id}
                          >
                            <span className={`org-cpg-material-icon org-cpg-material-icon-${item.id}`} aria-hidden="true">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="org-cpg-material-form">
                      <label className="org-cpg-material-label">
                        Campaign Title
                        <input
                          type="text"
                          placeholder="e.g., School Supply Drive for Rural Students"
                          value={form.title}
                          onChange={handleChange('title')}
                        />
                      </label>
                      <label className="org-cpg-material-label">
                        Campaign Category
                        <select
                          value={form.category}
                          onChange={handleChange('category')}
                        >
                          <option value="">Select Category</option>
                          <option value="Education">Education</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Environment">Environment</option>
                          <option value="Community">Community</option>
                          <option value="Infrastructure">Infrastructure</option>
                        </select>
                      </label>
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
                      <label className="sm:col-span-2 text-sm font-semibold text-[#334155]">
                        Campaign Location
                        <div className="mt-2 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-start">
                          <div className="rounded-[26px] border border-[#E2E8F0] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-[#E8F0FF] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1D4ED8]">
                                Public location
                              </span>
                              <span className="inline-flex rounded-full bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold text-[#64748B]">
                                Shown to donors
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#475569]">
                              Use a place name donors immediately understand. Keep it short and recognizable.
                            </p>
                            <input
                              type="text"
                              placeholder="Address, commune, district, or landmark"
                              value={form.location}
                              onChange={handleChange('location')}
                              className="mt-4 h-12 w-full rounded-2xl border border-[#D7E3F4] bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                            />
                            <div className="mt-4 rounded-2xl border border-[#E5EDF8] bg-white px-4 py-3 text-sm text-[#475569]">
                              <span className="font-extrabold uppercase tracking-[0.14em] text-[#5F7595]">Tip</span>
                              <p className="mt-1 leading-6">
                                Example: <span className="font-semibold text-[#0F172A]">Prek Pnov, Phnom Penh</span> or a full street address when needed.
                              </p>
                            </div>
                          </div>
                          {renderCoordinateTracker({
                            title: 'Precise Map Pin',
                            description: 'Use GPS or enter latitude and longitude to place the campaign exactly on the map.',
                            mapTitle: 'Campaign location map preview',
                            emptyMessage: 'Add coordinates or use current location to preview the map.',
                            containerClassName: 'mt-0 overflow-hidden rounded-[26px] border border-[#DBE7F5] bg-[#F8FBFF] shadow-[0_10px_24px_rgba(15,23,42,0.04)]',
                            fieldsClassName: 'grid gap-3 sm:grid-cols-2',
                            statusLabel: hasPickupCoordinates ? 'Ready' : 'Pending',
                          })}
                        </div>
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
                        <div className="mt-2 grid gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="text"
                                placeholder="Warehouse address or pickup area"
                                value={form.location}
                                onChange={(event) => {
                                  setForm((prev) => ({ ...prev, location: event.target.value }));
                                  setLocationSearchResults([]);
                                  setLocationError('');
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    searchPickupLocation();
                                  }
                                }}
                                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                              />
                              <button
                                type="button"
                                onClick={searchPickupLocation}
                                disabled={locationSearchLoading}
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#BFD6FF] bg-white px-4 text-sm font-bold text-[#2563EB] transition hover:border-[#93C5FD] hover:text-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Search size={16} />
                                {locationSearchLoading ? 'Searching...' : 'Search'}
                              </button>
                            </div>
                            {locationSearchResults.length > 0 ? (
                              <div className="overflow-hidden rounded-2xl border border-[#D9E6F6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                                {locationSearchResults.map((result) => (
                                  <button
                                    type="button"
                                    key={`${result.place_id}-${result.lat}-${result.lon}`}
                                    onClick={() => applyLocationSelection(result)}
                                    className="flex w-full items-start justify-between gap-3 border-b border-[#EEF3F9] px-4 py-3 text-left transition hover:bg-[#F8FBFF] last:border-b-0"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-[#0F172A]">{result.display_name}</p>
                                      <p className="mt-1 text-xs text-[#64748B]">
                                        Lat {Number(result.lat).toFixed(5)}, Lng {Number(result.lon).toFixed(5)}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                                      Pick
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          {renderCoordinateTracker({
                            title: 'Map Coordinates',
                            description: 'Detect the pickup point and store its latitude and longitude with this campaign.',
                            mapTitle: 'Pickup location map preview',
                            emptyMessage: 'Add coordinates manually or use current location to preview the pickup point on the map.',
                          })}
                        </div>
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
                          <p className="mt-3 font-semibold text-[#0F172A]">Click to upload a cover image</p>
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
                        {imagePreviews.map((image, index) => (
                          <div className="overflow-hidden rounded-xl border border-[#E2E8F0]" key={image.id}>
                            <img src={image.src} alt={image.name} className="h-24 w-full object-cover" />
                            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[#475569]">
                              <span className="truncate font-medium">
                                {index === 0 ? `Cover: ${image.name}` : image.name}
                              </span>
                              {!image.isExisting ? (
                                <button
                                  type="button"
                                  className="font-semibold text-[#DC2626]"
                                  onClick={() => removeImagePreview(image.id)}
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {campaignType === 'materials' ? (
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
                  )}
                </>
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

                    {renderBudgetBreakdown('monetary')}
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

                    {renderBudgetBreakdown('hybrid')}
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
                      <div className="org-cpg-live-image">
                        {previewImage ? (
                          <img src={previewImage} alt={previewTitle} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-sm font-medium text-[#64748B]">
                            Upload a cover image to see the live campaign card.
                          </div>
                        )}
                      </div>
                      <div className="org-cpg-live-meta">
                        <span className="org-cpg-live-tag">{previewCategory}</span>
                        <h4>{previewTitle}</h4>
                        <p>{previewMetric}</p>
                      </div>
                    </div>
                  </section>

                  <section className="org-cpg-tips is-media">
                    <h4>Tips for Success</h4>
                    <ul>
                      {mediaTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="org-cpg-support">
                    <h4>Need a photographer?</h4>
                    <p>Our Chomnuoy partners can connect you with local volunteer photographers.</p>
                    <button type="button" onClick={handleRequestSupport} disabled={supportRequested}>
                      {supportRequested ? 'Support Requested' : 'Request Support'}
                    </button>
                    {supportRequested ? (
                      <p className="mt-3 text-xs font-semibold text-[#93C5FD]">
                        Request saved. Our team can follow up with photo support details.
                      </p>
                    ) : null}
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
                      <div className="org-cpg-live-image">
                        {previewImage ? (
                          <img src={previewImage} alt={previewTitle} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-sm font-medium text-[#64748B]">
                            Upload a cover image to preview the campaign card.
                          </div>
                        )}
                      </div>
                      <div className="org-cpg-live-meta">
                        <span className="org-cpg-live-tag">{previewCategory}</span>
                        <h4>{previewTitle}</h4>
                        <p>{previewMetric}</p>
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
                    <div className="org-cpg-live-image">
                      {previewImage ? (
                        <img src={previewImage} alt={previewTitle} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-sm font-medium text-[#64748B]">
                          Upload a cover image to display the real campaign card.
                        </div>
                      )}
                    </div>
                    <div className="org-cpg-live-meta">
                      <span className="org-cpg-live-tag">{previewCategory}</span>
                      <h4>{previewTitle}</h4>
                      <p>{reviewRaisedText}</p>
                    </div>
                  </div>
                  <label className="mt-4 flex items-start gap-2 text-xs text-[#64748B]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={reviewAccepted}
                      onChange={(event) => setReviewAccepted(event.target.checked)}
                    />
                    I agree to the Terms of Service and confirm that all information is accurate.
                  </label>
                  <button
                    type="button"
                    className="org-cpg-launch-btn"
                    onClick={() => handleSubmit('active')}
                    disabled={!reviewAccepted || submitting}
                  >
                    {submitting ? 'Publishing...' : (isEditing ? 'Update Campaign' : 'Launch Campaign')}
                  </button>
                  <button type="button" className="org-cpg-back-link" onClick={() => setActiveStep(4)}>
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
