import { io } from 'socket.io-client';

// Since frontend is on 5173 and backend is on 3000 during dev
const SOCKET_URL = import.meta.env.MODE === 'production' ? '/' : 'http://localhost:3001';

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
