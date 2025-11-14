import type { TargetConfig, ResultEnvelope, Site } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { controllerPath, integrationPath } from '../router.js';

export async function listSites(target: TargetConfig, http: HttpClient, raw = false): Promise<ResultEnvelope<Site[]>> {
  await ensureSession(target, http);
  const isApiKey = (target as any).auth && (target as any).auth.apiKey;
  const tryPaths: string[] = [];
  if (isApiKey) {
    // Prefer Integration API when API key is provided
    tryPaths.push(integrationPath(target, 'sites'));
  } else {
    if (target.controller_type === 'unifi_os') {
      tryPaths.push(controllerPath(target, 'self/sites', true));
      tryPaths.push(controllerPath(target, 'self/sites', false));
    } else {
      tryPaths.push(controllerPath(target, 'self/sites', false));
    }
  }

  let lastErr: any;
  for (const p of tryPaths) {
    const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: p });
    if (res.status >= 200 && res.status < 300 && res.data) {
      // Integration API returns array at top-level, controller API returns { data: [] }
      const arr = Array.isArray((res as any).data) ? (res as any).data : (res as any).data?.data;
      if (Array.isArray(arr)) {
        const sites: Site[] = arr.map((s: any) => ({
          id: s._id || s.name || s.id || s._id,
          name: s.name || s.desc || s.display_name || s.id,
          desc: s.desc || s.description
        }));
        return { data: sites, ...(raw ? { raw: res.data } : {}) };
      }
    }
    lastErr = new Error(`HTTP ${res.status}`);
  }
  throw lastErr;
}
