import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export interface PresenceUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  socketId: string;
}

const COLORS = [
  '#0F6E56', '#185FA5', '#7C3AED', '#DB2777',
  '#D97706', '#059669', '#DC2626', '#2563EB',
];

function colorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function usePresence(
  room: string | undefined,
  user: { id: string; firstName: string; lastName: string } | null,
): PresenceUser[] {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!room || !user) return;

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    const payload = {
      room,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        initials,
        color: colorFor(user.id),
      },
    };

    socket.emit('presence:join', payload);

    const handleUpdate = (list: PresenceUser[]) => setUsers(list);
    socket.on('presence:update', handleUpdate);

    return () => {
      socket.emit('presence:leave', { room });
      socket.off('presence:update', handleUpdate);
      setUsers([]);
    };
  }, [room, user?.id]);

  return users;
}
