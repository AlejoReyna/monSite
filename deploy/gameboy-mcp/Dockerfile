# Public Game Boy MCP server. Build context: the folder made by bundle.sh.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY scripts ./scripts
COPY public ./public
USER node
EXPOSE 8787
# The port is never published: only Caddy reaches it over the Docker network.
CMD ["node", "--max-old-space-size=256", "scripts/gameboy-mcp-remote.mjs", "--listen-host", "0.0.0.0", "--port", "8787", "--trust-proxy"]
