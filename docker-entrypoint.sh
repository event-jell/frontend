#!/bin/sh
set -e

# Resolve API URL from any common variable name
RESOLVED_API_URL="${VITE_API_URL:-${API_URL:-${BACKEND_URL:-${REACT_APP_API_URL:-}}}}"
# Resolve Socket URL from any common variable name (or fallback to API URL if socket is on same server)
RESOLVED_SOCKET_URL="${VITE_SOCKET_URL:-${SOCKET_URL:-${REACT_APP_SOCKET_URL:-${RESOLVED_API_URL}}}}"

# Generate env.js with runtime environment variables
cat <<EOF > /usr/share/nginx/html/env.js
window.RUNTIME_ENV = {
  VITE_API_URL: "${RESOLVED_API_URL}",
  API_URL: "${RESOLVED_API_URL}",
  VITE_SOCKET_URL: "${RESOLVED_SOCKET_URL}",
  SOCKET_URL: "${RESOLVED_SOCKET_URL}"
};
EOF

# Execute the original command (e.g. nginx)
exec "$@"
