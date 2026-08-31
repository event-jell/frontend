import { io } from 'socket.io-client';

const runtimeEnv = (typeof window !== 'undefined' && (window as any).RUNTIME_ENV) || {};
const rawSocketUrl = (runtimeEnv.VITE_SOCKET_URL || import.meta.env.VITE_SOCKET_URL || '').trim();

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const safeSocketUrl =
  !isLocalhost && (rawSocketUrl.includes('localhost') || rawSocketUrl.includes('127.0.0.1'))
    ? (runtimeEnv.VITE_SOCKET_URL && !runtimeEnv.VITE_SOCKET_URL.includes('localhost')
        ? runtimeEnv.VITE_SOCKET_URL
        : (typeof window !== 'undefined' ? window.location.origin : ''))
    : rawSocketUrl;

const SOCKET_URL =
  safeSocketUrl.replace(/\/$/, '') ||
  (typeof window !== 'undefined'
    ? (isLocalhost ? 'http://127.0.0.1:3001' : window.location.origin)
    : '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
  // Re-read the token on every (re)connect attempt rather than baking in a
  // stale value, since this socket is a singleton created before login.
  auth: (cb) => cb({ token: localStorage.getItem('ej_token') }),
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
