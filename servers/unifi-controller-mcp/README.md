# UniFi Controller MCP (read-only)

Read-only data retriever for UniFi Network controllers (UniFi OS and classic). Provides TypeScript library functions and a simple CLI. MCP server wiring will be added next.

## Features (per spec)
- Multiple controller targets with independent auth, TLS, timeouts, rate limits.
- Auth flows: UniFi OS via `POST /api/auth/login` and classic via `POST /api/login`.
- Routing: UniFi OS under `/proxy/network/api/...`, classic under `/api/...`.
- Tools: list sites, health, sysinfo, devices, clients, events, alarms, reports.
- Read-only only. No mutations.

## Configure
Create `~/.config/unifi-controller-mcp/unifi-targets.json` with your controller configuration, or export `UNIFI_TARGETS` as JSON array, or create a `.env` file.

Example `~/.config/unifi-controller-mcp/unifi-targets.json`:

```json
[
  {
    "id": "udm-se",
    "base_url": "https://udm-se.local",
    "controller_type": "unifi_os",
    "default_site": "default",
    "auth": { "username": "${UNAME}", "password": "${PASS}" },
    "verify_ssl": false,
    "timeout_ms": 20000,
    "rate_limit_per_sec": 5
  },
  {
    "id": "cloud-key",
    "base_url": "https://unifi.example.com:8443",
    "controller_type": "classic",
    "default_site": "default",
    "auth": { "username": "${UNAME2}", "password": "${PASS2}" },
    "verify_ssl": false
  }
]
```

Example `.env`:

```
UNIFI_TARGETS=[
  {
    "id": "udm-se",
    "base_url": "https://udm-se.local",
    "controller_type": "unifi_os",
    "default_site": "default",
    "auth": { "username": "${UNAME}", "password": "${PASS}" },
    "verify_ssl": false,
    "timeout_ms": 20000,
    "rate_limit_per_sec": 5
  }
]
```

Note: For self-signed certs, set `verify_ssl=false`. Never commit secrets.

## Install & Build

```
npm install
npm run build
```

## Run CLI (list sites)

```
# ensure .env has UNIFI_TARGETS, then:
npm run start

# or dev mode with ts-node
yarn dev # or npm run dev
```

Expected output per target:

```
{
  "target": "udm-se",
  "sites": [{"id":"...","name":"default","desc":"Default"}]
}
```

## Library usage

```
import { loadTargets, HttpClient, listSites } from 'unifi-controller-mcp';
const targets = loadTargets();
const http = new HttpClient(targets[0]);
const res = await listSites(targets[0], http);
console.log(res.data);
```

## Next
- Add MCP server adapter using `@modelcontextprotocol/sdk`, exposing the read-only tools as MCP tools.
- Add tests and fixtures.

## Environment verification

Use the bundled script to confirm your `UNIFI_TARGETS` configuration and credentials:

```
npm run test:env
```

It prints each target, ensures TLS behavior matches your flags, and issues a `listSites` call to verify the controller accepts the provided login/API key. Failures will surface the HTTP status or parsing error so you can tune the env vars before running the MCP server.
