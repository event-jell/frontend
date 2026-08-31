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

# If BACKEND_PROXY_URL or internal BACKEND_URL is set, configure Nginx to proxy /api and /socket.io
PROXY_TARGET="${BACKEND_PROXY_URL:-}"
if [ -n "$PROXY_TARGET" ]; then
cat <<EOF > /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1024;

    location /api/ {
        proxy_pass ${PROXY_TARGET};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass ${PROXY_TARGET};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
fi

# Execute the original command (e.g. nginx)
exec "$@"
