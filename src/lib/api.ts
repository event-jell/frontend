import axios from 'axios';
import type { FloorPlan, PlacedElement, Event, Guest, Ticket, Vendor, Comm } from '../types';

const TOKEN_KEY = 'ej_token';

// VITE_API_URL:
//   - local dev  → leave blank; Vite proxy rewrites /api → http://localhost:3000
//   - docker/prod → set to full backend URL e.g. http://localhost:3000 or https://api.eventjelly.com
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || '';
const API_PREFIX = BASE_URL ? `${BASE_URL}/api` : '/api';

export const http = axios.create({ baseURL: API_PREFIX });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('ej_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: { id: string; firstName: string; lastName: string; email: string };
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
    },
  };
}

export const authApi = {
  register: ({ firstName, lastName, country, ...rest }: { firstName: string; lastName: string; email: string; password: string; country?: string }) =>
    http.post('/auth/register', { first_name: firstName, last_name: lastName, ...(country && { country }), ...rest }).then(r => normalizeAuth(r.data)),
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
    name: raw.name,
    description: raw.description,
    venue: raw.venue,
    date: raw.date,
    startTime: raw.start_time ?? raw.startTime,
    endTime: raw.end_time ?? raw.endTime,
    status: raw.status ?? 'draft',
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
  if (data.description !== undefined) out.description = data.description;
  if (data.venue !== undefined) out.venue = data.venue;
  if (data.date !== undefined) out.date = data.date;
  if (data.startTime !== undefined) out.start_time = data.startTime;
  if (data.endTime !== undefined) out.end_time = data.endTime;
  if (data.status !== undefined) out.status = data.status;
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
  list: () => http.get('/floor-plans').then(r => (r.data as unknown[]).map(normalizeFloorPlan)),
  listTemplates: () => http.get('/floor-plans/templates/all').then(r => (r.data as unknown[]).map(normalizeFloorPlan)),
  get: (id: string) => http.get(`/floor-plans/${id}`).then(r => normalizeFloorPlan(r.data)),
  create: (data: Partial<FloorPlan>) =>
    http.post('/floor-plans', denormalizeFloorPlan(data)).then(r => normalizeFloorPlan(r.data)),
  update: (id: string, data: Partial<FloorPlan>) =>
    http.put(`/floor-plans/${id}`, denormalizeFloorPlan(data)).then(r => normalizeFloorPlan(r.data)),
  delete: (id: string) => http.delete(`/floor-plans/${id}`),
  duplicate: (id: string) => http.post(`/floor-plans/${id}/duplicate`).then(r => normalizeFloorPlan(r.data)),
  saveElements: (id: string, elements: PlacedElement[]) =>
    http.put(`/floor-plans/${id}`, denormalizeFloorPlan({ elements })).then(r => normalizeFloorPlan(r.data)),
};

export const eventsApi = {
  list: () => http.get('/events').then(r => (r.data as unknown[]).map(normalizeEvent)),
  get: (id: string) => http.get(`/events/${id}`).then(r => normalizeEvent(r.data)),
  create: (data: Partial<Event>) =>
    http.post('/events', denormalizeEvent(data)).then(r => normalizeEvent(r.data)),
  update: (id: string, data: Partial<Event>) =>
    http.put(`/events/${id}`, denormalizeEvent(data)).then(r => normalizeEvent(r.data)),
  delete: (id: string) => http.delete(`/events/${id}`),
  addCollaborator: (id: string, email: string) =>
    http.post(`/events/${id}/collaborators`, { email }).then(r => normalizeEvent(r.data)),
  removeCollaborator: (id: string, userId: string) =>
    http.delete(`/events/${id}/collaborators/${userId}`).then(r => normalizeEvent(r.data)),
  getCollaborators: (id: string) =>
    http.get(`/events/${id}/collaborators`).then(r => r.data as { _id: string; first_name: string; last_name: string; email: string }[]),
};

export const guestsApi = {
  list: (eventId?: string) =>
    http.get('/guests', { params: eventId ? { eventId } : {} })
      .then(r => (r.data as unknown[]).map(normalizeGuest)),
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
      .then(r => (r.data as unknown[]).map(normalizeTicket)),
  get: (id: string) => http.get(`/tickets/${id}`).then(r => normalizeTicket(r.data)),
  create: (data: Partial<Ticket>) =>
    http.post('/tickets', denormalizeTicket(data)).then(r => normalizeTicket(r.data)),
  update: (id: string, data: Partial<Ticket>) =>
    http.put(`/tickets/${id}`, denormalizeTicket(data)).then(r => normalizeTicket(r.data)),
  delete: (id: string) => http.delete(`/tickets/${id}`),
};

export const vendorsApi = {
  list: (eventId?: string) =>
    http.get('/vendors', { params: eventId ? { eventId } : {} })
      .then(r => (r.data as unknown[]).map(normalizeVendor)),
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
      .then(r => (r.data as unknown[]).map(normalizeComm)),
  get: (id: string) => http.get(`/comms/${id}`).then(r => normalizeComm(r.data)),
  create: (data: Partial<Comm>) =>
    http.post('/comms', denormalizeComm(data)).then(r => normalizeComm(r.data)),
  update: (id: string, data: Partial<Comm>) =>
    http.put(`/comms/${id}`, denormalizeComm(data)).then(r => normalizeComm(r.data)),
  delete: (id: string) => http.delete(`/comms/${id}`),
};
