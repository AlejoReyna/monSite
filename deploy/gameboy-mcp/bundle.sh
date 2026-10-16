#!/bin/sh
# Builds the minimal public-server release (no Next.js, no ROMs) into $1
# (default deploy/gameboy-mcp/dist). Copy that folder to the server and run
# `npm ci --omit=dev --ignore-scripts` there.
set -eu
root=$(cd "$(dirname "$0")/../.." && pwd)
out=${1:-"$root/deploy/gameboy-mcp/dist"}
rm -rf "$out"
mkdir -p "$out/scripts/gameboy-mcp" "$out/public/gameboy"
cp "$root/scripts/gameboy-mcp-remote.mjs" "$out/scripts/"
for file in bridge backups config png remote server tools; do cp "$root/scripts/gameboy-mcp/$file.mjs" "$out/scripts/gameboy-mcp/"; done
cp "$root/public/gameboy/ai-protocol.js" "$root/public/gameboy/backups.js" "$root/public/gameboy/package.json" "$out/public/gameboy/"
cp "$root/deploy/gameboy-mcp/package.json" "$root/deploy/gameboy-mcp/package-lock.json" "$root/deploy/gameboy-mcp/Dockerfile" "$root/deploy/gameboy-mcp/compose.yml" "$out/"
cp "$root/deploy/gameboy-mcp/Caddyfile" "$out/Caddyfile.mcp"
echo "Release ready in $out"
