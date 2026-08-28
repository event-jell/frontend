import { useParams, Navigate } from 'react-router-dom';

/**
 * @deprecated Merged into TicketingPage (/events/:id/ticketing)
 */
export default function RsvpManagementPage() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/events/${id}/ticketing`} replace />;
}
