import { Toaster, toast } from 'sonner';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

function RsvpRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/events/${id}/invite`} replace />;
}
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import AppShell from './layouts/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { socket } from './lib/socket';
import { getFriendlyErrorMessage } from './lib/api';

// Code-split pages for high-performance lazy loading
const EventsPage = lazy(() => import('./pages/EventsPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const EventDashboardPage = lazy(() => import('./pages/EventDashboardPage'));
const GuestsPage = lazy(() => import('./pages/GuestsPage'));
const TicketingPage = lazy(() => import('./pages/TicketingPage'));
const VendorsPage = lazy(() => import('./pages/VendorsPage'));
const EventComPage = lazy(() => import('./pages/EventComPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EventInvitePage = lazy(() => import('./pages/EventInvitePage'));
const TicketGuestsPage = lazy(() => import('./pages/TicketGuestsPage'));
const GuestDetailPage = lazy(() => import('./pages/GuestDetailPage'));
const EventSettingsPage = lazy(() => import('./pages/EventSettingsPage'));
const CreateTicketPage = lazy(() => import('./pages/CreateTicketPage'));
const EditTicketPage = lazy(() => import('./pages/EditTicketPage'));
const EventOnboardingPage = lazy(() => import('./pages/EventOnboardingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'));
const CheckInScannerPage = lazy(() => import('./pages/CheckInScannerPage'));
const CheckInDashboardPage = lazy(() => import('./pages/CheckInDashboardPage'));
const GuestEventPassPage = lazy(() => import('./pages/GuestEventPassPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const VendorHubPage = lazy(() => import('./pages/VendorHubPage'));
const CreateVendorListingPage = lazy(() => import('./pages/CreateVendorListingPage'));
const VendorProfilePage = lazy(() => import('./pages/VendorProfilePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const GuestPassesPage = lazy(() => import('./pages/GuestPassesPage'));

function PageLoader() {
  return (
    <div className="min-h-[70vh] p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
        <div className="h-4 w-28 bg-slate-200 rounded-full" />
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="h-3.5 w-96 max-w-full bg-slate-100 rounded-lg" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="h-8 w-8 bg-slate-100 rounded-xl" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-6 w-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content Section Skeleton */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="h-5 w-44 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="h-32 bg-slate-100 rounded-xl" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const handleError = (error: any, v2?: any, v3?: any, v4?: any) => {
  const meta = v4?.meta || v2?.meta; // v4 is mutation for MutationCache, v2 is query for QueryCache
  if (meta?.suppressGlobalErrorToast) return;
  const message = getFriendlyErrorMessage(error);
  toast.error(message);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({ 
    onError: handleError,
    onSuccess: (_, __, ___, mutation) => {
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage as string);
      }
    }
  }),
  queryCache: new QueryCache({ onError: handleError }),
});

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  const { token } = useAuth();
  useEffect(() => {
    const handleGuestUpdate = () => queryClient.invalidateQueries({ queryKey: ['guests'] });
    const handleTicketUpdate = () => queryClient.invalidateQueries({ queryKey: ['tickets'] });
    const handleEventUpdate = () => queryClient.invalidateQueries({ queryKey: ['events'] });
    const handleFloorPlanUpdate = () => queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    const handleVendorUpdate = () => queryClient.invalidateQueries({ queryKey: ['vendors'] });
    const handleCommUpdate = () => queryClient.invalidateQueries({ queryKey: ['comms'] });

    socket.on('guest-created', handleGuestUpdate);
    socket.on('guest-updated', handleGuestUpdate);
    socket.on('guest-deleted', handleGuestUpdate);

    socket.on('ticket-created', handleTicketUpdate);
    socket.on('ticket-updated', handleTicketUpdate);
    socket.on('ticket-deleted', handleTicketUpdate);

    socket.on('event-created', handleEventUpdate);
    socket.on('event-updated', handleEventUpdate);
    socket.on('event-deleted', handleEventUpdate);

    socket.on('floor-plan-created', handleFloorPlanUpdate);
    socket.on('floor-plan-updated', handleFloorPlanUpdate);
    socket.on('floor-plan-deleted', handleFloorPlanUpdate);

    socket.on('vendor-created', handleVendorUpdate);
    socket.on('vendor-updated', handleVendorUpdate);
    socket.on('vendor-deleted', handleVendorUpdate);

    socket.on('comm-created', handleCommUpdate);
    socket.on('comm-updated', handleCommUpdate);
    socket.on('comm-deleted', handleCommUpdate);

    return () => {
      socket.off('guest-created', handleGuestUpdate);
      socket.off('guest-updated', handleGuestUpdate);
      socket.off('guest-deleted', handleGuestUpdate);

      socket.off('ticket-created', handleTicketUpdate);
      socket.off('ticket-updated', handleTicketUpdate);
      socket.off('ticket-deleted', handleTicketUpdate);

      socket.off('event-created', handleEventUpdate);
      socket.off('event-updated', handleEventUpdate);
      socket.off('event-deleted', handleEventUpdate);

      socket.off('floor-plan-created', handleFloorPlanUpdate);
      socket.off('floor-plan-updated', handleFloorPlanUpdate);
      socket.off('floor-plan-deleted', handleFloorPlanUpdate);

      socket.off('vendor-created', handleVendorUpdate);
      socket.off('vendor-updated', handleVendorUpdate);
      socket.off('vendor-deleted', handleVendorUpdate);

      socket.off('comm-created', handleCommUpdate);
      socket.off('comm-updated', handleCommUpdate);
      socket.off('comm-deleted', handleCommUpdate);
    };
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/events/:id/rsvp" element={<RsvpRedirect />} />
        <Route path="/events/:id/invite" element={<EventInvitePage />} />
        <Route path="/events/:id/pass/:guestId" element={<GuestEventPassPage />} />
        <Route path="/my-passes" element={<GuestPassesPage />} />
        <Route path="/invitations/accept/:token" element={<AcceptInvitePage />} />
        <Route path="/explore" element={token ? <Shell><ExplorePage /></Shell> : <ExplorePage />} />
        <Route path="/vendors/:listingId" element={token ? <Shell><VendorProfilePage /></Shell> : <VendorProfilePage />} />
        <Route path="/vendor/listings/:listingId" element={token ? <Shell><VendorProfilePage /></Shell> : <VendorProfilePage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Shell><DashboardPage /></Shell>} />
          <Route path="/wallet" element={<Shell><WalletPage /></Shell>} />
          <Route path="/vendor/listings" element={<Shell><VendorHubPage /></Shell>} />
          <Route path="/vendor/listings/new" element={<Shell><CreateVendorListingPage /></Shell>} />
          <Route path="/vendors" element={<Shell><VendorHubPage /></Shell>} />
          <Route path="/vendors/new" element={<Shell><CreateVendorListingPage /></Shell>} />
          <Route path="/vendor-hub/new" element={<Shell><CreateVendorListingPage /></Shell>} />
          <Route path="/events" element={<Shell><EventsPage /></Shell>} />
          <Route path="/events/new" element={<Shell><CreateEventPage /></Shell>} />
          <Route path="/events/onboarding" element={<EventOnboardingPage />} />
          <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />

          <Route path="/events/:id" element={<Shell><EventDashboardPage /></Shell>} />
          <Route path="/events/:id/planner" element={<Shell><PlannerPage /></Shell>} />
          <Route path="/events/:id/guests" element={<Shell><GuestsPage /></Shell>} />
          <Route path="/events/:id/ticketing" element={<Shell><TicketingPage /></Shell>} />
          <Route path="/events/:id/ticketing/new" element={<Shell><CreateTicketPage /></Shell>} />
          <Route path="/events/:id/ticketing/:ticketId" element={<Shell><TicketGuestsPage /></Shell>} />
          <Route path="/events/:id/ticketing/:ticketId/edit" element={<Shell><EditTicketPage /></Shell>} />
          <Route path="/events/:id/checkin" element={<CheckInScannerPage />} />
          <Route path="/events/:id/checkin-dashboard" element={<Shell><CheckInDashboardPage /></Shell>} />
          <Route path="/events/:id/guests/:guestId" element={<Shell><GuestDetailPage /></Shell>} />
          <Route path="/events/:id/vendors" element={<Shell><VendorsPage /></Shell>} />
          <Route path="/events/:id/vendors/marketplace/:listingId" element={<Shell><VendorProfilePage /></Shell>} />
          <Route path="/events/:id/vendors/:listingId" element={<Shell><VendorProfilePage /></Shell>} />
          <Route path="/messages" element={<Shell><MessagesPage /></Shell>} />
          <Route path="/messages/:conversationId" element={<Shell><MessagesPage /></Shell>} />
          <Route path="/events/:id/event-com" element={<Shell><EventComPage /></Shell>} />
          <Route path="/events/:id/reports" element={<Shell><ReportsPage /></Shell>} />
          <Route path="/events/:id/settings" element={<Shell><EventSettingsPage /></Shell>} />
        </Route>

        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PreferencesProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toaster position="top-right" richColors closeButton />
            </BrowserRouter>
          </PreferencesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
