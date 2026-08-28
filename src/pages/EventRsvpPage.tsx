import { useParams, Navigate } from 'react-router-dom';

/**
 * @deprecated Merged into EventInvitePage (/events/:id/invite)
 */
export default function EventRsvpPage() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/events/${id}/invite`} replace />;
}
