import { io } from 'socket.io-client';

// VITE_SOCKET_URL:
//   - local dev  → leave blank; falls back to http://localhost:3000
//   - docker/prod → set to backend origin e.g. http://localhost:3000 or https://api.eventjelly.com
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3000');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
