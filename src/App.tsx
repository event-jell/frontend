import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppShell from './layouts/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import EventDashboardPage from './pages/EventDashboardPage';
import GuestsPage from './pages/GuestsPage';
import TicketingPage from './pages/TicketingPage';
import VendorsPage from './pages/VendorsPage';
import EventComPage from './pages/EventComPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import EventInvitePage from './pages/EventInvitePage';
import TicketGuestsPage from './pages/TicketGuestsPage';
import GuestDetailPage from './pages/GuestDetailPage';
import NewFloorPlanPage from './pages/NewFloorPlanPage';
import EventSettingsPage from './pages/EventSettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import { socket } from './lib/socket';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
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
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/events" element={<Shell><EventsPage /></Shell>} />
        <Route path="/floor-plans" element={<Shell><HomePage /></Shell>} />
        <Route path="/floor-plans/new" element={<Shell><NewFloorPlanPage /></Shell>} />
        <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />

        <Route path="/events/:id" element={<Shell><EventDashboardPage /></Shell>} />
        <Route path="/events/:id/invite" element={<EventInvitePage />} />
        <Route path="/events/:id/planner" element={<Shell><PlannerPage /></Shell>} />
        <Route path="/events/:id/guests" element={<Shell><GuestsPage /></Shell>} />
        <Route path="/events/:id/ticketing" element={<Shell><TicketingPage /></Shell>} />
        <Route path="/events/:id/ticketing/:ticketId" element={<Shell><TicketGuestsPage /></Shell>} />
        <Route path="/events/:id/guests/:guestId" element={<Shell><GuestDetailPage /></Shell>} />
        <Route path="/events/:id/vendors" element={<Shell><VendorsPage /></Shell>} />
        <Route path="/events/:id/event-com" element={<Shell><EventComPage /></Shell>} />
        <Route path="/events/:id/reports" element={<Shell><ReportsPage /></Shell>} />
        <Route path="/events/:id/settings" element={<Shell><EventSettingsPage /></Shell>} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PreferencesProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
