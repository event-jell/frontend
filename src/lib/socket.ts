import { io } from 'socket.io-client';

const runtimeEnv = (typeof window !== 'undefined' && (window as any).RUNTIME_ENV) || {};
const rawSocketUrl = (
  runtimeEnv.VITE_SOCKET_URL ||
  runtimeEnv.SOCKET_URL ||
  (import.meta.env as any).VITE_SOCKET_URL ||
  (import.meta.env as any).SOCKET_URL ||
  (import.meta.env as any).REACT_APP_SOCKET_URL ||
  runtimeEnv.VITE_API_URL ||
  runtimeEnv.API_URL ||
  (import.meta.env as any).VITE_API_URL ||
  (import.meta.env as any).API_URL ||
  ''
).trim();

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const safeSocketUrl =
  !isLocalhost && (rawSocketUrl.includes('localhost') || rawSocketUrl.includes('127.0.0.1'))
    ? (
        (runtimeEnv.VITE_SOCKET_URL && !runtimeEnv.VITE_SOCKET_URL.includes('localhost')) ? runtimeEnv.VITE_SOCKET_URL :
        (runtimeEnv.SOCKET_URL && !runtimeEnv.SOCKET_URL.includes('localhost')) ? runtimeEnv.SOCKET_URL :
        (runtimeEnv.VITE_API_URL && !runtimeEnv.VITE_API_URL.includes('localhost')) ? runtimeEnv.VITE_API_URL :
        (runtimeEnv.API_URL && !runtimeEnv.API_URL.includes('localhost')) ? runtimeEnv.API_URL :
        'https://backend.eventjell.com'
      )
    : (rawSocketUrl || (!isLocalhost && typeof window !== 'undefined' ? 'https://backend.eventjell.com' : ''));

const cleanSocketUrl = safeSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const SOCKET_URL =
  cleanSocketUrl ||
  (typeof window !== 'undefined'
    ? (isLocalhost ? 'http://127.0.0.1:3001' : 'https://backend.eventjell.com')
    : 'https://backend.eventjell.com');

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
