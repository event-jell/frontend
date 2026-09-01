import axios from 'axios';
import type { FloorPlan, PlacedElement, Event, Guest, Ticket, Vendor, Comm, Collaborator, CollaboratorPermissions } from '../types';

const TOKEN_KEY = 'ej_token';



const safeApiUrl = ((import.meta.env as any).VITE_API_URL || '').trim();
// Support both base host (https://example.com) and pre-suffixed (https://example.com/api)
const BASE_URL = safeApiUrl.replace(/\/$/, '') || '';
const API_PREFIX = BASE_URL
  ? (BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`)
  : '/api';

export const http = axios.create({ baseURL: API_PREFIX });

/**
 * Build an absolute URL to a backend endpoint for use *outside* the axios client
 * — e.g. `<img src>`, `<a href>`, or `fetch()` downloads. Mirrors the axios
 * `baseURL` so these resolve to `VITE_API_URL` in production instead of the
 * frontend origin (which nginx does not proxy to `/api`, producing broken
 * images / 404s). Pass a path WITHOUT the leading `/api` (e.g. `/events/123/qr-code`).
 */
export function apiUrl(path: string): string {
  return `${API_PREFIX}${path.startsWith('/') ? '' : '/'}${path}`;
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthUrl = error.config?.url?.includes('/auth/');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response?.status === 401 && !isAuthUrl && !isLoginPage) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('ej_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Parses any API or network error into a clean, human-friendly error message.
 */
export function getFriendlyErrorMessage(error: any, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback;

  // Network / Connection / Offline errors
  if (
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error' ||
    (error.name === 'AxiosError' && !error.response)
  ) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }

  // Request timeout
  if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  // Response status handling
  const status = error.response?.status;
  const data = error.response?.data;
  const msg = data?.message;

  if (status === 401) {
    if (msg === 'Invalid credentials' || error.config?.url?.includes('/auth/login')) {
      return 'Invalid email or password. Please check your credentials or create an account.';
    }
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return typeof msg === 'string' ? msg : "You don't have permission to perform this action.";
  }

  if (status === 404) {
    return typeof msg === 'string' ? msg : 'The requested item could not be found.';
  }

  if (status === 409) {
    return typeof msg === 'string' ? msg : 'A conflict occurred. This record may already exist.';
  }

  if (status && status >= 500) {
    return 'A server error occurred. Please try again in a few moments.';
  }

  if (msg) {
    const raw = Array.isArray(msg) ? msg.join(', ') : String(msg);
    return raw;
  }

  if (typeof error.message === 'string' && error.message.trim() && error.message !== 'AxiosError') {
    return error.message;
  }

  return fallback;
}

// ─── Guest Passes Portal (magic-link auth, separate session) ──────────────────

const GUEST_TOKEN_KEY = 'ej_guest_token';

/**
 * Dedicated client for the guest passes portal. Uses its own session token and
 * intentionally has NO 401→/login redirect (guests aren't organizers).
 */
const guestHttp = axios.create({ baseURL: API_PREFIX });
guestHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface GuestPass {
  guestId: string;
  eventId: string;
  eventSlug?: string;
  eventName: string;
  venue?: string;
  date?: string;
  startTime?: string;
  coverImage?: string;
  ticketName?: string | null;
  rsvpStatus: string;
  checkedIn: boolean;
  token: string;
  passUrl: string;
}

export const guestPortalApi = {
  /** Ask for an emailed magic link (always resolves; no account enumeration). */
  requestLink: (email: string) =>
    guestHttp.post<{ ok: boolean }>('/guest-portal/request-link', { email }).then((r) => r.data),
  /** Exchange a magic-link token for a guest session token. */
  verify: (token: string) =>
    guestHttp
      .post<{ token: string; email: string; name?: string }>('/guest-portal/verify', { token })
      .then((r) => r.data),
  /** Fetch all passes for the authenticated guest. */
  getPasses: () =>
    guestHttp
      .get<{ email: string; passes: GuestPass[] }>('/guest-portal/passes')
      .then((r) => r.data),
  getToken: () => localStorage.getItem(GUEST_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(GUEST_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(GUEST_TOKEN_KEY),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    country?: string;
    organizationName?: string;
    organizationSize?: string;
    creatorRole?: string;
    primaryEventType?: string;
    plan?: string;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: string;
  };
  token: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuth(raw: any): AuthResponse {
  return {
    token: raw.token,
    user: {
      id: raw.user.id,
      firstName: raw.user.first_name ?? raw.user.firstName ?? '',
      lastName: raw.user.last_name ?? raw.user.lastName ?? '',
      email: raw.user.email,
      country: raw.user.country,
      organizationName: raw.user.organization_name ?? raw.user.organizationName,
      organizationSize: raw.user.organization_size ?? raw.user.organizationSize,
      creatorRole: raw.user.creator_role ?? raw.user.creatorRole,
      primaryEventType: raw.user.primary_event_type ?? raw.user.primaryEventType,
      plan: raw.user.plan,
      subscriptionStatus: raw.user.subscription_status ?? raw.user.subscriptionStatus,
      subscriptionExpiresAt: raw.user.subscription_expires_at ?? raw.user.subscriptionExpiresAt,
    },
  };
}

export const authApi = {
  // Registration now sends an OTP to the user's email instead of logging them
  // in directly — it returns a plain status message, not a session.
  register: ({
    firstName,
    lastName,
    country,
    organizationName,
    organizationSize,
    creatorRole,
    primaryEventType,
    ...rest
  }: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country?: string;
    organizationName?: string;
    organizationSize?: string;
    creatorRole?: string;
    primaryEventType?: string;
  }) =>
    http.post<{ message: string }>('/auth/register', {
      first_name: firstName,
      last_name: lastName,
      ...(country && { country }),
      ...(organizationName && { organization_name: organizationName }),
      ...(organizationSize && { organization_size: organizationSize }),
      ...(creatorRole && { creator_role: creatorRole }),
      ...(primaryEventType && { primary_event_type: primaryEventType }),
      ...rest,
    }).then(r => r.data),
  checkEmail: (email: string) =>
    http.post<{ inUse: boolean }>('/auth/check-email', { email }).then(r => r.data),
  verifyEmail: (data: { email: string; otp: string }) =>
    http.post('/auth/verify-email', data).then(r => normalizeAuth(r.data)),
  login: (data: { email: string; password: string }) =>
    http.post('/auth/login', data).then(r => normalizeAuth(r.data)),
  forgotPassword: (data: { email: string }) =>
    http.post<ForgotPasswordResponse>('/auth/forgot-password', data).then(r => r.data),
  resetPassword: (data: { token: string; password: string }) =>
    http.post<{ message: string }>('/auth/reset-password', data).then(r => r.data),
};

// ─── Normalizers: backend snake_case → frontend camelCase ─────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeElement(e: any): PlacedElement {
  return {
    id: e.id,
    type: e.type,
    label: e.label,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    rotation: e.rotation ?? 0,
    color: e.color,
    shape: e.shape,
    zIndex: e.z_index ?? e.zIndex ?? 0,
    capacity: e.capacity ?? 0,
    seated: e.seated ?? 0,
    notes: e.notes ?? '',
    properties: e.properties ?? {},
    locked: e.locked,
    opacity: e.opacity,
    seatAssignments: (e.seat_assignments ?? e.seatAssignments ?? []).map((sa: any) => ({
      seatIndex: sa.seat_index ?? sa.seatIndex,
      type: sa.type,
      id: sa.assignee_id ?? sa.id,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFloorPlan(raw: any): FloorPlan {
  return {
    _id: raw._id,
    name: raw.name,
    description: raw.description ?? '',
    eventId: raw.event_id ?? raw.eventId,
    canvasWidth: raw.canvas_width ?? raw.canvasWidth ?? 1200,
    canvasHeight: raw.canvas_height ?? raw.canvasHeight ?? 800,
    gridSize: raw.grid_size ?? raw.gridSize ?? 20,
    elements: (raw.elements ?? []).map(normalizeElement),
    rooms: (raw.rooms ?? []).map((r: any) => ({
      ...r,
      elements: (r.elements ?? []).map(normalizeElement),
    })),
    thumbnail: raw.thumbnail,
    status: raw.status ?? 'draft',
    isTemplate: raw.is_template,
    isPublic: raw.is_public,
    ownerId: raw.owner_id,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvent(raw: any): Event {
  return {
    _id: raw._id,
    slug: raw.slug ?? '',
    name: raw.name,
    description: raw.description,
    venue: raw.venue,
    date: raw.date,
    startTime: raw.start_time ?? raw.startTime,
    endTime: raw.end_time ?? raw.endTime,
    isVirtual: raw.is_virtual ?? raw.isVirtual ?? false,
    virtualLink: raw.virtual_link ?? raw.virtualLink ?? '',
    dates: (raw.dates ?? []).map((d: any) => ({
      date: d.date,
      startTime: d.start_time ?? d.startTime ?? '',
      endTime: d.end_time ?? d.endTime ?? '',
    })),
    status: raw.status ?? 'draft',
    type: raw.type ?? 'other',
    guestCount: raw.guest_count ?? raw.guestCount ?? 0,
    guestRsvp: raw.guest_rsvp ?? raw.guestRsvp ?? 0,
    ticketsSold: raw.tickets_sold ?? raw.ticketsSold ?? 0,
    ticketsTotal: raw.tickets_total ?? raw.ticketsTotal ?? 0,
    seatedCount: raw.seated_count ?? raw.seatedCount ?? 0,
    seatedTotal: raw.seated_total ?? raw.seatedTotal ?? 0,
    vendorCount: raw.vendor_count ?? raw.vendorCount ?? 0,
    commCount: raw.comm_count ?? raw.commCount ?? 0,
    floorPlanId: raw.floor_plan_id ?? raw.floorPlanId,
    coverImage: raw.cover_image ?? raw.coverImage,
    allowGuestSeatSelection: raw.allow_guest_seat_selection ?? raw.allowGuestSeatSelection ?? false,
    rsvpFields: raw.rsvp_fields ?? raw.rsvpFields ?? [],
    rsvpDisabled: raw.rsvp_disabled ?? raw.rsvpDisabled ?? false,
    qrScans: raw.qr_scans ?? raw.qrScans ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    owner_id: raw.owner_id,
    collaborators: raw.collaborators ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGuest(raw: any): Guest {
  return {
    _id: raw._id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    eventId: raw.event_id ?? raw.eventId,
    rsvpStatus: raw.rsvp_status ?? raw.rsvpStatus ?? 'pending',
    tableAssignment: raw.table_assignment ?? raw.tableAssignment,
    dietaryReqs: raw.dietary_reqs ?? raw.dietaryReqs,
    checkedIn: raw.checked_in ?? raw.checkedIn ?? false,
    notes: raw.notes,
    group: raw.group,
    plusOnes: raw.plus_ones ?? raw.plusOnes ?? 0,
    ticketId: raw.ticket_id ?? raw.ticketId,
    customFields: raw.custom_fields ?? raw.customFields,
    dateResponded: raw.date_responded ?? raw.dateResponded,
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTicket(raw: any): Ticket {
  return {
    _id: raw._id,
    eventId: raw.event_id ?? raw.eventId ?? '',
    name: raw.name,
    description: raw.description,
    price: raw.price ?? 0,
    total: raw.total ?? 0,
    sold: raw.sold ?? 0,
    status: raw.status ?? 'active',
    saleStart: raw.sale_start ?? raw.saleStart,
    saleEnd: raw.sale_end ?? raw.saleEnd,
    qrScans: raw.qr_scans ?? raw.qrScans ?? 0,
    rsvpDisabled: raw.rsvp_disabled ?? raw.rsvpDisabled ?? false,
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVendor(raw: any): Vendor {
  return {
    _id: raw._id,
    name: raw.name,
    eventId: raw.event_id ?? raw.eventId,
    category: raw.category ?? '',
    contactName: raw.contact_name ?? raw.contactName,
    email: raw.email,
    phone: raw.phone,
    contractValue: raw.contract_value ?? raw.contractValue ?? 0,
    status: raw.status ?? 'pending',
    notes: raw.notes,
    paid: raw.paid ?? false,
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeComm(raw: any): Comm {
  return {
    _id: raw._id,
    eventId: raw.event_id ?? raw.eventId ?? '',
    subject: raw.subject,
    body: raw.body,
    channel: raw.channel ?? 'email',
    status: raw.status ?? 'draft',
    scheduledAt: raw.scheduled_at ?? raw.scheduledAt,
    sentAt: raw.sent_at ?? raw.sentAt,
    recipientCount: raw.recipient_count ?? raw.recipientCount ?? 0,
    audience: raw.audience ?? 'all',
    createdAt: raw.createdAt,
  };
}

// ─── Denormalizers: frontend camelCase → backend snake_case ───────────────────

function denormalizeFloorPlan(data: Partial<FloorPlan>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.description !== undefined) out.description = data.description;
  if (data.eventId !== undefined) out.event_id = data.eventId;
  if (data.canvasWidth !== undefined) out.canvas_width = data.canvasWidth;
  if (data.canvasHeight !== undefined) out.canvas_height = data.canvasHeight;
  if (data.gridSize !== undefined) out.grid_size = data.gridSize;
  if (data.thumbnail !== undefined) out.thumbnail = data.thumbnail;
  if (data.status !== undefined) out.status = data.status;
  if (data.isTemplate !== undefined) out.is_template = data.isTemplate;
  if (data.isPublic !== undefined) out.is_public = data.isPublic;
  if (data.elements !== undefined) {
    out.elements = data.elements.map(e => ({
      ...e,
      z_index: e.zIndex,
      zIndex: undefined,
      seat_assignments: e.seatAssignments?.map(sa => ({
        seat_index: sa.seatIndex,
        type: sa.type,
        assignee_id: sa.id,
      })),
      seatAssignments: undefined,
    }));
  }
  if (data.rooms !== undefined) {
    out.rooms = data.rooms.map(r => ({
      ...r,
      elements: r.elements?.map((e: any) => ({
        ...e,
        z_index: e.zIndex,
        zIndex: undefined,
        seat_assignments: e.seatAssignments?.map((sa: any) => ({
          seat_index: sa.seatIndex ?? sa.seat_index,
          type: sa.type,
          assignee_id: sa.id ?? sa.assignee_id,
        })),
        seatAssignments: undefined,
      })),
    }));
  }
  return out;
}

function denormalizeEvent(data: Partial<Event>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;
  if (data.venue !== undefined) out.venue = data.venue;
  if (data.date) out.date = data.date;
  if (data.startTime !== undefined) out.start_time = data.startTime;
  if (data.endTime !== undefined) out.end_time = data.endTime;
  if (data.isVirtual !== undefined) out.is_virtual = data.isVirtual;
  if (data.virtualLink !== undefined) out.virtual_link = data.virtualLink;
  if (data.dates !== undefined) {
    out.dates = data.dates.map((d: any) => ({
      date: d.date,
      start_time: d.startTime,
      end_time: d.endTime,
    }));
  }
  if (data.status !== undefined) out.status = data.status;
  if (data.type !== undefined) out.type = data.type;
  if (data.guestCount !== undefined) out.guest_count = data.guestCount;
  if (data.guestRsvp !== undefined) out.guest_rsvp = data.guestRsvp;
  if (data.ticketsSold !== undefined) out.tickets_sold = data.ticketsSold;
  if (data.ticketsTotal !== undefined) out.tickets_total = data.ticketsTotal;
  if (data.seatedCount !== undefined) out.seated_count = data.seatedCount;
  if (data.seatedTotal !== undefined) out.seated_total = data.seatedTotal;
  if (data.vendorCount !== undefined) out.vendor_count = data.vendorCount;
  if (data.commCount !== undefined) out.comm_count = data.commCount;
  if (data.floorPlanId !== undefined) out.floor_plan_id = data.floorPlanId;
  if (data.coverImage !== undefined) out.cover_image = data.coverImage;
  if (data.allowGuestSeatSelection !== undefined) out.allow_guest_seat_selection = data.allowGuestSeatSelection;
  if (data.rsvpFields !== undefined) out.rsvp_fields = data.rsvpFields;
  if (data.rsvpDisabled !== undefined) out.rsvp_disabled = data.rsvpDisabled;
  if (data.qrScans !== undefined) out.qr_scans = data.qrScans;
  return out;
}

function denormalizeGuest(data: Partial<Guest>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.email !== undefined) out.email = data.email;
  if (data.phone !== undefined) out.phone = data.phone;
  if (data.eventId !== undefined) out.event_id = data.eventId;
  if (data.rsvpStatus !== undefined) out.rsvp_status = data.rsvpStatus;
  if (data.tableAssignment !== undefined) out.table_assignment = data.tableAssignment;
  if (data.dietaryReqs !== undefined) out.dietary_reqs = data.dietaryReqs;
  if (data.checkedIn !== undefined) out.checked_in = data.checkedIn;
  if (data.notes !== undefined) out.notes = data.notes;
  if (data.group !== undefined) out.group = data.group;
  if (data.plusOnes !== undefined) out.plus_ones = data.plusOnes;
  if (data.ticketId !== undefined) out.ticket_id = data.ticketId;
  if (data.customFields !== undefined) out.custom_fields = data.customFields;
  if (data.dateResponded !== undefined) out.date_responded = data.dateResponded;
  return out;
}

function denormalizeTicket(data: Partial<Ticket>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.eventId !== undefined) out.event_id = data.eventId;
  if (data.name !== undefined) out.name = data.name;
  if (data.description !== undefined) out.description = data.description;
  if (data.price !== undefined) out.price = data.price;
  if (data.total !== undefined) out.total = data.total;
  if (data.sold !== undefined) out.sold = data.sold;
  if (data.status !== undefined) out.status = data.status;
  if (data.saleStart !== undefined) out.sale_start = data.saleStart;
  if (data.saleEnd !== undefined) out.sale_end = data.saleEnd;
  if (data.qrScans !== undefined) out.qr_scans = data.qrScans;
  if (data.rsvpDisabled !== undefined) out.rsvp_disabled = data.rsvpDisabled;
  return out;
}

function denormalizeVendor(data: Partial<Vendor>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.eventId !== undefined) out.event_id = data.eventId;
  if (data.category !== undefined) out.category = data.category;
  if (data.contactName !== undefined) out.contact_name = data.contactName;
  if (data.email !== undefined) out.email = data.email;
  if (data.phone !== undefined) out.phone = data.phone;
  if (data.contractValue !== undefined) out.contract_value = data.contractValue;
  if (data.status !== undefined) out.status = data.status;
  if (data.notes !== undefined) out.notes = data.notes;
  if (data.paid !== undefined) out.paid = data.paid;
  return out;
}

function denormalizeComm(data: Partial<Comm>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.eventId !== undefined) out.event_id = data.eventId;
  if (data.subject !== undefined) out.subject = data.subject;
  if (data.body !== undefined) out.body = data.body;
  if (data.channel !== undefined) out.channel = data.channel;
  if (data.status !== undefined) out.status = data.status;
  if (data.scheduledAt !== undefined) out.scheduled_at = data.scheduledAt;
  if (data.sentAt !== undefined) out.sent_at = data.sentAt;
  if (data.recipientCount !== undefined) out.recipient_count = data.recipientCount;
  if (data.audience !== undefined) out.audience = data.audience;
  return out;
}

// ─── API clients ──────────────────────────────────────────────────────────────

export const floorPlansApi = {
  listTemplates: () => http.get('/floor-plans/templates/all').then(r => (r.data as unknown[]).map(normalizeFloorPlan)),
  get: (id: string) => http.get(`/floor-plans/${id}`).then(r => normalizeFloorPlan(r.data)),
  create: (data: Partial<FloorPlan>) =>
    http.post('/floor-plans', denormalizeFloorPlan(data)).then(r => normalizeFloorPlan(r.data)),
  update: (id: string, data: Partial<FloorPlan>) =>
    http.put(`/floor-plans/${id}`, denormalizeFloorPlan(data)).then(r => normalizeFloorPlan(r.data)),
};

export const usersApi = {
  getProfile: () =>
    http.get('/users/me').then(r => ({
      id: r.data.id,
      firstName: r.data.first_name,
      lastName: r.data.last_name,
      email: r.data.email,
      country: r.data.country,
      organizationName: r.data.organization_name,
      organizationSize: r.data.organization_size,
      creatorRole: r.data.creator_role,
      primaryEventType: r.data.primary_event_type,
    })),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    country?: string;
    organizationName?: string;
    organizationSize?: string;
    creatorRole?: string;
    primaryEventType?: string;
  }) =>
    http.patch('/users/me', {
      ...(data.firstName !== undefined && { first_name: data.firstName }),
      ...(data.lastName !== undefined && { last_name: data.lastName }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.organizationName !== undefined && { organization_name: data.organizationName }),
      ...(data.organizationSize !== undefined && { organization_size: data.organizationSize }),
      ...(data.creatorRole !== undefined && { creator_role: data.creatorRole }),
      ...(data.primaryEventType !== undefined && { primary_event_type: data.primaryEventType }),
    }).then(r => ({
      id: r.data.id,
      firstName: r.data.first_name,
      lastName: r.data.last_name,
      email: r.data.email,
      country: r.data.country,
      organizationName: r.data.organization_name,
      organizationSize: r.data.organization_size,
      creatorRole: r.data.creator_role,
      primaryEventType: r.data.primary_event_type,
    })),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    http.patch<{ message: string }>('/users/me/password', data).then(r => r.data),
};

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },
};

export const eventsApi = {
  list: () => http.get('/events').then(r => (r.data as unknown[]).map(normalizeEvent)),
  get: (id: string) => http.get(`/events/${id}`).then(r => normalizeEvent(r.data)),
  /** Public endpoint — no auth token needed; used by the RSVP invite page */
  publicGet: (id: string) => http.get(`/events/${id}/public`).then(r => normalizeEvent(r.data)),
  create: (data: Partial<Event>) =>
    http.post('/events', denormalizeEvent(data)).then(r => normalizeEvent(r.data)),
  update: (id: string, data: Partial<Event>) =>
    http.put(`/events/${id}`, denormalizeEvent(data)).then(r => normalizeEvent(r.data)),
  delete: (id: string) => http.delete(`/events/${id}`),
  addCollaborator: (id: string, email: string, role: string = 'editor', permissions?: Partial<CollaboratorPermissions>) =>
    http.post(`/events/${id}/collaborators`, { email, role, permissions }).then(r => normalizeEvent(r.data)),
  updateCollaboratorRole: (id: string, userId: string, role: string) =>
    http.patch(`/events/${id}/collaborators/${userId}`, { role }).then(r => normalizeEvent(r.data)),
  updateCollaboratorPermissions: (id: string, userId: string, role?: string, permissions?: Partial<CollaboratorPermissions>) =>
    http.patch(`/events/${id}/collaborators/${userId}/permissions`, { role, permissions }).then(r => normalizeEvent(r.data)),
  removeCollaborator: (id: string, userId: string) =>
    http.delete(`/events/${id}/collaborators/${userId}`).then(r => normalizeEvent(r.data)),
  getCollaborators: (id: string) =>
    http.get(`/events/${id}/collaborators`).then(r => r.data as Collaborator[]),
};

export interface InvitationDetails {
  id: string;
  eventId: string;
  eventName: string;
  inviterName: string;
  email: string;
  role: string;
  permissions?: CollaboratorPermissions;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
}

export interface RecentContact {
  email: string;
  name?: string;
  role?: string;
}

export const invitationsApi = {
  getDetails: (token: string) =>
    http.get(`/invitations/details/${token}`).then(r => r.data as InvitationDetails),
  accept: (token: string) =>
    http.post(`/invitations/accept/${token}`).then(r => r.data as { message: string }),
  decline: (token: string) =>
    http.post(`/invitations/decline/${token}`).then(r => r.data as { message: string }),
  getPendingForEvent: (eventId: string) =>
    http.get(`/invitations/event/${eventId}`).then(r => r.data as InvitationDetails[]),
  getRecentContacts: () =>
    http.get('/invitations/recent-contacts').then(r => r.data as RecentContact[]),
};

export const guestsApi = {
  list: (eventId?: string) =>
    http.get('/guests', { params: eventId ? { eventId } : {} })
      .then(r => (Array.isArray(r.data) ? (r.data as unknown[]).map(normalizeGuest) : [])),
  get: (id: string) => http.get(`/guests/${id}`).then(r => normalizeGuest(r.data)),
  create: (data: Partial<Guest>) =>
    http.post('/guests', denormalizeGuest(data)).then(r => normalizeGuest(r.data)),
  update: (id: string, data: Partial<Guest>) =>
    http.put(`/guests/${id}`, denormalizeGuest(data)).then(r => normalizeGuest(r.data)),
  delete: (id: string) => http.delete(`/guests/${id}`),
  bulkCreate: (eventId: string, guests: Partial<Guest>[]) =>
    http.post(`/guests/bulk/${eventId}`, { guests: guests.map(denormalizeGuest) })
      .then(r => r.data as { inserted: number }),
};

export const ticketsApi = {
  list: (eventId?: string) =>
    http.get('/tickets', { params: eventId ? { eventId } : {} })
      .then(r => (Array.isArray(r.data) ? (r.data as unknown[]).map(normalizeTicket) : [])),
  get: (id: string) => http.get(`/tickets/${id}`).then(r => normalizeTicket(r.data)),
  create: (data: Partial<Ticket>) =>
    http.post('/tickets', denormalizeTicket(data)).then(r => normalizeTicket(r.data)),
  update: (id: string, data: Partial<Ticket>) =>
    http.put(`/tickets/${id}`, denormalizeTicket(data)).then(r => normalizeTicket(r.data)),
  delete: (id: string) => http.delete(`/tickets/${id}`),
  exportEmail: (ticketId: string, data: { email: string; csvContent: string; ticketName: string }) =>
    http.post(`/tickets/${ticketId}/export-email`, data).then(r => r.data),
};

export const vendorsApi = {
  list: (eventId?: string) =>
    http.get('/vendors', { params: eventId ? { eventId } : {} })
      .then(r => (Array.isArray(r.data) ? (r.data as unknown[]).map(normalizeVendor) : [])),
  get: (id: string) => http.get(`/vendors/${id}`).then(r => normalizeVendor(r.data)),
  create: (data: Partial<Vendor>) =>
    http.post('/vendors', denormalizeVendor(data)).then(r => normalizeVendor(r.data)),
  update: (id: string, data: Partial<Vendor>) =>
    http.put(`/vendors/${id}`, denormalizeVendor(data)).then(r => normalizeVendor(r.data)),
  delete: (id: string) => http.delete(`/vendors/${id}`),
};

export const commsApi = {
  list: (eventId?: string) =>
    http.get('/comms', { params: eventId ? { eventId } : {} })
      .then(r => (Array.isArray(r.data) ? (r.data as unknown[]).map(normalizeComm) : [])),
  get: (id: string) => http.get(`/comms/${id}`).then(r => normalizeComm(r.data)),
  create: (data: Partial<Comm>) =>
    http.post('/comms', denormalizeComm(data)).then(r => normalizeComm(r.data)),
  update: (id: string, data: Partial<Comm>) =>
    http.put(`/comms/${id}`, denormalizeComm(data)).then(r => normalizeComm(r.data)),
  delete: (id: string) => http.delete(`/comms/${id}`),
};

// ─── Payments & Subscriptions ──────────────────────────────────────────────────

export interface PaymentRecord {
  _id: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  payment_type: 'ticket_purchase' | 'platform_subscription' | 'platform_fee';
  user_id?: string;
  event_id?: string;
  guest_id?: string;
  ticket_id?: string;
  customer_email: string;
  customer_name?: string;
  paystack_transaction_id?: string;
  channel?: string;
  plan?: string;
  paid_at?: string;
  createdAt: string;
}

export const paymentsApi = {
  getConfig: () =>
    http.get<{ publicKey: string }>('/payments/config').then(r => r.data),
  initialize: (data: {
    email: string;
    amount: number;
    currency?: string;
    payment_type: 'ticket_purchase' | 'platform_subscription' | 'platform_fee';
    event_id?: string;
    ticket_id?: string;
    guest_id?: string;
    customer_name?: string;
    plan?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }) =>
    http.post<{
      authorization_url: string;
      access_code: string;
      reference: string;
      publicKey: string;
    }>('/payments/initialize', data).then(r => r.data),
  verify: (reference: string) =>
    http.get<{
      success: boolean;
      message: string;
      status: string;
      payment: PaymentRecord;
      transaction?: any;
    }>(`/payments/verify/${encodeURIComponent(reference)}`).then(r => r.data),
  getUserHistory: () =>
    http.get<PaymentRecord[]>('/payments/user/history').then(r => r.data),
  getEventHistory: (eventId: string) =>
    http.get<PaymentRecord[]>(`/payments/event/${eventId}`).then(r => r.data),
  getExchangeRates: () =>
    http.get<Record<string, number>>('/payments/exchange-rates').then(r => r.data),
  capturePayPal: (data: {
    orderId: string;
    reference: string;
    amount: number;
    currency: string;
    payment_type: 'ticket_purchase' | 'platform_subscription' | 'platform_fee';
    event_id?: string;
    ticket_id?: string;
    guest_id?: string;
    customer_email: string;
    customer_name?: string;
    plan?: string;
    metadata?: Record<string, any>;
  }) =>
    http.post<{
      success: boolean;
      message: string;
      payment: PaymentRecord;
    }>('/payments/paypal/capture', data).then(r => r.data),
};

// ─── Check-In & Scanner API ───────────────────────────────────────────────────

export const checkInApi = {
  validateScan: (data: {
    eventId: string;
    token: string;
    deviceId?: string;
    method?: 'qr' | 'manual' | 'nfc';
  }) =>
    http.post<import('../types').CheckInValidateResponse>('/check-in/validate', data).then(r => r.data),

  confirmCheckIn: (data: {
    eventId: string;
    guestId: string;
    token?: string;
    deviceId?: string;
    method?: 'qr' | 'manual' | 'nfc';
  }) =>
    http.post<import('../types').CheckInConfirmResponse>('/check-in/confirm', data).then(r => r.data),

  manualLookup: (eventId: string, query: string) =>
    http.post<import('../types').CheckInGuest[]>('/check-in/manual-lookup', { eventId, query }).then(r => r.data),

  undoCheckIn: (eventId: string, guestId: string) =>
    http.post<{ success: boolean; message: string; guest?: import('../types').CheckInGuest }>('/check-in/undo', {
      eventId,
      guestId,
    }).then(r => r.data),

  getStats: (eventId: string) =>
    http.get<import('../types').CheckInStats>(`/check-in/stats/${eventId}`).then(r => r.data),

  getLogs: (eventId: string, params?: { result?: string; page?: number; limit?: number }) =>
    http.get<{ logs: import('../types').CheckInAuditLog[]; total: number; page: number; totalPages: number }>(
      `/check-in/logs/${eventId}`,
      { params },
    ).then(r => r.data),

  getGuestPass: (eventId: string, guestId: string) =>
    http.get<import('../types').GuestPassData>(`/check-in/pass/${eventId}/${guestId}`).then(r => r.data),
};

// ─── Wallet & Financial API ──────────────────────────────────────────────────

export const walletApi = {
  getWallet: () =>
    http.get<import('../types').Wallet>('/wallet').then(r => r.data),

  getStats: () =>
    http.get<import('../types').WalletStats>('/wallet/stats').then(r => r.data),

  getTransactions: (params?: { page?: number; limit?: number; type?: string; direction?: string }) =>
    http.get<{ transactions: import('../types').WalletTransaction[]; total: number; page: number }>(
      '/wallet/transactions',
      { params },
    ).then(r => r.data),

  setPin: (data: { pin: string; current_pin?: string; password?: string }) =>
    http.post<{ success: boolean; message: string }>('/wallet/pin/set', data).then(r => r.data),

  verifyPin: (pin: string) =>
    http.post<{ success: boolean; verified: boolean }>('/wallet/pin/verify', { pin }).then(r => r.data),

  withdraw: (data: {
    amount: number;
    pin: string;
    payout_method: string;
    payout_details: {
      bank_name?: string;
      account_number?: string;
      account_name?: string;
      bank_code?: string;
      paypal_email?: string;
    };
    currency?: string;
  }) =>
    http.post<{ success: boolean; message: string; wallet: import('../types').Wallet }>('/wallet/withdraw', data).then(r => r.data),

  deposit: (data: { amount: number; currency?: string; reference?: string; payment_method?: string }) =>
    http.post<{ success: boolean; message: string; wallet: import('../types').Wallet }>('/wallet/deposit', data).then(r => r.data),

  savePayoutAccount: (data: {
    type: 'bank_transfer' | 'paypal' | 'paystack';
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    bank_code?: string;
    paypal_email?: string;
    is_default?: boolean;
  }) =>
    http.post<{ success: boolean; message: string; account: import('../types').PayoutAccount; wallet: import('../types').Wallet }>(
      '/wallet/payout-accounts',
      data,
    ).then(r => r.data),

  deletePayoutAccount: (id: string) =>
    http.delete<{ success: boolean; message: string; wallet: import('../types').Wallet }>(`/wallet/payout-accounts/${id}`).then(r => r.data),
};

// ─── Vendor Marketplace & Listings API ───────────────────────────────────────

export const vendorListingsApi = {
  getCategories: () =>
    http.get<import('../types').VendorCategoryInfo[]>('/vendor-listings/categories').then(r => r.data),

  getMyListings: () =>
    http.get<import('../types').VendorListingsResponse>('/vendor-listings/my-listings').then(r => r.data),

  getOne: (id: string) =>
    http.get<import('../types').VendorListing>(`/vendor-listings/${id}`).then(r => r.data),

  create: (data: Partial<import('../types').VendorListing>) =>
    http.post<import('../types').VendorListing>('/vendor-listings', data).then(r => r.data),

  update: (id: string, data: Partial<import('../types').VendorListing>) =>
    http.put<import('../types').VendorListing>(`/vendor-listings/${id}`, data).then(r => r.data),

  updateStatus: (id: string, status: 'published' | 'draft' | 'paused') =>
    http.patch<import('../types').VendorListing>(`/vendor-listings/${id}/status`, { status }).then(r => r.data),

  remove: (id: string) =>
    http.delete<{ success: boolean; message: string }>(`/vendor-listings/${id}`).then(r => r.data),

  explore: (params?: { category?: string; search?: string; location?: string; page?: number; limit?: number }) =>
    http.get<{ listings: import('../types').VendorListing[]; total: number; page: number }>(
      '/vendor-listings/explore',
      { params },
    ).then(r => r.data),
};

// ─── Dashboard Aggregator API ────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: () =>
    http.get<import('../types').DashboardSummary>('/dashboard/summary').then(r => r.data),
};




// ─── Messages & Real-time Chat API ──────────────────────────────────────────

export const messagesApi = {
  getConversations: () =>
    http.get<import('../types').ConversationItem[]>('/messages/conversations').then((r) => r.data),

  getMessagesByConversation: (conversationId: string, limit = 50) =>
    http
      .get<import('../types').ChatMessage[]>(`/messages/conversation/${conversationId}`, {
        params: { limit },
      })
      .then((r) => r.data),

  getMessagesWithUser: (otherUserId: string, limit = 50) =>
    http
      .get<import('../types').ChatMessage[]>(`/messages/with/${otherUserId}`, {
        params: { limit },
      })
      .then((r) => r.data),

  sendMessage: (data: {
    recipient_id: string;
    content: string;
    vendor_listing_id?: string;
    event_id?: string;
    message_type?: 'text' | 'offer' | 'invoice';
    offer_amount?: number;
    invoice_amount?: number;
    invoice_currency?: string;
    invoice_description?: string;
  }) => http.post<import('../types').ChatMessage>('/messages', data).then((r) => r.data),

  markAsRead: (conversationId: string) =>
    http.patch<{ success: boolean }>(`/messages/conversation/${conversationId}/read`).then((r) => r.data),

  payInvoiceWithWallet: (messageId: string) =>
    http.post<import('../types').ChatMessage>(`/messages/invoice/${messageId}/pay-wallet`).then((r) => r.data),
};
