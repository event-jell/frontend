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
  eventId?: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  elements: PlacedElement[];
  rooms: Room[];
  thumbnail?: string;
  status: 'draft' | 'published';
  isTemplate?: boolean;
  isPublic?: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
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

export interface RsvpField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'phone' | 'email';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Event {
  _id: string;
  slug?: string;
  name: string;
  description?: string;
  venue: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  dates?: { date: string; startTime: string; endTime: string }[];
  status: 'draft' | 'planning' | 'confirmed' | 'live';
  type?: 'wedding' | 'conference' | 'gala' | 'concert' | 'festival' | 'fundraiser' | 'corporate' | 'other';
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
  rsvpFields?: RsvpField[];
  rsvpDisabled?: boolean;
  currency?: string;
  qrScans?: number;
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
  customFields?: Record<string, string>;
  dateResponded?: string;
  createdAt?: string;
}

export interface Ticket {
  _id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  total: number;
  sold: number;
  status: 'active' | 'sold_out' | 'paused';
  saleStart?: string;
  saleEnd?: string;
  qrScans?: number;
  rsvpDisabled?: boolean;
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

export interface CollaboratorPermissions {
  canEditDetails: boolean;
  canManageFloorPlan: boolean;
  canManageGuests: boolean;
  canManageTickets: boolean;
  canManageVendors: boolean;
  canManageComms: boolean;
  canManageTeam: boolean;
  canCheckInGuests?: boolean;
}

export type CollaboratorRole = 'admin' | 'editor' | 'viewer' | 'floor_planner' | 'guest_coordinator' | 'check_in_staff' | 'vendor_manager' | 'custom';

export interface Collaborator {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permissions?: CollaboratorPermissions;
  status: 'active' | 'pending';
  token?: string;
  expires_at?: string;
}

// ─── Check-In & Scanner Types ───────────────────────────────────────────────

export type ScanResultType =
  | 'VALID'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_TOKEN'
  | 'WRONG_EVENT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'UNAUTHORIZED_SCANNER';

export interface CheckInGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tableAssignment?: string;
  dietaryReqs?: string;
  group?: string;
  plusOnes: number;
  checkedIn: boolean;
  checkedInAt?: string;
  rsvpStatus?: string;
  ticketId?: string;
  ticketName?: string;
  ticketPrice?: number;
  ticketCurrency?: string;
  photoUrl?: string;
}

export interface CheckInValidateResponse {
  isValid: boolean;
  scanResult: ScanResultType;
  message: string;
  checkedInAt?: string;
  checkedInBy?: string;
  expectedEvent?: string;
  guest?: CheckInGuest;
  ticket?: {
    id: string;
    name: string;
    price: number;
    currency?: string;
  } | null;
}

export interface CheckInConfirmResponse {
  success: boolean;
  scanResult: ScanResultType;
  message: string;
  checkedInAt?: string;
  checkedInBy?: string;
  guest?: CheckInGuest;
}

export interface CheckInTierStat {
  id: string;
  name: string;
  total: number;
  checkedIn: number;
  isVip: boolean;
}

export interface CheckInRecentItem {
  guestId: string;
  name: string;
  ticketName: string;
  tableAssignment?: string;
  checkedInAt?: string;
  method: 'qr' | 'manual' | 'nfc';
}

export interface CheckInAlertItem {
  id: string;
  scanResult: ScanResultType;
  failureReason?: string;
  guestName?: string;
  ticketName?: string;
  timestamp: string;
  method: 'qr' | 'manual' | 'nfc';
}

export interface CheckInStats {
  totalExpected: number;
  checkedInCount: number;
  remainingCount: number;
  checkInPercentage: number;
  tierStats: CheckInTierStat[];
  recentCheckIns: CheckInRecentItem[];
  recentAlerts: CheckInAlertItem[];
  eventConfig?: {
    require_photo_verification?: boolean;
    allow_multiple_entries?: boolean;
    dynamic_qr_enabled?: boolean;
    dynamic_qr_interval_seconds?: number;
  };
}

export interface CheckInAuditLog {
  _id: string;
  event_id: string;
  guest_id?: string;
  ticket_id?: string;
  scanner_user_id: string;
  scanner_device_id?: string;
  scan_result: ScanResultType;
  failure_reason?: string;
  timestamp: string;
  guest_name?: string;
  ticket_name?: string;
  method: 'qr' | 'manual' | 'nfc';
}

export interface GuestPassData {
  guest: {
    id: string;
    name: string;
    email?: string;
    tableAssignment?: string;
    dietary?: string;
    group?: string;
    plusOnes: number;
    checkedIn: boolean;
    checkedInAt?: string;
    photoUrl?: string;
  };
  ticket?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
  } | null;
  event: {
    id: string;
    slug?: string;
    name: string;
    venue: string;
    date: string;
    startTime?: string;
    endTime?: string;
    coverImage?: string;
    currency?: string;
  };
  qrToken: string;
  dynamicQrEnabled: boolean;
  expiresInSeconds?: number;
  intervalSeconds?: number;
}

// ─── Wallet & Financial Types ───────────────────────────────────────────────

export interface PayoutAccount {
  id: string;
  type: 'bank_transfer' | 'paypal' | 'paystack';
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  bank_code?: string;
  paypal_email?: string;
  is_default: boolean;
  created_at: string;
}

export interface Wallet {
  _id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  pin_set: boolean;
  payout_accounts: PayoutAccount[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  _id: string;
  wallet_id: string;
  user_id: string;
  reference: string;
  type: 'ticket_sale' | 'vendor_payout' | 'deposit' | 'withdrawal' | 'refund' | 'fee';
  direction: 'credit' | 'debit';
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  metadata?: Record<string, any>;
  completed_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  wallet: Wallet;
  recent_transactions: WalletTransaction[];
  metrics: {
    available_balance: number;
    total_earned: number;
    total_withdrawn: number;
    pending_balance: number;
    withdrawals_count: number;
    deposits_count: number;
  };
}

// ─── Vendor Marketplace & Listing Types ─────────────────────────────────────

export type VendorCategoryType =
  | 'dj'
  | 'caterer'
  | 'event_planner'
  | 'decorator'
  | 'equipment_rental'
  | 'venue'
  | 'photographer'
  | 'videographer'
  | 'mc_host'
  | 'makeup_artist'
  | 'baker'
  | 'florist'
  | 'security'
  | 'transportation'
  | 'entertainment'
  | 'other';

export interface VendorCategoryInfo {
  id: VendorCategoryType;
  name: string;
  icon: string;
  desc: string;
}

export interface VendorListing {
  _id: string;
  owner_id: string;
  title: string;
  tagline: string;
  category: VendorCategoryType;
  description: string;
  pricing_type: 'fixed' | 'hourly' | 'starting_at' | 'custom_quote';
  base_price: number;
  currency: string;
  cover_image: string;
  gallery_images: string[];
  location: string;
  service_radius_km: number;
  amenities: string[];
  status: 'published' | 'draft' | 'paused';
  rating: number;
  reviews_count: number;
  views_count: number;
  inquiries_count: number;
  bookings_count: number;
  deposit_percentage: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  instagram?: string;
  cancellation_policy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorListingsResponse {
  listings: VendorListing[];
  metrics: {
    total_listings: number;
    published_listings: number;
    total_views: number;
    total_inquiries: number;
    total_bookings: number;
  };
}

// ─── Dashboard Summary Types ────────────────────────────────────────────────

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  time: string;
  status: string;
  icon: string;
}

export interface DashboardSummary {
  wallet: Wallet;
  metrics: {
    available_balance: number;
    total_earned: number;
    total_withdrawn: number;
    pending_balance: number;
    total_events: number;
    active_events: number;
    total_guests: number;
    total_checked_in: number;
    vendor_listings_count: number;
    vendor_published_count: number;
    vendor_views_count: number;
    vendor_inquiries_count: number;
  };
  vendor_listings: VendorListing[];
  recent_events: Event[];
  recent_transactions: WalletTransaction[];
  recent_activities: DashboardActivity[];
}



// ─── Chat & Messaging Types ──────────────────────────────────────────────────

export interface ChatMessage {
  _id: string;
  sender_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | string;
  recipient_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | string;
  conversation_id: string;
  vendor_listing_id?: {
    _id: string;
    title: string;
    category: string;
    cover_image?: string;
    base_price: number;
    currency: string;
  };
  content: string;
  message_type?: 'text' | 'offer' | 'invoice';
  offer_amount?: number;
  offer_status?: 'pending' | 'accepted' | 'declined';
  invoice_amount?: number;
  invoice_currency?: string;
  invoice_status?: 'pending' | 'paid' | 'failed';
  invoice_description?: string;
  invoice_payment_reference?: string;
  read: boolean;
  read_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  conversation_id: string;
  other_user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  vendor_listing?: {
    _id: string;
    title: string;
    category: string;
    cover_image?: string;
    base_price: number;
    currency: string;
  } | null;
  last_message: {
    _id: string;
    content: string;
    sender_id: string;
    createdAt: string;
    read: boolean;
  };
  unread_count: number;
}
