export type ElementType =
  | 'stage'
  | 'head_table'
  | 'table_round'
  | 'table_banquet'
  | 'table_square'
  | 'table_cocktail'
  | 'dance_floor'
  | 'chair'
  | 'riser'
  | 'podium'
  | 'exit'
  | 'security'
  | 'bar'
  | 'buffet'
  | 'speaker'
  | 'projector'
  | 'custom';

export type ShapeType = 'rect' | 'circle' | 'polygon';
export type ElementCategory = 'tables' | 'stage_seating' | 'safety_service' | 'av_tech';

export interface SeatAssignment {
  seatIndex: number;
  type: 'guest' | 'ticket';
  id: string; // guestId or ticketId
}

export interface PlacedElement {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  shape: ShapeType;
  zIndex: number;
  capacity: number;
  seated: number;
  notes: string;
  properties: Record<string, unknown>;
  locked?: boolean;
  opacity?: number;
  seatAssignments?: SeatAssignment[];
}

export interface Room {
  id: string;
  name: string;
  width?: number;
  height?: number;
  elements: PlacedElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface FloorPlan {
  _id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  elements: PlacedElement[];
  rooms: Room[];
  thumbnail?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

export interface ElementTemplate {
  type: ElementType;
  category: ElementCategory;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultColor: string;
  shape: ShapeType;
  defaultCapacity: number;
}

export interface Event {
  _id: string;
  name: string;
  description?: string;
  venue: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'draft' | 'planning' | 'confirmed' | 'live';
  guestCount: number;
  guestRsvp: number;
  ticketsSold: number;
  ticketsTotal: number;
  seatedCount: number;
  seatedTotal: number;
  vendorCount: number;
  commCount: number;
  floorPlanId?: string;
  coverImage?: string;
  allowGuestSeatSelection?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner_id?: string;
  collaborators?: string[];
}

export interface Guest {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  eventId?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined' | 'maybe';
  tableAssignment?: string;
  dietaryReqs?: string;
  checkedIn: boolean;
  notes?: string;
  group?: string;
  plusOnes: number;
  ticketId?: string;
  createdAt?: string;
}

export interface Ticket {
  _id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  total: number;
  sold: number;
  status: 'active' | 'sold_out' | 'paused';
  saleStart?: string;
  saleEnd?: string;
  createdAt?: string;
}

export interface Vendor {
  _id: string;
  name: string;
  eventId?: string;
  category: string;
  contactName?: string;
  email?: string;
  phone?: string;
  contractValue: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  paid: boolean;
  createdAt?: string;
}

export interface Comm {
  _id: string;
  eventId: string;
  subject: string;
  body?: string;
  channel: 'email' | 'sms';
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  audience: string;
  createdAt?: string;
}
