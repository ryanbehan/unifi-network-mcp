#!/bin/bash
# Wrapper script for UniFi MCP server
# Set UNIFI_TARGETS from environment variable or secure source

set -euo pipefail

# Try to get UNIFI_TARGETS from multiple sources
if [ -z "${UNIFI_TARGETS:-}" ]; then
    # Try from ~/.config/unifi-controller-mcp/unifi-targets.json
    if [ -f "$HOME/.config/unifi-controller-mcp/unifi-targets.json" ]; then
        export UNIFI_TARGETS="$(cat "$HOME/.config/unifi-controller-mcp/unifi-targets.json")"
        echo "Loaded UNIFI_TARGETS from $HOME/.config/unifi-controller-mcp/unifi-targets.json" >&2
    # Try from ~/.unifi-targets.json (legacy)
    elif [ -f "$HOME/.unifi-targets.json" ]; then
        export UNIFI_TARGETS="$(cat "$HOME/.unifi-targets.json")"
        echo "Loaded UNIFI_TARGETS from $HOME/.unifi-targets.json (legacy location)" >&2
    # Try from ~/.config/unifi-targets.json (legacy)
    elif [ -f "$HOME/.config/unifi-targets.json" ]; then
        export UNIFI_TARGETS="$(cat "$HOME/.config/unifi-targets.json")"
        echo "Loaded UNIFI_TARGETS from $HOME/.config/unifi-targets.json (legacy location)" >&2
    else
        echo "ERROR: UNIFI_TARGETS not set and no config file found" >&2
        echo "Please set UNIFI_TARGETS environment variable or create ~/.config/unifi-controller-mcp/unifi-targets.json" >&2
        exit 1
    fi
fi

# Validate that UNIFI_TARGETS is valid JSON (if jq is available)
if command -v jq >/dev/null 2>&1; then
    if ! echo "$UNIFI_TARGETS" | jq empty >/dev/null 2>&1; then
        echo "ERROR: UNIFI_TARGETS is not valid JSON" >&2
        exit 1
    fi
fi

echo "UNIFI_TARGETS configured successfully" >&2

# Build if needed
if [ ! -f "dist/mcp.js" ]; then
    echo "Building MCP server..." >&2
    npm run build >&2
fi

# Run the MCP server directly so stdout is pure JSON RPC
exec node dist/mcp.js
