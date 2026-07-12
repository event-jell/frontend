#!/bin/sh
set -e

# Generate env.js with runtime environment variables
cat <<EOF > /usr/share/nginx/html/env.js
window.RUNTIME_ENV = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL:-}"
};
EOF

# Execute the original command (e.g. nginx)
exec "$@"
